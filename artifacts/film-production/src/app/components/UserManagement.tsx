import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Mail, User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'producer' | 'accounts' | 'production-manager' | 'viewer';
  assignedProject: string;
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  status: 'active' | 'inactive';
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Antony Perumbavoor',
      email: 'antony@filmproduction.com',
      role: 'producer',
      assignedProject: 'Lokah',
      permissions: { view: true, edit: true, delete: true },
      status: 'active'
    },
    {
      id: '2',
      name: 'Nivin Pauly',
      email: 'nivin@filmproduction.com',
      role: 'production-manager',
      assignedProject: 'Lokah',
      permissions: { view: true, edit: true, delete: false },
      status: 'active'
    },
    {
      id: '3',
      name: 'Manju Warrier',
      email: 'manju@filmproduction.com',
      role: 'accounts',
      assignedProject: 'Lokah',
      permissions: { view: true, edit: true, delete: false },
      status: 'active'
    },
    {
      id: '4',
      name: 'Prithviraj Sukumaran',
      email: 'prithviraj@filmproduction.com',
      role: 'viewer',
      assignedProject: 'Lokah',
      permissions: { view: true, edit: false, delete: false },
      status: 'active'
    },
    {
      id: '5',
      name: 'Aishwarya Lekshmi',
      email: 'aishwarya@filmproduction.com',
      role: 'accounts',
      assignedProject: 'Thudarum',
      permissions: { view: true, edit: true, delete: false },
      status: 'inactive'
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer' as const,
    assignedProject: 'Lokah'
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      producer: 'bg-purple-100 text-purple-700',
      accounts: 'bg-blue-100 text-blue-700',
      'production-manager': 'bg-green-100 text-green-700',
      viewer: 'bg-gray-100 text-gray-700'
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      producer: 'Producer',
      accounts: 'Accounts',
      'production-manager': 'Production Manager',
      viewer: 'Viewer'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const handleAddUser = () => {
    const permissions = {
      view: true,
      edit: newUser.role !== 'viewer',
      delete: newUser.role === 'producer'
    };

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      assignedProject: newUser.assignedProject,
      permissions,
      status: 'active'
    };

    setUsers([...users, user]);
    setIsAddDialogOpen(false);
    setNewUser({ name: '', email: '', role: 'viewer', assignedProject: 'Lokah' });
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const toggleUserStatus = (id: string) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: user.status === 'active' ? 'inactive' as const : 'active' as const }
        : user
    ));
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
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Select 
                  value={newUser.assignedProject} 
                  onValueChange={(value) => setNewUser({ ...newUser, assignedProject: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lokah">Lokah</SelectItem>
                    <SelectItem value="Thudarum">Thudarum</SelectItem>
                    <SelectItem value="Diés Iraé">Diés Iraé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                  onClick={handleAddUser}
                >
                  Add User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl text-gray-900">{users.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Active Users</p>
          <p className="text-3xl text-green-600">
            {users.filter(u => u.status === 'active').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Producers</p>
          <p className="text-3xl text-gray-900">
            {users.filter(u => u.role === 'producer').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Team Members</p>
          <p className="text-3xl text-gray-900">
            {users.filter(u => u.role !== 'producer').length}
          </p>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Team Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Role</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Assigned Project</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Permissions</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-center py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">{user.assignedProject}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-2">
                      <Badge variant={user.permissions.view ? 'default' : 'outline'} className="text-xs">
                        View
                      </Badge>
                      <Badge variant={user.permissions.edit ? 'default' : 'outline'} className="text-xs">
                        Edit
                      </Badge>
                      <Badge variant={user.permissions.delete ? 'default' : 'outline'} className="text-xs">
                        Delete
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={user.status === 'active'}
                        onCheckedChange={() => toggleUserStatus(user.id)}
                      />
                      <span className={`text-xs ${user.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Role Permissions Info */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm mb-2 text-purple-900">Producer</h4>
            <ul className="text-xs space-y-1 text-purple-700">
              <li>• Full access to all features</li>
              <li>• Can add/edit/delete all data</li>
              <li>• Can manage users</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm mb-2 text-blue-900">Accounts</h4>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• View and edit expenses</li>
              <li>• Manage payments</li>
              <li>• Generate reports</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm mb-2 text-green-900">Production Manager</h4>
            <ul className="text-xs space-y-1 text-green-700">
              <li>• Add daily expenses</li>
              <li>• Upload documents</li>
              <li>• View all budgets</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm mb-2 text-gray-900">Viewer</h4>
            <ul className="text-xs space-y-1 text-gray-700">
              <li>• View-only access</li>
              <li>• Can see reports</li>
              <li>• No edit permissions</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
