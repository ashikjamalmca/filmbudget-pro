import React, { useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Loader2,
  Globe, Tag, Edit2, Check, X, Settings2,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useAuth } from '../context/AuthContext';

export function ProducerSettings() {
  const { tenantId } = useAuth();
  const {
    globalCategories,
    tenantCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useExpenseCategories();

  const [expandedGlobal, setExpandedGlobal] = useState<Set<string>>(new Set());
  const [expandedTenant, setExpandedTenant] = useState<Set<string>>(new Set());
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newSubName, setNewSubName] = useState<Record<string, string>>({});
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGlobal = (id: string) =>
    setExpandedGlobal(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleTenant = (id: string) =>
    setExpandedTenant(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true); setError(null);
    const { error } = await addCategory(newCatName.trim(), null, tenantId);
    setSaving(false);
    if (error) { setError(error); return; }
    setNewCatName('');
    setAddingCat(false);
  };

  const handleAddSubcategory = async (parentId: string) => {
    const name = (newSubName[parentId] ?? '').trim();
    if (!name) return;
    setSaving(true); setError(null);
    const { error } = await addCategory(name, parentId, tenantId);
    setSaving(false);
    if (error) { setError(error); return; }
    setNewSubName(prev => ({ ...prev, [parentId]: '' }));
    setAddingSubFor(null);
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setSaving(true);
    await updateCategory(id, editingName.trim());
    setSaving(false);
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this category? It will be hidden from new expense entries.')) return;
    setSaving(true);
    await deleteCategory(id);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Company Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage expense categories specific to your production house.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">{error}</div>
      )}

      {/* ── Company-Specific Categories ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">Company-Specific Categories</h2>
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
              {tenantCategories.length} categories
            </Badge>
          </div>
          {!addingCat && (
            <Button size="sm" variant="outline" onClick={() => setAddingCat(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          These categories are visible only inside your workspace. They appear alongside the platform-wide defaults.
        </p>

        {addingCat && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Input
              className="flex-1 h-8 text-sm"
              placeholder="New category name..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
            <Button size="sm" className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 h-8" onClick={handleAddCategory} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => { setAddingCat(false); setNewCatName(''); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {tenantCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Tag className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No company-specific categories yet.</p>
            <p className="text-xs mt-1">Create your own to complement the platform defaults.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tenantCategories.map(cat => (
              <div key={cat.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => toggleTenant(cat.id)}
                  >
                    {cat.subcategories.length > 0
                      ? expandedTenant.has(cat.id)
                        ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <span className="w-4 h-4 flex-shrink-0" />
                    }
                    {editingId === cat.id ? (
                      <Input
                        className="h-7 text-sm flex-1"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    )}
                    <Badge variant="outline" className="ml-auto text-xs text-gray-400 mr-2">
                      {cat.subcategories.length} sub
                    </Badge>
                  </button>
                  <div className="flex items-center gap-1">
                    {editingId === cat.id ? (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(cat.id)}>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}>
                          <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(cat.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {expandedTenant.has(cat.id) && (
                  <div className="px-8 pb-2 pt-1 space-y-1">
                    {cat.subcategories.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 py-1.5">
                        {editingId === sub.id ? (
                          <>
                            <Input
                              className="h-7 text-sm flex-1"
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleEdit(sub.id); if (e.key === 'Escape') setEditingId(null); }}
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(sub.id)}>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                            <span className="text-sm text-gray-700 flex-1">{sub.name}</span>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => { setEditingId(sub.id); setEditingName(sub.name); }}>
                              <Edit2 className="w-3 h-3 text-gray-400 hover:text-blue-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(sub.id)}>
                              <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add subcategory inline */}
                    {addingSubFor === cat.id ? (
                      <div className="flex items-center gap-2 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                        <Input
                          className="h-7 text-sm flex-1"
                          placeholder="Subcategory name..."
                          value={newSubName[cat.id] ?? ''}
                          onChange={e => setNewSubName(prev => ({ ...prev, [cat.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddSubcategory(cat.id); if (e.key === 'Escape') setAddingSubFor(null); }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleAddSubcategory(cat.id)}>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAddingSubFor(null)}>
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 py-1"
                        onClick={() => { setAddingSubFor(cat.id); setExpandedTenant(prev => new Set([...prev, cat.id])); }}
                      >
                        <Plus className="w-3 h-3" /> Add subcategory
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Platform Default Categories (read-only view) ── */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-indigo-500" />
          <h2 className="text-base font-semibold text-gray-900">Platform Default Categories</h2>
          <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200 bg-indigo-50">
            {globalCategories.length} categories · read-only
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          These are managed by the platform administrator and are available to all producers. They appear together with your company-specific categories in the expense entry form.
        </p>
        <div className="space-y-2">
          {globalCategories.map(cat => (
            <div key={cat.id} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                onClick={() => toggleGlobal(cat.id)}
              >
                {cat.subcategories.length > 0
                  ? expandedGlobal.has(cat.id)
                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <span className="w-4 h-4 flex-shrink-0" />
                }
                <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                <Badge variant="outline" className="ml-auto text-xs text-gray-400">
                  {cat.subcategories.length} sub
                </Badge>
              </button>
              {expandedGlobal.has(cat.id) && cat.subcategories.length > 0 && (
                <div className="px-8 py-2 space-y-1.5">
                  {cat.subcategories.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{sub.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-gray-400 pb-4">
        <Settings2 className="w-3.5 h-3.5" />
        Changes take effect immediately across all expense entries in your workspace.
      </div>
    </div>
  );
}
