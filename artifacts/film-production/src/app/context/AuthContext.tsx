import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  subscription: Subscription | null;
  isSuperAdmin: boolean;
  tenantId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfileAndTenant(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfileAndTenant(session.user.id);
      else {
        setProfile(null);
        setTenant(null);
        setSubscription(null);
        setLoading(false);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  const fetchProfileAndTenant = async (userId: string) => {
    setLoading(true);
    const { data: profileData } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setProfile(profileData ?? null);

    if (profileData?.tenant_id) {
      const [tenantRes, subRes] = await Promise.all([
        (supabase as any).from('tenants').select('*').eq('id', profileData.tenant_id).single(),
        (supabase as any)
          .from('subscriptions')
          .select('*')
          .eq('tenant_id', profileData.tenant_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);
      setTenant(tenantRes.data ?? null);
      setSubscription(subRes.data ?? null);
    } else {
      setTenant(null);
      setSubscription(null);
    }

    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndTenant(user.id);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isSuperAdmin = profile?.is_super_admin ?? false;
  const tenantId = profile?.tenant_id ?? null;

  return (
    <AuthContext.Provider value={{
      session, user, profile, tenant, subscription,
      isSuperAdmin, tenantId, loading, signIn, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
