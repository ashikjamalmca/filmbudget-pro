import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import lokahPoster from 'figma:asset/14c5dd73ef53996272c4f5e3d9298de97d17ae6c.png';
import thudarumPoster from 'figma:asset/d7f51f40d12a00f09ba011b7f7de2f339b6d4bc1.png';
import diesIraePoster from 'figma:asset/8e84d33a287e36bd733fd1196f7b5380aa26d601.png';

const posterFallbacks: Record<string, string> = {
  Lokah: lokahPoster,
  Thudarum: thudarumPoster,
  'Diés Iraé': diesIraePoster,
};

interface ProjectSelectionProps {
  onSelectProject: (projectId: string) => void;
}

export function ProjectSelection({ onSelectProject }: ProjectSelectionProps) {
  const { projects, loading, createProject } = useProjects();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', date_range: '', total_budget: '' });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const handleCreate = async () => {
    if (!form.title || !form.total_budget) return;
    setSaving(true);
    await createProject({
      title: form.title,
      date_range: form.date_range,
      total_budget: Number(form.total_budget),
      poster_url: null,
    });
    setSaving(false);
    setIsAddOpen(false);
    setForm({ title: '', date_range: '', total_budget: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl mb-2">Select a Project</h1>
          <p className="text-gray-600">Choose a project to manage its budget and expenses</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {projects.map((project) => {
            const spent = 0;
            const percentSpent = (spent / project.total_budget) * 100;
            const posterSrc = project.poster_url ?? posterFallbacks[project.title] ?? '';

            return (
              <Card
                key={project.id}
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-gray-200">
                  <ImageWithFallback src={posterSrc} alt={project.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-2xl mb-1">{project.title}</h3>
                    {project.date_range && (
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        <Calendar className="w-4 h-4" />
                        <span>{project.date_range}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="text-[#1E3A8A]">{formatCurrency(project.total_budget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Spent</span>
                    <span className="text-gray-900">{formatCurrency(spent)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className={percentSpent > 90 ? 'text-red-600' : 'text-green-600'}>
                        {percentSpent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${percentSpent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(percentSpent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Title</Label>
                <Input placeholder="e.g., Untitled Film" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Input placeholder="e.g., Jan 2025 - Mar 2025" value={form.date_range} onChange={e => setForm({ ...form, date_range: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Total Budget (₹)</Label>
                <Input type="number" placeholder="5000000" value={form.total_budget} onChange={e => setForm({ ...form, total_budget: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-[#FACC15] hover:bg-[#FACC15]/90 text-gray-900"
          size="icon"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
