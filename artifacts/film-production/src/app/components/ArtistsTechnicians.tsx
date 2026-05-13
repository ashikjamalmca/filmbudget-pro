import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Plus, Edit, FileText, Loader2, Trash2 } from 'lucide-react';
import { useArtists } from '../hooks/useArtists';
import type { Database } from '../../lib/database.types';

type Person = Database['public']['Tables']['artists']['Row'];

interface Props {
  projectId: string | null;
  activeTab?: 'artists' | 'technicians';
}

function PersonTable({ projectId, type, title }: { projectId: string | null; type: 'artist' | 'technician'; title: string }) {
  const { people, loading, addPerson, updatePayment, deletePerson, getContractUrl } = useArtists(projectId, type);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', budget: '', paid: '0', notes: '' });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  const totals = people.reduce((acc, p) => ({
    budget: acc.budget + p.budget,
    paid: acc.paid + p.paid,
    balance: acc.balance + p.balance,
  }), { budget: 0, paid: 0, balance: 0 });

  const getStatusColor = (s: string) => ({ complete: 'bg-green-100 text-green-700', partial: 'bg-yellow-100 text-yellow-700', pending: 'bg-red-100 text-red-700' }[s] ?? 'bg-gray-100 text-gray-700');
  const getStatusLabel = (s: string) => ({ complete: 'Completed', partial: 'Partial', pending: 'Pending' }[s] ?? s);

  const handleAdd = async () => {
    if (!form.name || !form.role || !form.budget) return;
    setSaving(true);
    await addPerson({ name: form.name, role: form.role, budget: Number(form.budget), paid: Number(form.paid), notes: form.notes, contract_url: null });
    setSaving(false);
    setIsOpen(false);
    setForm({ name: '', role: '', budget: '', paid: '0', notes: '' });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">{title}</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"><Plus className="w-4 h-4 mr-2" />Add New</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New {type === 'artist' ? 'Artist' : 'Technician'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role / Department</Label><Input placeholder="e.g., Lead Actor, DOP" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
              <div className="space-y-2"><Label>Budget Amount (₹)</Label><Input type="number" placeholder="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
              <div className="space-y-2"><Label>Initial Payment (₹)</Label><Input type="number" placeholder="0" value={form.paid} onChange={e => setForm({ ...form, paid: e.target.value })} /></div>
              <div className="space-y-2"><Label>Notes</Label><Input placeholder="Payment terms, schedule, etc." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleAdd} disabled={saving}>
                  {saving ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Role</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Budget</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Paid</th>
                <th className="text-right py-3 px-4 text-sm text-gray-600">Balance</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Notes</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500 text-sm">No {type === 'artist' ? 'artists' : 'technicians'} added yet.</td></tr>
              ) : people.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{p.name}</td>
                  <td className="py-3 px-4 text-sm">{p.role}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(p.budget)}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <Input
                      type="number"
                      defaultValue={p.paid}
                      className="w-32 ml-auto text-right"
                      onBlur={e => updatePayment(p.id, parseFloat(e.target.value) || 0, p.budget)}
                    />
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(p.balance)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${getStatusColor(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.notes}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-2">
                      {p.contract_url && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          const url = await getContractUrl(p.contract_url!);
                          if (url) window.open(url, '_blank', 'noreferrer');
                        }}><FileText className="w-4 h-4" /></Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => deletePerson(p.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={2} className="py-4 px-4">Total</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.budget)}</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.paid)}</td>
                <td className="py-4 px-4 text-right text-[#1E3A8A]">{formatCurrency(totals.balance)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Total Budget</p><p className="text-2xl text-gray-900">{formatCurrency(totals.budget)}</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Total Paid</p><p className="text-2xl text-gray-900">{formatCurrency(totals.paid)}</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Balance Remaining</p><p className="text-2xl text-[#1E3A8A]">{formatCurrency(totals.balance)}</p></Card>
      </div>
    </div>
  );
}

export function ArtistsTechnicians({ projectId, activeTab = 'artists' }: Props) {
  return (
    <div className="p-8">
      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="artists">Artists Remuneration</TabsTrigger>
          <TabsTrigger value="technicians">Technicians Remuneration</TabsTrigger>
        </TabsList>
        <TabsContent value="artists"><PersonTable projectId={projectId} type="artist" title="Artist Payments" /></TabsContent>
        <TabsContent value="technicians"><PersonTable projectId={projectId} type="technician" title="Technician Payments" /></TabsContent>
      </Tabs>
    </div>
  );
}
