import crypto from 'node:crypto';
import { Response } from 'express';
import { Client } from 'pg';
import { config } from './config';
import { pool } from './db';

export type OrderEvent = {
  id: number;
  orderId: string;
  businessId: string;
  type: string;
  payload: Record<string, unknown>;
};

const CHANNEL = 'order_events';
const instanceId = crypto.randomUUID();

// order id -> customer streams, business id -> staff streams
const customerStreams = new Map<string, Set<Response>>();
const staffStreams = new Map<string, Set<Response>>();

function add(map: Map<string, Set<Response>>, key: string, res: Response) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(res);
  res.on('close', () => {
    map.get(key)?.delete(res);
    if (map.get(key)?.size === 0) map.delete(key);
  });
}

export function openStream(res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // stop nginx-style proxies buffering the stream
  });
  // Padding pushes past proxy/CDN buffers so the first events are not held back.
  res.write(`: ${' '.repeat(2048)}\n\nretry: 3000\n\n`);
  const heartbeat = setInterval(() => res.write(': hb\n\n'), 10_000);
  res.on('close', () => clearInterval(heartbeat));
}

export function writeEvent(res: Response, e: OrderEvent, view: 'customer' | 'staff') {
  const data =
    view === 'customer'
      ? { orderNumber: e.payload.orderNumber, status: e.payload.status, resend: e.payload.resend ?? false }
      : e.payload;
  res.write(`id: ${e.id}\nevent: ${e.type}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function subscribeCustomer(orderId: string, res: Response) {
  add(customerStreams, orderId, res);
}
export function subscribeStaff(businessId: string, res: Response) {
  add(staffStreams, businessId, res);
}

const toEvent = (r: any): OrderEvent => ({
  id: Number(r.id),
  orderId: r.order_id,
  businessId: r.business_id,
  type: r.type,
  payload: r.payload,
});

export async function eventsAfter(orderId: string, afterId: number): Promise<OrderEvent[]> {
  const { rows } = await pool.query(
    `SELECT id, order_id, business_id, type, payload FROM order_events
     WHERE order_id = $1 AND id > $2 ORDER BY id`,
    [orderId, afterId],
  );
  return rows.map(toEvent);
}

function dispatch(e: OrderEvent) {
  customerStreams.get(e.orderId)?.forEach((res) => writeEvent(res, e, 'customer'));
  staffStreams.get(e.businessId)?.forEach((res) => writeEvent(res, e, 'staff'));
}

/** Call only after the DB transaction that wrote the event has committed. */
export async function publish(e: OrderEvent) {
  dispatch(e);
  // Fan out to other backend instances; they load the row by id.
  await pool.query('SELECT pg_notify($1, $2)', [CHANNEL, `${instanceId}:${e.id}`]).catch(() => {});
}

/** LISTEN so events published by other instances reach streams held by this one. */
export async function startListener() {
  let timer: NodeJS.Timeout | undefined;
  const retry = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      connect().catch(retry);
    }, 3000);
  };
  const connect = async () => {
    const client = new Client({ connectionString: config.databaseUrl });
    client.on('error', retry);
    client.on('end', retry);
    client.on('notification', async (msg) => {
      const [origin, id] = (msg.payload ?? '').split(':');
      if (origin === instanceId) return;
      const { rows } = await pool.query(
        'SELECT id, order_id, business_id, type, payload FROM order_events WHERE id = $1',
        [id],
      );
      if (rows[0]) dispatch(toEvent(rows[0]));
    });
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
  };
  await connect().catch(retry);
}
