import { useState, useEffect } from 'react';
import { reminderService } from '../services/dataService';
import { History, Search, Filter, MessageSquare, X, Bell } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const ReminderHistory = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [partyFilter, setPartyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [messageModal, setMessageModal] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, partyFilter, statusFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await reminderService.getHistory({
        page: pagination.page,
        limit: 20,
        partyName: partyFilter,
        status: statusFilter
      });
      setReminders(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch reminder history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminder History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View all sent reminders and their status</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by party name..."
              value={partyFilter}
              onChange={(e) => { setPartyFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="input-field w-full sm:w-40"
          >
            <option value="">All Status</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Party</th>
                <th className="table-header">Bill No.</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Type</th>
                <th className="table-header">Status</th>
                <th className="table-header">Sent At</th>
                <th className="table-header">Message</th>
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
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8">
                    <EmptyState 
                      icon={Bell} 
                      title="No reminder history" 
                      description="You haven't sent any reminders yet."
                    />
                  </td>
                </tr>
              ) : (
                reminders.map((r) => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell font-medium">{r.partyName}</td>
                    <td className="table-cell">{r.billNumber}</td>
                    <td className="table-cell">{r.phoneNumber || '—'}</td>
                    <td className="table-cell">
                      <span className="badge-info">{r.reminderType}</span>
                    </td>
                    <td className="table-cell">
                      <span className={r.status === 'Sent' ? 'badge-success' : r.status === 'Failed' ? 'badge-danger' : 'badge-warning'}>
                        {r.status}
                      </span>
                    </td>
                    <td className="table-cell">{new Date(r.sentAt).toLocaleString('en-IN')}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => setMessageModal(r)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >Previous</button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary text-sm disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reminder Message</h3>
              <button onClick={() => setMessageModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-3 space-y-1">
                <p className="text-sm text-gray-500">To: <strong className="text-gray-900 dark:text-white">{messageModal.partyName}</strong></p>
                <p className="text-sm text-gray-500">Via: {messageModal.reminderType} · {messageModal.phoneNumber || 'No phone'}</p>
                <p className="text-sm text-gray-500">Sent: {new Date(messageModal.sentAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-900 rounded-xl p-4">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{messageModal.message}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderHistory;
