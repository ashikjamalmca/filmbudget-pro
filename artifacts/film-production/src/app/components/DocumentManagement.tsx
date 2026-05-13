import React, { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Upload, FileText, File, Image, Calendar, User, Trash2, Download, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useDocuments } from '../hooks/useDocuments';

interface Props {
  projectId: string | null;
}

export function DocumentManagement({ projectId }: Props) {
  const { documents, loading, uploadDocument, getDownloadUrl, deleteDocument } = useDocuments(projectId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadDept, setUploadDept] = useState('');
  const [linkedExpense, setLinkedExpense] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
      case 'image': return <Image className="w-8 h-8 text-blue-500" />;
      case 'excel': return <File className="w-8 h-8 text-green-500" />;
      default: return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.linked_expense ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'all' || doc.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const handleUpload = async () => {
    if (!selectedFile || !uploadDept) { setUploadError('Please select a file and department.'); return; }
    setUploading(true);
    setUploadError(null);
    const { error } = await uploadDocument(selectedFile, uploadDept, linkedExpense);
    setUploading(false);
    if (error) { setUploadError(error); return; }
    setIsUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadDept('');
    setLinkedExpense('');
  };

  const thisMonth = new Date().getMonth();

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
              <Upload className="w-4 h-4 mr-2" />Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload New Document</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={uploadDept} onValueChange={setUploadDept}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily Expenses">Daily Expenses</SelectItem>
                    <SelectItem value="Artists">Artists</SelectItem>
                    <SelectItem value="Technicians">Technicians</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Post Production">Post Production</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Expense (Optional)</Label>
                <Input placeholder="e.g., Location Fee - Nov 3" value={linkedExpense} onChange={e => setLinkedExpense(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.webp"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1E3A8A] transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  {selectedFile ? (
                    <p className="text-sm text-[#1E3A8A]">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG, XLSX (Max 10MB)</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleUpload} disabled={uploading}>
                  {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search documents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-4 md:p-6"><p className="text-xs md:text-sm text-gray-600 mb-1">Total Documents</p><p className="text-2xl md:text-3xl text-gray-900">{documents.length}</p></Card>
        <Card className="p-4 md:p-6"><p className="text-xs md:text-sm text-gray-600 mb-1">PDFs</p><p className="text-2xl md:text-3xl text-gray-900">{documents.filter(d => d.file_type === 'pdf').length}</p></Card>
        <Card className="p-4 md:p-6"><p className="text-xs md:text-sm text-gray-600 mb-1">Images</p><p className="text-2xl md:text-3xl text-gray-900">{documents.filter(d => d.file_type === 'image').length}</p></Card>
        <Card className="p-4 md:p-6"><p className="text-xs md:text-sm text-gray-600 mb-1">This Month</p><p className="text-2xl md:text-3xl text-gray-900">{documents.filter(d => new Date(d.created_at).getMonth() === thisMonth).length}</p></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredDocuments.map(doc => (
            <Card key={doc.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{getFileIcon(doc.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm mb-1 truncate" title={doc.name}>{doc.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{doc.file_size}</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-[#1E3A8A]/10 text-[#1E3A8A]">{doc.department}</span>
                  </div>
                  {doc.linked_expense && <p className="text-xs text-gray-500 mt-2">Linked: {doc.linked_expense}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={async () => {
                  try {
                    const url = await getDownloadUrl(doc.storage_path);
                    window.open(url, '_blank', 'noreferrer');
                  } catch {
                    alert('Could not generate download link. Please try again.');
                  }
                }}>
                  <Download className="w-4 h-4 mr-2" />Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteDocument(doc.id, doc.storage_path)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
          {filteredDocuments.length === 0 && (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No documents found</p>
                <p className="text-sm text-gray-400 mt-2">Upload your first document to get started</p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
