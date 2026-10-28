import { Router } from 'express';
import { z } from 'zod';
import { clearSession, hashPassword, requireAuth, setSession, verifyPassword } from '../auth';
import { pool, tx } from '../db';
import { HttpError } from '../orders';

export const authRouter = Router();

const register = z.object({
  businessName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().optional(),
});

authRouter.post('/register', async (req, res) => {
  const body = register.parse(req.body);
  const user = await tx(async (c) => {
    const exists = await c.query('SELECT 1 FROM users WHERE email = $1', [body.email]);
    if (exists.rowCount) throw new HttpError(409, 'Email already registered');
    const { rows: b } = await c.query(
      `INSERT INTO businesses (name, brand_color, logo_url)
       VALUES ($1, COALESCE($2, '#2563eb'), $3) RETURNING id`,
      [body.businessName, body.brandColor ?? null, body.logoUrl ?? null],
    );
    const { rows: u } = await c.query(
      `INSERT INTO users (business_id, email, password_hash, role) VALUES ($1,$2,$3,'owner') RETURNING id`,
      [b[0].id, body.email, await hashPassword(body.password)],
    );
    return { userId: u[0].id as string, businessId: b[0].id as string };
  });
  setSession(res, { ...user, role: 'owner' });
  res.status(201).json({ ok: true });
});

const login = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

authRouter.post('/login', async (req, res) => {
  const body = login.parse(req.body);
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [body.email]);
  const u = rows[0];
  // Same response for unknown email and wrong password.
  if (!u || !(await verifyPassword(body.password, u.password_hash))) throw new HttpError(401, 'Invalid credentials');
  setSession(res, { userId: u.id, businessId: u.business_id, role: u.role });
  res.json({ ok: true });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, logo_url, brand_color FROM businesses WHERE id = $1',
    [req.session!.businessId],
  );
  res.json({
    role: req.session!.role,
    business: { id: rows[0].id, name: rows[0].name, logoUrl: rows[0].logo_url, brandColor: rows[0].brand_color },
  });
});
