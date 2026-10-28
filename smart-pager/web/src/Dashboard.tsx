import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, StaffOrder, Status } from './api';

type Me = { business: { name: string; brandColor: string } };
const EVENTS = ['order-created', 'order-ready', 'order-resent', 'order-completed', 'order-cancelled'];
const FILTERS: Array<Status | 'all'> = ['all', 'preparing', 'ready', 'completed', 'cancelled'];

export function Dashboard() {
  const nav = useNavigate();
  const [me, setMe] = useState<Me>();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [qrFor, setQrFor] = useState<StaffOrder>();
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) nav('/login');
      else setError((e as Error).message);
    },
    [nav],
  );

  const load = useCallback(
    () =>
      api<StaffOrder[]>(`/api/staff/orders${filter === 'all' ? '' : `?status=${filter}`}`)
        .then((o) => {
          setOrders(o);
          setError('');
        })
        .catch(fail),
    [filter, fail],
  );

  useEffect(() => {
    api<Me>('/api/auth/me').then(setMe).catch(fail);
  }, [fail]);

  useEffect(() => {
    load();
    // Live updates; the list endpoint stays the source of truth, events just trigger a refresh.
    const es = new EventSource('/api/staff/events');
    es.onopen = () => {
      setLive(true);
      load();
    };
    es.onerror = () => setLive(false);
    EVENTS.forEach((t) => es.addEventListener(t, () => load()));
    const poll = setInterval(() => document.visibilityState === 'visible' && load(), 8000);
    return () => {
      clearInterval(poll);
      es.close();
    };
  }, [load]);

  async function act(o: StaffOrder, action: 'call' | 'resend' | 'complete' | 'cancel') {
    try {
      await api(`/api/staff/orders/${o.id}/${action}`, { method: 'POST' });
      load();
    } catch (e) {
      fail(e);
    }
  }

  async function create() {
    try {
      const o = await api<StaffOrder>('/api/staff/orders', { method: 'POST' });
      setQrFor(o);
      load();
    } catch (e) {
      fail(e);
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    nav('/login');
  }

  return (
    <main className="wide" style={{ '--brand': me?.business.brandColor } as React.CSSProperties}>
      <header className="bar">
        <h1>{me?.business.name ?? 'Orders'}</h1>
        <span className={`dot ${live ? 'on' : ''}`} title={live ? 'Live' : 'Reconnecting…'}>
          {live ? 'Live' : 'Reconnecting…'}
        </span>
        <button className="primary" onClick={create}>
          + New order
        </button>
        <button className="link" onClick={logout}>
          Sign out
        </button>
      </header>

      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f} className={f === filter ? 'active' : ''} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.orderNumber}</strong>
              </td>
              <td>
                <span className={`pill ${o.status}`}>{o.status}</span>
              </td>
              <td>{new Date(o.createdAt).toLocaleTimeString()}</td>
              <td className="actions">
                {o.status === 'preparing' && (
                  <>
                    <button className="primary" onClick={() => act(o, 'call')}>
                      Send Call
                    </button>
                    <button onClick={() => act(o, 'cancel')}>Cancel</button>
                  </>
                )}
                {o.status === 'ready' && (
                  <>
                    <button onClick={() => act(o, 'resend')}>Resend</button>
                    <button onClick={() => act(o, 'complete')}>Complete</button>
                  </>
                )}
                {(o.status === 'preparing' || o.status === 'ready') && (
                  <button onClick={() => setQrFor(o)}>QR</button>
                )}
              </td>
            </tr>
          ))}
          {!orders.length && (
            <tr>
              <td colSpan={4} className="muted">
                No orders.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {qrFor && (
        <div className="overlay" onClick={() => setQrFor(undefined)}>
          <div className="card qr" onClick={(e) => e.stopPropagation()}>
            <h2>Order {qrFor.orderNumber}</h2>
            <QRCodeSVG value={qrFor.trackUrl} size={240} />
            <p className="muted">Customer scans to track this order.</p>
            <button onClick={() => window.print()}>Print</button>
            <button onClick={() => setQrFor(undefined)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
