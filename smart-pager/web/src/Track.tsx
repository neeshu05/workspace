import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, Status } from './api';

type Order = {
  orderNumber: string;
  status: Status;
  business: { name: string; logoUrl: string | null; brandColor: string };
  readyMessage: string;
};

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch {
    // Autoplay can be blocked until the user interacts; the visual alert still shows.
  }
}

function alertCustomer() {
  beep();
  navigator.vibrate?.([300, 150, 300, 150, 300]);
}

function urlBase64ToUint8Array(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function Track() {
  const { token } = useParams();
  const [order, setOrder] = useState<Order>();
  const [missing, setMissing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [pushError, setPushError] = useState('');
  const lastStatus = useRef<Status>();

  const load = useCallback(async () => {
    try {
      const o = await api<Order>(`/api/customer/orders/${token}`);
      if (o.status === 'ready' && lastStatus.current && lastStatus.current !== 'ready') alertCustomer();
      lastStatus.current = o.status;
      setOrder(o);
    } catch {
      setMissing(true);
    }
  }, [token]);

  useEffect(() => {
    load();
    const es = new EventSource(`/api/customer/orders/${token}/events`);
    // After any (re)connect, fetch the authoritative status in case events were missed.
    es.onopen = () => {
      setConnected(true);
      load();
    };
    es.onerror = () => setConnected(false);
    es.addEventListener('order-resent', () => {
      alertCustomer();
      load();
    });
    ['order-ready', 'order-completed', 'order-cancelled'].forEach((t) => es.addEventListener(t, () => load()));
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    // Fallback for proxies/tunnels that hold SSE back: cheap status poll while the page is visible.
    const poll = setInterval(() => document.visibilityState === 'visible' && load(), 4000);
    return () => {
      clearInterval(poll);
      es.close();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, load]);

  const subscribePush = useCallback(async () => {
    const { publicKey } = await api<{ publicKey: string | null }>('/api/customer/push/key');
    if (!publicKey) throw new Error('Notifications are not configured for this business.');
    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
    await api('/api/customer/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ token, subscription: sub.toJSON() }),
    });
  }, [token]);

  // Already granted on a previous visit: just attach the subscription to this order.
  useEffect(() => {
    if (perm === 'granted' && 'PushManager' in window) subscribePush().catch(() => {});
  }, [perm, subscribePush]);

  async function enable() {
    setPushError('');
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === 'granted') await subscribePush();
    } catch (e) {
      setPushError((e as Error).message);
    }
  }

  if (missing) return <main className="card narrow"><h1>Order not found</h1><p>Please check your QR code.</p></main>;
  if (!order) return <main className="card narrow"><p>Loading…</p></main>;

  const { business, status } = order;
  const canPush = 'PushManager' in window && perm !== 'unsupported';
  const needsInstall = isIOS && !isStandalone;

  return (
    <main className={`card narrow track ${status}`} style={{ '--brand': business.brandColor } as React.CSSProperties}>
      {business.logoUrl && <img className="logo" src={business.logoUrl} alt={business.name} />}
      <h2>{business.name}</h2>
      <p className="muted">Order</p>
      <p className="number">{order.orderNumber}</p>

      {status === 'preparing' && <p className="status">Preparing your order…</p>}
      {status === 'ready' && (
        <div role="alert" className="ready">
          <h1>Your Order Is Ready!</h1>
          <p>{order.readyMessage}</p>
        </div>
      )}
      {status === 'completed' && <p className="status">Order collected. Thank you!</p>}
      {status === 'cancelled' && <p className="status">This order was cancelled.</p>}

      {(status === 'preparing' || status === 'ready') && (
        <>
          {!connected && <p className="muted">Reconnecting…</p>}
          {needsInstall ? (
            <p className="hint">
              To get notified on iPhone, tap Share → <b>Add to Home Screen</b>, then open this order from the new
              icon.
            </p>
          ) : (
            canPush &&
            perm !== 'granted' &&
            perm !== 'denied' && <button className="primary" onClick={enable}>Enable notifications</button>
          )}
          {perm === 'granted' && <p className="muted">Notifications on — you can switch apps.</p>}
          {perm === 'denied' && <p className="muted">Notifications are blocked. Keep this page open to see updates.</p>}
          {pushError && <p className="error">{pushError}</p>}
        </>
      )}
    </main>
  );
}
