import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

export function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(f)),
      });
      nav('/staff');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card narrow">
      <h1>{mode === 'login' ? 'Staff sign in' : 'Register your business'}</h1>
      <form onSubmit={submit} className="stack">
        {mode === 'register' && <input name="businessName" placeholder="Business name" required />}
        <input name="email" type="email" placeholder="Email" required autoComplete="username" />
        <input
          name="password"
          type="password"
          placeholder="Password (8+ characters)"
          minLength={mode === 'register' ? 8 : 1}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New business? Register' : 'Have an account? Sign in'}
      </button>
    </main>
  );
}
