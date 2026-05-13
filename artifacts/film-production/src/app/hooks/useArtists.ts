import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseStorage } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type Artist = Database['public']['Tables']['artists']['Row'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

export function useArtists(projectId: string | null, type: 'artist' | 'technician') {
  const { tenantId } = useAuth();
  const [people, setPeople] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    if (!projectId) { setPeople([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('artists')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .order('created_at');
    if (error) setError(error.message);
    else setPeople((data ?? []) as Artist[]);
    setLoading(false);
  }, [projectId, type]);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  const addPerson = async (values: {
    name: string;
    role: string;
    budget: number;
    paid: number;
    notes: string;
    contract_url: string | null;
  }) => {
    if (!projectId) return { error: 'No project selected' };
    const balance = values.budget - values.paid;
    const status: PaymentStatus = values.paid === 0 ? 'pending' : values.paid >= values.budget ? 'complete' : 'partial';
    const { error } = await (supabase as any).from('artists').insert({
      ...values,
      project_id: projectId,
      tenant_id: tenantId,
      type,
      balance,
      status,
    });
    if (error) return { error: error.message };
    await fetchPeople();
    return { error: null };
  };

  const updatePayment = async (id: string, paid: number, budget: number) => {
    const balance = budget - paid;
    const status: PaymentStatus = paid === 0 ? 'pending' : paid >= budget ? 'complete' : 'partial';
    const { error } = await (supabase as any)
      .from('artists')
      .update({ paid, balance, status })
      .eq('id', id);
    if (error) return { error: error.message };
    await fetchPeople();
    return { error: null };
  };

  const uploadContract = async (personId: string, file: File) => {
    const path = `contracts/${personId}/${file.name}`;
    const { error: uploadError } = await supabaseStorage.storage
      .from('documents')
      .upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError.message };
    // Store storage path (not a public URL) — signed URLs are generated on demand
    await (supabase as any).from('artists').update({ contract_url: path }).eq('id', personId);
    await fetchPeople();
    return { error: null };
  };

  const getContractUrl = async (storagePath: string): Promise<string | null> => {
    if (!storagePath) return null;
    // Legacy rows may store a full URL — pass them through unchanged
    if (storagePath.startsWith('http')) return storagePath;
    const { data } = await supabaseStorage.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600);
    return data?.signedUrl ?? null;
  };

  const deletePerson = async (id: string) => {
    const { error } = await (supabase as any).from('artists').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchPeople();
    return { error: null };
  };

  return { people, loading, error, refetch: fetchPeople, addPerson, updatePayment, uploadContract, getContractUrl, deletePerson };
}
