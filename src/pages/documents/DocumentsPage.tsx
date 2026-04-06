import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Loader2, PenLine, X, Eye, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // E-Signature state
  const [signModalDoc, setSignModalDoc] = useState<any | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/documents');
      setDocuments(res.data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('name', file.name);

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Document uploaded successfully!');
      fetchDocuments();
    } catch (error) {
      console.error('Upload error', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(doc => (doc._id || doc.id) !== id));
      toast.success("Document deleted");
    } catch (error) {
      console.error('Delete error', error);
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = (doc: any) => {
    const downloadUrl = doc.fileUrl || doc.url;
    if (downloadUrl) window.open(`${API_BASE}${downloadUrl}`, '_blank');
    else toast.error("Download URL not found.");
  };

  const handleShare = (doc: any) => {
    const shareUrl = doc.fileUrl || doc.url;
    if (shareUrl) {
      navigator.clipboard.writeText(`${API_BASE}${shareUrl}`);
      toast.success("Document link copied to clipboard!");
    } else {
      toast.error("Share URL not found.");
    }
  };

  // ─── E-Signature Handlers ─────────────────────────────────────────────────

  const openSignModal = (doc: any) => {
    setSignModalDoc(doc);
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  const submitSignature = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error('Please draw your signature first');
      return;
    }

    const signatureUrl = sigCanvasRef.current.toDataURL('image/png');

    try {
      setIsSigning(true);
      await api.put(`/documents/${signModalDoc._id || signModalDoc.id}/sign`, {
        signatureUrl
      });
      toast.success('Document signed successfully!');
      setSignModalDoc(null);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sign document');
    } finally {
      setIsSigning(false);
    }
  };

  // ─── PDF Preview ──────────────────────────────────────────────────────────

  const openPreview = (doc: any) => {
    setPreviewDoc(doc);
  };

  const getFileExtension = (doc: any) => {
    const url = doc.fileUrl || doc.url || '';
    return url.split('.').pop()?.toLowerCase();
  };

  const isPdf = (doc: any) => getFileExtension(doc) === 'pdf';
  const isImage = (doc: any) => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(getFileExtension(doc) || '');

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        
        <Button 
          leftIcon={isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} 
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info */}
        <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">12.5 GB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">7.5 GB</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Access</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Recent Files
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Shared with Me
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Starred
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Trash
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Document list */}
        <div className="lg:col-span-3">
          <Card className="border border-gray-200 shadow-sm min-h-[400px]">
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Sort by
                </Button>
                <Button variant="outline" size="sm">
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="p-8 text-center text-gray-500 font-medium w-full flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  Loading documents...
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div
                      key={doc._id || doc.id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-gray-200 group"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4 group-hover:bg-primary-100 transition">
                        <FileText size={24} className="text-primary-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.title || doc.name}
                          </h3>
                          {doc.shared && (
                            <Badge variant="secondary" size="sm">Shared</Badge>
                          )}
                          {doc.signatures && doc.signatures.length > 0 && (
                            <Badge variant="success" size="sm">Signed ✓</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{doc.status || 'draft'}</span>
                          <span>Modified {new Date(doc.updatedAt || doc.createdAt || new Date()).toLocaleDateString()}</span>
                          {doc.signatures && doc.signatures.length > 0 && (
                            <span className="text-green-600 font-medium">{doc.signatures.length} signature(s)</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => openPreview(doc)}
                          aria-label="Preview"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={() => openSignModal(doc)}
                          aria-label="Sign Document"
                          title="Sign Document"
                        >
                          <PenLine size={18} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => handleDownload(doc)}
                          aria-label="Download"
                          title="Download"
                        >
                          <Download size={18} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => handleShare(doc)}
                          aria-label="Share"
                          title="Share"
                        >
                          <Share2 size={18} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700 hover:bg-error-50"
                          onClick={() => handleDelete(doc._id || doc.id)}
                          aria-label="Delete"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-700">No documents found</p>
                  <p className="text-sm mt-1">Upload a document to get started.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ─── E-Signature Modal ──────────────────────────────────────────── */}
      {signModalDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sign Document</h2>
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">
                  {signModalDoc.title || signModalDoc.name}
                </p>
              </div>
              <button
                onClick={() => setSignModalDoc(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Draw your signature in the box below. This will be saved as your legally binding e-signature.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#1a1a2e"
                  canvasProps={{
                    width: 480,
                    height: 180,
                    className: 'w-full',
                  }}
                />
              </div>

              <div className="flex gap-3 justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw size={16} />}
                  onClick={clearSignature}
                >
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSignModalDoc(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={submitSignature}
                    disabled={isSigning}
                    leftIcon={isSigning ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
                  >
                    {isSigning ? 'Saving...' : 'Submit Signature'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Document Preview Modal ─────────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate max-w-sm">
                {previewDoc.title || previewDoc.name}
              </h2>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {isPdf(previewDoc) ? (
                <iframe
                  src={`${API_BASE}${previewDoc.fileUrl || previewDoc.url}`}
                  title="Document Preview"
                  className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200"
                />
              ) : isImage(previewDoc) ? (
                <img
                  src={`${API_BASE}${previewDoc.fileUrl || previewDoc.url}`}
                  alt={previewDoc.title || previewDoc.name}
                  className="max-w-full mx-auto rounded-lg shadow"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="font-medium text-gray-700">Preview not available</p>
                  <p className="text-sm mt-1">Download the file to view its contents.</p>
                  <Button
                    className="mt-4"
                    leftIcon={<Download size={16} />}
                    onClick={() => handleDownload(previewDoc)}
                  >
                    Download File
                  </Button>
                </div>
              )}
            </div>

            {/* Show signatures if any */}
            {previewDoc.signatures && previewDoc.signatures.length > 0 && (
              <div className="border-t border-gray-200 p-4 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Signatures ({previewDoc.signatures.length})</h3>
                <div className="flex gap-4 overflow-x-auto">
                  {previewDoc.signatures.map((sig: any, idx: number) => (
                    <div key={idx} className="flex-shrink-0 border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <img
                        src={sig.signatureUrl}
                        alt={`Signature ${idx + 1}`}
                        className="h-16 w-auto"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString() : 'Signed'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};