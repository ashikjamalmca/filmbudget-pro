import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { Plus, Mail, User as UserIcon, Loader2, Shield, Building2, AlertTriangle } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../../lib/database.types';

type UserRole = Database['public']['Enums']['user_role'];

export function UserManagement() {
  const { profile, subscription, tenant } = useAuth();
  const { profiles, loading, inviteUser, toggleStatus } = useProfiles();
  const { projects } = useProjects();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'viewer' as UserRole, assignedProjectId: '' });

  const isProducer = profile?.role === 'producer';
  const currentUserCount = profiles.length;
  const maxUsers = subscription?.max_users ?? null;
  const isAtLimit = maxUsers !== null && currentUserCount >= maxUsers;

  const getRoleBadge = (role: string) => ({
    producer: 'bg-purple-100 text-purple-700',
    accounts: 'bg-blue-100 text-blue-700',
    'production-manager': 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-700',
  }[role] ?? 'bg-gray-100 text-gray-700');

  const getRoleLabel = (role: string) => ({
    producer: 'Producer',
    accounts: 'Accounts',
    'production-manager': 'Prod. Manager',
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
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl lg:text-3xl mb-2">Team Management</h1>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            {tenant && (
              <>
                <Building2 className="w-3.5 h-3.5" />
                <span>{tenant.name}</span>
                <span>·</span>
              </>
            )}
            <span>{currentUserCount} user{currentUserCount !== 1 ? 's' : ''}</span>
            {maxUsers && <span className="text-gray-400">/ {maxUsers} allowed</span>}
          </div>
        </div>

        {isProducer && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                disabled={isAtLimit}
                title={isAtLimit ? `User limit reached (${maxUsers})` : undefined}
              >
                <Plus className="w-4 h-4 mr-2" /> Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite New Team Member</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                {inviteError && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{inviteError}</p>}
                <div className="space-y-2"><Label>Full Name</Label>
                  <Input placeholder="Enter full name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div className="space-y-2"><Label>Email Address</Label>
                  <Input type="email" placeholder="email@example.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v as UserRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accounts">Accounts</SelectItem>
                      <SelectItem value="production-manager">Production Manager</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned Project (optional)</Label>
                  <Select value={newUser.assignedProjectId} onValueChange={v => setNewUser({ ...newUser, assignedProjectId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500">An invitation email will be sent to the user to set their password.</p>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleAddUser} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Invite'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Subscription limits banner */}
      {maxUsers && (
        <div className={`rounded-lg p-4 flex items-center gap-3 ${
          isAtLimit ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-100'
        }`}>
          {isAtLimit
            ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            : <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
          }
          <div className="text-sm">
            <span className={isAtLimit ? 'text-red-700' : 'text-blue-700'}>
              {isAtLimit
                ? `User limit reached — upgrade your plan to add more team members.`
                : `${currentUserCount} of ${maxUsers} users used · ${maxUsers - currentUserCount} remaining`
              }
            </span>
            {subscription && (
              <span className="ml-2 text-xs opacity-70">
                ({subscription.plan_name} plan)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5"><p className="text-sm text-gray-500 mb-1">Total Users</p><p className="text-2xl font-bold text-gray-900">{profiles.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-gray-500 mb-1">Active</p><p className="text-2xl font-bold text-green-600">{profiles.filter(u => u.is_active).length}</p></Card>
        <Card className="p-5"><p className="text-sm text-gray-500 mb-1">Producers</p><p className="text-2xl font-bold text-gray-900">{profiles.filter(u => u.role === 'producer').length}</p></Card>
        <Card className="p-5"><p className="text-sm text-gray-500 mb-1">Team Members</p><p className="text-2xl font-bold text-gray-900">{profiles.filter(u => u.role !== 'producer').length}</p></Card>
      </div>

      {/* Team table */}
      <Card className="p-6">
        <h2 className="text-lg mb-4">Team Members</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Role</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500 text-sm">No team members yet.</td></tr>
                ) : profiles.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-3.5 h-3.5" /><span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {isProducer && user.id !== profile?.id ? (
                          <Switch checked={user.is_active} onCheckedChange={v => toggleStatus(user.id, v)} />
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        )}
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

      {/* Role permissions */}
      <Card className="p-6">
        <h3 className="text-base font-medium mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h4 className="text-sm font-medium mb-2 text-purple-900">Producer</h4>
            <ul className="text-xs space-y-1 text-purple-700">
              <li>• Full workspace access</li><li>• Create &amp; manage projects</li>
              <li>• Invite &amp; manage team</li><li>• View &amp; export reports</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-medium mb-2 text-blue-900">Accounts</h4>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• Add &amp; edit expenses</li><li>• Manage artist payments</li>
              <li>• Upload documents</li><li>• Generate reports</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h4 className="text-sm font-medium mb-2 text-green-900">Production Manager</h4>
            <ul className="text-xs space-y-1 text-green-700">
              <li>• Add daily expenses</li><li>• Upload documents</li>
              <li>• View all budgets</li><li>• View reports (read-only)</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium mb-2 text-gray-700">Viewer</h4>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• View-only access</li><li>• See reports &amp; dashboards</li>
              <li>• No edit permissions</li><li>• No user management</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
