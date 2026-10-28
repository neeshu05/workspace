import { Router } from 'express';
import { config } from '../config';
import { requireAuth } from '../auth';
import { openStream, subscribeStaff } from '../events';
import { pool } from '../db';
import { Action, applyAction, createOrder, toDto } from '../orders';

export const staffRouter = Router();
staffRouter.use(requireAuth);

const withUrl = (o: ReturnType<typeof toDto>) => ({ ...o, trackUrl: `${config.publicUrl}/t/${o.token}` });

staffRouter.post('/orders', async (req, res) => {
  res.status(201).json(withUrl(await createOrder(req.session!.businessId)));
});

staffRouter.get('/orders', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE business_id = $1 AND ($2::text IS NULL OR status = $2)
     ORDER BY created_at DESC LIMIT 200`,
    [req.session!.businessId, status ?? null],
  );
  res.json(rows.map((r) => withUrl(toDto(r))));
});

// Declared before /:id routes so "events" is never read as an order id.
staffRouter.get('/events', (req, res) => {
  openStream(res);
  subscribeStaff(req.session!.businessId, res);
});

const actions: Action[] = ['call', 'resend', 'complete', 'cancel'];
for (const action of actions) {
  staffRouter.post(`/orders/:id/${action}`, async (req, res) => {
    const id = req.params.id;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(404).json({ error: 'Order not found' });
    res.json(withUrl(await applyAction(req.session!.businessId, id, action)));
  });
}
