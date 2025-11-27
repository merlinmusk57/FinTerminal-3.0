import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const Ingestion: React.FC = () => {
  const { documents, ingestDocument } = useData();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Create a mock file from the drop event for simulation
    const mockFile = new File(["dummy content"], "HSBC_HK_Results_2025_Q1.pdf", { type: "application/pdf" });
    ingestDocument(mockFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files && e.target.files.length > 0) {
        ingestDocument(e.target.files[0]);
     }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-mono text-white mb-2">DATA INGESTION & SYNTHESIS</h2>
        <p className="text-gray-400 text-sm max-w-3xl">
          Upload financial reports (PDF), Excel packs, or audio recordings. 
          The system automatically detects reporting frequency, currency, and segments to synthesize data for the Vector Database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Upload Zone */}
        <div className="lg:col-span-1 flex flex-col">
          <div 
            className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 transition-colors ${
              isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 text-amber-500">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Drop files to ingest</h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              Support for PDF, XLSX, MP3, JPG.<br/>Auto-OCR and Transcription enabled.
            </p>
            <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
              Browse Files
              <input type="file" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>
          
          <div className="mt-4 bg-gray-900 p-4 rounded border border-gray-800">
            <h4 className="text-xs font-mono text-gray-400 uppercase mb-2">Supported Sources</h4>
            <div className="flex flex-wrap gap-2">
                {['Annual Reports', 'Earnings Calls', 'Presentation Decks', 'Industry Data'].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-300 text-[10px] rounded border border-gray-700">{tag}</span>
                ))}
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="lg:col-span-2 bg-gray-900 rounded-lg border border-gray-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
            <h3 className="font-mono text-sm text-gray-300">INGESTION QUEUE</h3>
            <span className="text-xs text-amber-500">{documents.length} FILES INDEXED</span>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800/30 sticky top-0">
                <tr>
                  <th className="p-3 text-xs font-mono text-gray-500 font-normal">STATUS</th>
                  <th className="p-3 text-xs font-mono text-gray-500 font-normal">FILENAME</th>
                  <th className="p-3 text-xs font-mono text-gray-500 font-normal">TYPE</th>
                  <th className="p-3 text-xs font-mono text-gray-500 font-normal">ENTITY</th>
                  <th className="p-3 text-xs font-mono text-gray-500 font-normal text-right">SIZE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="p-3">
                        {doc.status === 'processing' && <Loader2 size={16} className="text-blue-400 animate-spin" />}
                        {doc.status === 'ready' && <CheckCircle size={16} className="text-green-500" />}
                        {doc.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-200 group-hover:text-amber-500 transition-colors cursor-pointer">{doc.name}</div>
                      <div className="text-[10px] text-gray-600">{doc.uploadDate}</div>
                    </td>
                    <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                            {doc.type}
                        </span>
                    </td>
                    <td className="p-3 text-xs text-gray-400">{doc.bank}</td>
                    <td className="p-3 text-xs text-gray-500 font-mono text-right">{doc.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};