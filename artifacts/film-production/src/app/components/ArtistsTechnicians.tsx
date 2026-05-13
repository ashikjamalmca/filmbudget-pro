import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Plus, Upload, Edit, FileText } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  role: string;
  budget: number;
  paid: number;
  balance: number;
  status: 'pending' | 'partial' | 'complete';
  notes: string;
  contract?: string;
}

export function ArtistsTechnicians() {
  const [artists, setArtists] = useState<Person[]>([
    { id: '1', name: 'Mohanlal', role: 'Lead Actor', budget: 1500000, paid: 750000, balance: 750000, status: 'partial', notes: '50% advance paid' },
    { id: '2', name: 'Parvathy Thiruvothu', role: 'Lead Actress', budget: 1200000, paid: 1200000, balance: 0, status: 'complete', notes: 'Full payment done', contract: 'contract_parvathy.pdf' },
    { id: '3', name: 'Fahadh Faasil', role: 'Supporting Actor', budget: 400000, paid: 200000, balance: 200000, status: 'partial', notes: '50% advance paid' },
    { id: '4', name: 'Aishwarya Lekshmi', role: 'Character Artist', budget: 150000, paid: 0, balance: 150000, status: 'pending', notes: 'Payment pending' }
  ]);

  const [technicians, setTechnicians] = useState<Person[]>([
    { id: '1', name: 'Girish Gangadharan', role: 'Director of Photography', budget: 800000, paid: 400000, balance: 400000, status: 'partial', notes: 'Monthly payment' },
    { id: '2', name: 'Mahesh Narayanan', role: 'Editor', budget: 500000, paid: 250000, balance: 250000, status: 'partial', notes: '50% advance' },
    { id: '3', name: 'Bijibal', role: 'Sound Designer', budget: 350000, paid: 350000, balance: 0, status: 'complete', notes: 'Completed', contract: 'contract_bijibal.pdf' },
    { id: '4', name: 'Nimish Ravi', role: 'Art Director', budget: 600000, paid: 300000, balance: 300000, status: 'partial', notes: 'Per schedule' },
    { id: '5', name: 'Jomon T. John', role: 'Assistant Director', budget: 250000, paid: 0, balance: 250000, status: 'pending', notes: 'Not started' }
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateTotals = (people: Person[]) => {
    return people.reduce((acc, person) => ({
      budget: acc.budget + person.budget,
      paid: acc.paid + person.paid,
      balance: acc.balance + person.balance
    }), { budget: 0, paid: 0, balance: 0 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Completed';
      case 'partial': return 'Partial';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const PersonTable = ({ people, title }: { people: Person[], title: string }) => {
    const totals = calculateTotals(people);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl">{title}</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New {title.includes('Artist') ? 'Artist' : 'Technician'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Role/Department</Label>
                  <Input placeholder="e.g., Lead Actor, DOP, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Budget Amount</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Upload Contract (Optional)</Label>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input placeholder="Payment terms, schedule, etc." />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">Add</Button>
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
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Role/Department</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Budget</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Paid</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Balance</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Notes</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{person.name}</td>
                    <td className="py-3 px-4 text-sm">{person.role}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(person.budget)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Input 
                        type="number" 
                        value={person.paid} 
                        className="w-32 ml-auto text-right"
                        onChange={(e) => {}}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(person.balance)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${getStatusColor(person.status)}`}>
                        {getStatusLabel(person.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{person.notes}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {person.contract && (
                          <Button variant="outline" size="sm" title={person.contract}>
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4" />
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
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Budget</p>
            <p className="text-2xl text-gray-900">{formatCurrency(totals.budget)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Paid</p>
            <p className="text-2xl text-gray-900">{formatCurrency(totals.paid)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-1">Balance Remaining</p>
            <p className="text-2xl text-[#1E3A8A]">{formatCurrency(totals.balance)}</p>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <Tabs defaultValue="artists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="artists">Artists Remuneration</TabsTrigger>
          <TabsTrigger value="technicians">Technicians Remuneration</TabsTrigger>
        </TabsList>

        <TabsContent value="artists">
          <PersonTable people={artists} title="Artist Payments" />
        </TabsContent>

        <TabsContent value="technicians">
          <PersonTable people={technicians} title="Technician Payments" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
