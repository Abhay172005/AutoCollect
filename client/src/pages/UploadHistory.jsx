import { useState, useEffect } from 'react';
import { uploadHistoryService } from '../services/dataService';
import { Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const UploadHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await uploadHistoryService.getHistories();
      setHistory(res.data.data || []);
    } catch {
      toast.error('Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review previously uploaded pending bills reports</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">File Name</th>
                <th className="table-header text-center">Total Rows</th>
                <th className="table-header text-center">Valid Rows</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Duplicates</th>
                <th className="table-header text-center">Errors</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="table-cell"><Skeleton className="w-full h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8">
                    <EmptyState 
                      icon={FileText} 
                      title="No upload history" 
                      description="You haven't uploaded any reports yet."
                    />
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(record.uploadDate || record.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-400" />
                        <span className="text-gray-600 dark:text-gray-300">{record.fileName}</span>
                      </div>
                    </td>
                    <td className="table-cell text-center tabular-nums font-semibold">
                      {record.totalRows || 0}
                    </td>
                    <td className="table-cell text-center tabular-nums text-blue-600 font-medium">
                      {record.validRows || 0}
                    </td>
                    <td className="table-cell text-center tabular-nums text-emerald-600 font-medium">
                      {record.status || '—'}
                    </td>
                    <td className="table-cell text-center tabular-nums text-amber-600 font-medium">
                      {record.duplicateRows || 0}
                    </td>
                    <td className="table-cell text-center tabular-nums text-gray-500 font-medium">
                      {record.parsingErrors || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UploadHistory;
