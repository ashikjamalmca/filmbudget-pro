import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['SUPABASE_URL']!;
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY']!;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  (req as any).user = user;
  next();
}

export async function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) { res.status(401).json({ error: 'Unauthenticated' }); return; }
    const supabaseAdmin = (await import('../lib/supabase.js')).supabaseAdmin;
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !roles.includes(profile.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    (req as any).profile = profile;
    next();
  };
}
