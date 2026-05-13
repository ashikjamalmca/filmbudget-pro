import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Upload, FileText, File, Image, Calendar, User, Trash2, Download, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'excel' | 'other';
  department: string;
  linkedExpense: string;
  uploadedBy: string;
  uploadDate: Date;
  size: string;
}

export function DocumentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'location_invoice_001.pdf',
      type: 'pdf',
      department: 'Daily Expenses',
      linkedExpense: 'Location Fee - Nov 3',
      uploadedBy: 'Nivin Pauly',
      uploadDate: new Date(2025, 10, 3),
      size: '245 KB'
    },
    {
      id: '2',
      name: 'artist_contract_mohanlal.pdf',
      type: 'pdf',
      department: 'Artists',
      linkedExpense: 'Lead Actor - Mohanlal',
      uploadedBy: 'Antony Perumbavoor',
      uploadDate: new Date(2025, 9, 15),
      size: '1.2 MB'
    },
    {
      id: '3',
      name: 'equipment_receipt_002.jpg',
      type: 'image',
      department: 'Equipment',
      linkedExpense: 'Camera Rental - Week 5',
      uploadedBy: 'Manju Warrier',
      uploadDate: new Date(2025, 10, 2),
      size: '856 KB'
    },
    {
      id: '4',
      name: 'meal_bills_Nov1.pdf',
      type: 'pdf',
      department: 'Daily Expenses',
      linkedExpense: 'Crew Meals - Nov 1',
      uploadedBy: 'Nivin Pauly',
      uploadDate: new Date(2025, 10, 1),
      size: '342 KB'
    },
    {
      id: '5',
      name: 'studio_rental_agreement.pdf',
      type: 'pdf',
      department: 'Music',
      linkedExpense: 'Recording Studio - Oct',
      uploadedBy: 'Antony Perumbavoor',
      uploadDate: new Date(2025, 9, 20),
      size: '2.1 MB'
    },
    {
      id: '6',
      name: 'technician_payment_sheet.xlsx',
      type: 'excel',
      department: 'Technicians',
      linkedExpense: 'DOP Payment - Oct',
      uploadedBy: 'Manju Warrier',
      uploadDate: new Date(2025, 9, 28),
      size: '78 KB'
    }
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'image':
        return <Image className="w-8 h-8 text-blue-500" />;
      case 'excel':
        return <File className="w-8 h-8 text-green-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.linkedExpense.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || doc.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2">Document Management</h1>
          <p className="text-sm md:text-base text-gray-600">Central storage for bills, receipts, and contracts</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Expenses</SelectItem>
                    <SelectItem value="artists">Artists</SelectItem>
                    <SelectItem value="technicians">Technicians</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="post">Post Production</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Expense (Optional)</Label>
                <Input placeholder="e.g., Location Fee - Nov 3" />
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1E3A8A] transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG, XLSX (Max 10MB)</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">Upload</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Daily Expenses">Daily Expenses</SelectItem>
                <SelectItem value="Artists">Artists</SelectItem>
                <SelectItem value="Technicians">Technicians</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Post Production">Post Production</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Document Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Documents</p>
          <p className="text-2xl md:text-3xl text-gray-900">{documents.length}</p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">PDFs</p>
          <p className="text-2xl md:text-3xl text-gray-900">
            {documents.filter(d => d.type === 'pdf').length}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Images</p>
          <p className="text-2xl md:text-3xl text-gray-900">
            {documents.filter(d => d.type === 'image').length}
          </p>
        </Card>
        <Card className="p-4 md:p-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-2xl md:text-3xl text-gray-900">
            {documents.filter(d => d.uploadDate.getMonth() === 10).length}
          </p>
        </Card>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getFileIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm mb-1 truncate" title={doc.name}>
                  {doc.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{doc.size}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{format(doc.uploadDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <User className="w-3 h-3" />
                    <span>{doc.uploadedBy}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-block px-2 py-1 text-xs rounded bg-[#1E3A8A]/10 text-[#1E3A8A]">
                    {doc.department}
                  </span>
                </div>
                {doc.linkedExpense && (
                  <p className="text-xs text-gray-500 mt-2">
                    Linked: {doc.linkedExpense}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeleteDocument(doc.id)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No documents found</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
