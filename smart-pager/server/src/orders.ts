import crypto from 'node:crypto';
import { PoolClient } from 'pg';
import { pool, tx } from './db';
import { OrderEvent, publish } from './events';
import { notifyOrderReady } from './push';

export type Action = 'call' | 'resend' | 'complete' | 'cancel';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const toDto = (r: any) => ({
  id: r.id as string,
  orderNumber: r.order_number as string,
  token: r.token as string,
  status: r.status as string,
  createdAt: r.created_at,
  readyAt: r.ready_at,
  completedAt: r.completed_at,
  cancelledAt: r.cancelled_at,
});

async function record(c: PoolClient, row: any, type: string, extra: Record<string, unknown> = {}) {
  const payload = { orderId: row.id, orderNumber: row.order_number, status: row.status, order: toDto(row), ...extra };
  const { rows } = await c.query(
    'INSERT INTO order_events (order_id, business_id, type, payload) VALUES ($1,$2,$3,$4) RETURNING id',
    [row.id, row.business_id, type, payload],
  );
  return { id: Number(rows[0].id), orderId: row.id, businessId: row.business_id, type, payload } as OrderEvent;
}

export async function createOrder(businessId: string) {
  const { event, row } = await tx(async (c) => {
    // Atomic per-business counter; the row lock also serialises concurrent creates.
    const { rows: b } = await c.query(
      `UPDATE businesses SET order_counter = order_counter + 1 WHERE id = $1
       RETURNING order_prefix, order_counter`,
      [businessId],
    );
    if (!b[0]) throw new HttpError(404, 'Business not found');
    const number = `${b[0].order_prefix}${100 + b[0].order_counter}`;
    const token = crypto.randomBytes(24).toString('base64url');
    const { rows } = await c.query(
      'INSERT INTO orders (business_id, order_number, token) VALUES ($1,$2,$3) RETURNING *',
      [businessId, number, token],
    );
    return { row: rows[0], event: await record(c, rows[0], 'order-created') };
  });
  await publish(event);
  return toDto(row);
}

const TARGET = { call: 'ready', complete: 'completed', cancel: 'cancelled' } as const;
const FROM = { call: 'preparing', resend: 'ready', complete: 'ready', cancel: 'preparing' } as const;
const COLUMN = { call: 'ready_at', complete: 'completed_at', cancel: 'cancelled_at' } as const;
const EVENT = { call: 'order-ready', complete: 'order-completed', cancel: 'order-cancelled' } as const;

/** Repeating an already-applied action is a no-op, so double taps are safe. */
export async function applyAction(businessId: string, orderId: string, action: Action) {
  const result = await tx(async (c) => {
    const { rows } = await c.query('SELECT * FROM orders WHERE id = $1 AND business_id = $2 FOR UPDATE', [
      orderId,
      businessId,
    ]);
    const order = rows[0];
    if (!order) throw new HttpError(404, 'Order not found');

    if (action === 'resend') {
      if (order.status !== FROM.resend) throw new HttpError(409, `Cannot resend an order that is ${order.status}`);
      return { row: order, event: await record(c, order, 'order-resent', { resend: true }), notify: true };
    }
    if (order.status === TARGET[action]) return { row: order, event: null, notify: false };
    if (order.status !== FROM[action]) throw new HttpError(409, `Cannot ${action} an order that is ${order.status}`);

    const { rows: upd } = await c.query(
      `UPDATE orders SET status = $2, ${COLUMN[action]} = now() WHERE id = $1 RETURNING *`,
      [orderId, TARGET[action]],
    );
    return { row: upd[0], event: await record(c, upd[0], EVENT[action]), notify: action === 'call' };
  });

  if (result.event) await publish(result.event);
  if (result.notify) {
    const { rows } = await pool.query('SELECT name FROM businesses WHERE id = $1', [businessId]);
    // Best-effort and not awaited: the staff response must not wait on push services.
    notifyOrderReady({ id: result.row.id, orderNumber: result.row.order_number }, rows[0].name).catch((e) =>
      console.error('notify failed', e),
    );
  }
  return toDto(result.row);
}
