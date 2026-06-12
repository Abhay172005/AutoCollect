import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadService } from '../services/dataService';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, XCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setPreviewResult(null);
      setFinalResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await uploadService.uploadPdfExtract(formData);
      setPreviewResult(res.data.data);
      toast.success(`Successfully extracted ${res.data.data.stats.totalRows} rows from PDF.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Extraction failed');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewResult) return;
    setConfirming(true);
    try {
      const res = await uploadService.uploadPdfConfirm({
        fileName: previewResult.fileName,
        stats: previewResult.stats,
        extractedBills: previewResult.extractedBills
      });
      setFinalResult(res.data.data);
      toast.success('Successfully imported and synchronized bills');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewResult(null);
    setFinalResult(null);
  };

  const statusBadge = (status) => {
    const styles = {
      'New': 'badge-info',
      'Paid': 'badge-success',
      'Partially Paid': 'badge-warning',
      'Unchanged': 'badge-gray'
    };
    return <span className={styles[status] || 'badge-gray'}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Pending Bills</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload your weekly Pending Bills (Excel, CSV, or PDF) to extract and compare invoice data
        </p>
      </div>

      {/* Upload Zone */}
      {!previewResult && !finalResult && (
        <div className="glass-card p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                : 'border-gray-300 dark:border-dark-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                isDragActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-dark-700'
              }`}>
                <UploadIcon className={`w-8 h-8 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
              </div>
              {isDragActive ? (
                <p className="text-primary-600 dark:text-primary-400 font-medium">Drop your PDF here...</p>
              ) : (
                <>
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      Drag & drop your Pending Bills file
                    </p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse (Excel, CSV, PDF, max 10MB)</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File preview */}
          {file && (
            <div className="mt-6 flex items-center justify-between bg-gray-50 dark:bg-dark-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={handleExtract}
                disabled={uploading}
                className="btn-primary"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    Preview Extract
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Step */}
      {previewResult && !finalResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Step 1: Preview Extraction</h2>
            <div className="flex gap-3">
              <button onClick={handleReset} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={confirming} className="btn-primary">
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {confirming ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{previewResult.stats.totalRows}</p>
              <p className="text-xs text-gray-500 mt-1">Total Rows</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{previewResult.stats.validRows}</p>
              <p className="text-xs text-gray-500 mt-1">Valid Rows</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{previewResult.stats.duplicateRows}</p>
              <p className="text-xs text-gray-500 mt-1">Duplicate Rows</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{previewResult.stats.parsingErrors}</p>
              <p className="text-xs text-gray-500 mt-1">Parsing Errors</p>
            </div>
          </div>

          {/* Extracted Bills Preview Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Extracted Data Preview ({previewResult.extractedBills?.length || 0})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Party Name</th>
                    <th className="table-header">City</th>
                    <th className="table-header">Bill Number</th>
                    <th className="table-header">Bill Date</th>
                    <th className="table-header">Credit Days</th>
                    <th className="table-header">Bill Amount</th>
                    <th className="table-header">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {previewResult.extractedBills?.slice(0, 100).map((bill, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell font-medium">{bill.partyName}</td>
                      <td className="table-cell">{bill.city || '—'}</td>
                      <td className="table-cell">{bill.billNumber}</td>
                      <td className="table-cell">{bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="table-cell">{bill.creditDays}</td>
                      <td className="table-cell tabular-nums">₹{(bill.billAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="table-cell tabular-nums">₹{(bill.balanceAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewResult.extractedBills?.length > 100 && (
                <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200 dark:border-dark-700">
                  Showing first 100 rows...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final Results Step 2 */}
      {finalResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Step 2: Import Complete</h2>
            <button onClick={handleReset} className="btn-secondary">
              <RefreshCw className="w-4 h-4" /> Upload Another
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{finalResult.comparison?.new || 0}</p>
              <p className="text-xs text-gray-500 mt-1">New Bills</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{finalResult.comparison?.paid || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Paid</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{finalResult.comparison?.partiallyPaid || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Partially Paid</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{finalResult.comparison?.unchanged || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Unchanged</p>
            </div>
          </div>

          {/* Missing Phone Numbers */}
          {finalResult.partySync?.missingPhone?.length > 0 && (
            <div className="glass-card p-4 border-l-4 border-amber-500">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Missing Phone Numbers</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                The following parties don't have phone numbers. Add them in Party Management to send reminders.
              </p>
              <div className="flex flex-wrap gap-2">
                {finalResult.partySync.missingPhone.map((name, i) => (
                  <span key={i} className="badge-warning">{name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Details Table */}
          {finalResult.comparison?.details?.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Comparison Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Bill Number</th>
                      <th className="table-header">Party Name</th>
                      <th className="table-header">Action</th>
                      <th className="table-header">Previous Balance</th>
                      <th className="table-header">New Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalResult.comparison.details.map((detail, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-cell font-medium">{detail.billNumber}</td>
                        <td className="table-cell">{detail.partyName}</td>
                        <td className="table-cell">{statusBadge(detail.action)}</td>
                        <td className="table-cell tabular-nums">
                          {detail.previousBalance != null ? `₹${detail.previousBalance.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="table-cell tabular-nums">
                          ₹{(detail.newBalance || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
