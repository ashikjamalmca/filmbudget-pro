import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Plus, Trash2, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { useProjects } from '../hooks/useProjects';
import type { Database } from '../../lib/database.types';

type UserRole = Database['public']['Enums']['user_role'];

export function UserManagement() {
  const { profiles, loading, inviteUser, toggleStatus } = useProfiles();
  const { projects } = useProjects();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'viewer' as UserRole, assignedProjectId: '' });

  const getRoleBadge = (role: string) => ({
    producer: 'bg-purple-100 text-purple-700',
    accounts: 'bg-blue-100 text-blue-700',
    'production-manager': 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-700',
  }[role] ?? 'bg-gray-100 text-gray-700');

  const getRoleLabel = (role: string) => ({
    producer: 'Producer',
    accounts: 'Accounts',
    'production-manager': 'Production Manager',
    viewer: 'Viewer',
  }[role] ?? role);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) { setInviteError('Name and email are required.'); return; }
    setSaving(true);
    setInviteError(null);
    const { error } = await inviteUser(newUser.email, newUser.name, newUser.role, newUser.assignedProjectId || null);
    setSaving(false);
    if (error) { setInviteError(error); return; }
    setIsAddDialogOpen(false);
    setNewUser({ name: '', email: '', role: 'viewer', assignedProjectId: '' });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl mb-2">User & Role Management</h1>
          <p className="text-gray-600">Manage team members and their access levels</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"><Plus className="w-4 h-4 mr-2" />Add New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {inviteError && <p className="text-red-600 text-sm">{inviteError}</p>}
              <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Enter full name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="email@example.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="accounts">Accounts</SelectItem>
                    <SelectItem value="production-manager">Production Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Project</Label>
                <Select value={newUser.assignedProjectId} onValueChange={v => setNewUser({ ...newUser, assignedProjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500">An invitation email will be sent to the user to set their password.</p>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleAddUser} disabled={saving}>
                  {saving ? 'Sending Invite...' : 'Send Invite'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Total Users</p><p className="text-3xl text-gray-900">{profiles.length}</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Active Users</p><p className="text-3xl text-green-600">{profiles.filter(u => u.is_active).length}</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Producers</p><p className="text-3xl text-gray-900">{profiles.filter(u => u.role === 'producer').length}</p></Card>
        <Card className="p-6"><p className="text-sm text-gray-600 mb-1">Team Members</p><p className="text-3xl text-gray-900">{profiles.filter(u => u.role !== 'producer').length}</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl mb-6">Team Members</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Role</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500 text-sm">No users yet. Invite your first team member.</td></tr>
                ) : profiles.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" /><span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Switch checked={user.is_active} onCheckedChange={v => toggleStatus(user.id, v)} />
                        <span className={`text-xs ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg"><h4 className="text-sm mb-2 text-purple-900">Producer</h4><ul className="text-xs space-y-1 text-purple-700"><li>• Full access to all features</li><li>• Can add/edit/delete all data</li><li>• Can manage users</li></ul></div>
          <div className="p-4 bg-blue-50 rounded-lg"><h4 className="text-sm mb-2 text-blue-900">Accounts</h4><ul className="text-xs space-y-1 text-blue-700"><li>• View and edit expenses</li><li>• Manage payments</li><li>• Generate reports</li></ul></div>
          <div className="p-4 bg-green-50 rounded-lg"><h4 className="text-sm mb-2 text-green-900">Production Manager</h4><ul className="text-xs space-y-1 text-green-700"><li>• Add daily expenses</li><li>• Upload documents</li><li>• View all budgets</li></ul></div>
          <div className="p-4 bg-gray-50 rounded-lg"><h4 className="text-sm mb-2 text-gray-900">Viewer</h4><ul className="text-xs space-y-1 text-gray-700"><li>• View-only access</li><li>• Can see reports</li><li>• No edit permissions</li></ul></div>
        </div>
      </Card>
    </div>
  );
}
