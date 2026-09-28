import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadPaper } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError('File size exceeds the 30MB limit.');
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please drop a valid PDF document.');
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        setError('File size exceeds the 30MB limit.');
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setProgress(15);

    try {
      const data = await uploadPaper(selectedFile, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Scale upload progress to 80%, leave last 20% for server extraction & vectorization
          setProgress(Math.min(85, Math.max(15, Math.round(percent * 0.85))));
        }
      });

      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        onUploadSuccess(data);
        onClose();
      }, 500);
    } catch (err) {
      setUploading(false);
      setProgress(0);
      setError(err.response?.data?.detail || err.message || 'Failed to upload and process PDF.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-800 text-base">Upload Research Paper</h3>
          </div>
          {!uploading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50 hover:bg-brand-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
            >
              <div className="p-3 bg-brand-100 text-brand-600 rounded-full">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag & drop research paper
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported format: PDF (up to 30 MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-brand-100 text-brand-600 rounded-lg flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 rounded hover:bg-slate-200"
                >
                  Change
                </button>
              )}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                  {progress < 85 ? 'Uploading & parsing PDF...' : 'Extracting pages & generating embeddings...'}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Start Ingestion</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
