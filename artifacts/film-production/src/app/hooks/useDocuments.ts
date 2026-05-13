import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentFileType = Database['public']['Enums']['document_file_type'];

export function useDocuments(projectId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!projectId) { setDocuments([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setDocuments((data ?? []) as Document[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const uploadDocument = async (file: File, department: string, linkedExpense: string) => {
    if (!projectId) return { error: 'No project selected' };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const fileType: DocumentFileType =
      ext === 'pdf' ? 'pdf' :
      ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? 'image' :
      ext === 'xlsx' ? 'excel' : 'other';

    const path = `${projectId}/${department}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
    if (uploadError) return { error: uploadError.message };

    const fileSizeStr = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const { error: dbError } = await (supabase as any).from('documents').insert({
      project_id: projectId,
      name: file.name,
      file_type: fileType,
      department,
      linked_expense: linkedExpense || null,
      storage_path: path,
      file_size: fileSizeStr,
      uploaded_by: user.id,
    });
    if (dbError) return { error: dbError.message };
    await fetchDocuments();
    return { error: null };
  };

  const getDownloadUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const deleteDocument = async (id: string, storagePath: string) => {
    await supabase.storage.from('documents').remove([storagePath]);
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchDocuments();
    return { error: null };
  };

  return { documents, loading, error, refetch: fetchDocuments, uploadDocument, getDownloadUrl, deleteDocument };
}
