import webpush from 'web-push';
import { config } from './config';
import { pool } from './db';

export const pushEnabled = Boolean(config.vapidPublic && config.vapidPrivate);
if (pushEnabled) webpush.setVapidDetails(config.vapidSubject, config.vapidPublic, config.vapidPrivate);

export async function notifyOrderReady(order: { id: string; orderNumber: string }, businessName: string) {
  if (!pushEnabled) return;
  const { rows } = await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE order_id = $1',
    [order.id],
  );
  console.log(`push ${order.orderNumber}: ${rows.length} subscription(s)`);
  const payload = JSON.stringify({
    title: 'Your order is ready!',
    body: `Order ${order.orderNumber} is ready for collection at ${businessName}.`,
    tag: `order-${order.id}`, // same tag replaces an earlier notification instead of stacking
  });
  await Promise.all(
    rows.map(async (s) => {
      try {
        const r = await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 3600, urgency: 'high' },
        );
        console.log(`push ${order.orderNumber}: accepted ${r.statusCode} by ${new URL(s.endpoint).host}`);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [s.id]);
        } else {
          console.error('push failed', err?.statusCode ?? err?.message);
        }
      }
    }),
  );
}

export async function purgeExpired() {
  await pool.query(
    `DELETE FROM push_subscriptions ps USING orders o
     WHERE ps.order_id = o.id
       AND ((o.completed_at < now() - make_interval(hours => $1))
         OR (o.cancelled_at < now() - make_interval(hours => $1))
         OR (ps.expires_at IS NOT NULL AND ps.expires_at < now()))`,
    [config.retentionHours],
  );
}
