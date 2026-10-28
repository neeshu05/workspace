import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { pool } from '../db';
import { eventsAfter, openStream, subscribeCustomer, writeEvent } from '../events';
import { HttpError } from '../orders';
import { pushEnabled } from '../push';

export const customerRouter = Router();

const TOKEN = /^[A-Za-z0-9_-]{20,64}$/;

async function findOrder(token: string) {
  if (!TOKEN.test(token)) throw new HttpError(404, 'Order not found');
  const { rows } = await pool.query(
    `SELECT o.id, o.business_id, o.order_number, o.status, b.name, b.logo_url, b.brand_color, b.ready_message
     FROM orders o JOIN businesses b ON b.id = o.business_id WHERE o.token = $1`,
    [token],
  );
  if (!rows[0]) throw new HttpError(404, 'Order not found');
  return rows[0];
}

customerRouter.get('/push/key', (_req, res) => {
  res.json({ publicKey: pushEnabled ? config.vapidPublic : null });
});

const subscribe = z.object({
  token: z.string(),
  subscription: z.object({
    endpoint: z.string().url().max(2000),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
  }),
});

customerRouter.post('/push/subscribe', async (req, res) => {
  const { token, subscription: s } = subscribe.parse(req.body);
  const order = await findOrder(token);
  await pool.query(
    `INSERT INTO push_subscriptions (order_id, business_id, endpoint, p256dh, auth, expires_at)
     VALUES ($1,$2,$3,$4,$5, to_timestamp($6::double precision / 1000))
     ON CONFLICT (endpoint) DO UPDATE
       SET order_id = EXCLUDED.order_id, business_id = EXCLUDED.business_id,
           p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, expires_at = EXCLUDED.expires_at`,
    [order.id, order.business_id, s.endpoint, s.keys.p256dh, s.keys.auth, s.expirationTime ?? null],
  );
  res.status(201).json({ ok: true });
});

customerRouter.get('/orders/:token', async (req, res) => {
  const o = await findOrder(req.params.token);
  res.json({
    orderNumber: o.order_number,
    status: o.status,
    business: { name: o.name, logoUrl: o.logo_url, brandColor: o.brand_color },
    readyMessage: o.ready_message,
  });
});

customerRouter.get('/orders/:token/events', async (req, res) => {
  const o = await findOrder(req.params.token);
  openStream(res);
  subscribeCustomer(o.id, res);
  // EventSource sends Last-Event-ID on reconnect; replay what was missed. Clients also refetch status.
  const last = Number(req.headers['last-event-id']);
  if (Number.isInteger(last) && last > 0) {
    for (const e of await eventsAfter(o.id, last)) writeEvent(res, e, 'customer');
  }
});
