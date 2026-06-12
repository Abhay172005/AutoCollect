import { useState, useEffect } from 'react';
import { billService, reminderService } from '../services/dataService';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Bell, Eye, X, Loader2, Plus, Edit2, DollarSign, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AddInvoiceModal from '../components/bills/AddInvoiceModal';
import EditInvoiceModal from '../components/bills/EditInvoiceModal';
import RecordPaymentModal from '../components/bills/RecordPaymentModal';

const statusStyles = {
  'Upcoming': 'badge-info',
  'Due Today': 'badge-warning',
  'Overdue': 'badge-danger',
  'Paid': 'badge-success',
  'Partially Paid': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-semibold'
};

const rowBorderColor = {
  'Overdue': 'border-l-4 border-l-red-500',
  'Due Today': 'border-l-4 border-l-amber-500',
  'Paid': 'border-l-4 border-l-emerald-500',
  'Partially Paid': 'border-l-4 border-l-purple-500',
  'Upcoming': 'border-l-4 border-l-blue-400',
};

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [reminderModal, setReminderModal] = useState(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalBill, setEditModalBill] = useState(null);
  const [paymentModalBill, setPaymentModalBill] = useState(null);
  
  const [selectedBills, setSelectedBills] = useState([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [pagination.page, search, statusFilter, sortBy, sortOrder]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await billService.getBills({
        page: pagination.page,
        limit: 20,
        search,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      setBills(res.data.data);
      setPagination(res.data.pagination);
      setSelectedBills([]); // Clear selection on page/filter change
    } catch (err) {
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await billService.exportCSV({ status: statusFilter });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bills-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openReminder = async (bill) => {
    try {
      const res = await reminderService.previewReminder(bill._id);
      setReminderMessage(res.data.data.message);
      setReminderModal(bill);
    } catch (err) {
      toast.error('Failed to load reminder preview');
    }
  };

  const sendReminder = async () => {
    if (!reminderModal) return;
    setSending(true);
    try {
      await reminderService.sendReminder({ billId: reminderModal._id });
      toast.success('Reminder sent successfully');
      setReminderModal(null);
      fetchBills();
    } catch (err) {
      toast.error('Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBills(bills.map(b => b._id));
    } else {
      setSelectedBills([]);
    }
  };

  const handleSelectBill = (id) => {
    setSelectedBills(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedBills.length} bills?`)) return;
    
    setDeletingBulk(true);
    try {
      await billService.bulkDeleteBills(selectedBills);
      toast.success(`${selectedBills.length} bills deleted`);
      setSelectedBills([]);
      fetchBills();
    } catch (err) {
      toast.error('Failed to delete bills');
    } finally {
      setDeletingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bills</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all your invoices and bills</p>
        </div>
        <div className="flex gap-3">
          {selectedBills.length > 0 && (
            <button onClick={handleBulkDelete} disabled={deletingBulk} className="btn-danger">
              {deletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deletingBulk ? 'Deleting...' : `Delete (${selectedBills.length})`}
            </button>
          )}
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by party or bill number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="input-field w-full sm:w-48"
          >
            <option value="">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Due Today">Due Today</option>
            <option value="Overdue">Overdue</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                    checked={bills.length > 0 && selectedBills.length === bills.length}
                    onChange={handleSelectAll}
                  />
                </th>
                {[
                  { key: 'partyName', label: 'Party' },
                  { key: 'billNumber', label: 'Bill No.' },
                  { key: 'billDate', label: 'Bill Date' },
                  { key: 'creditDays', label: 'Credit Days' },
                  { key: 'dueDate', label: 'Due Date' },
                  { key: 'billAmount', label: 'Bill Amount' },
                  { key: 'balanceAmount', label: 'Balance' },
                  { key: 'status', label: 'Status' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="table-header cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  >
                    {label}
                    {sortBy === key && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton-text w-20 h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No bills found.
                    </td>
                  </tr>
              ) : (
                bills.map((bill) => (
                    <tr key={bill._id} className={`table-row ${rowBorderColor[bill.status] || ''} ${selectedBills.includes(bill._id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                      <td className="table-cell text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                          checked={selectedBills.includes(bill._id)}
                          onChange={() => handleSelectBill(bill._id)}
                        />
                      </td>
                    <td className="table-cell font-medium">{bill.partyName}</td>
                    <td className="table-cell">{bill.billNumber}</td>
                    <td className="table-cell">{bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="table-cell">{bill.creditDays}</td>
                    <td className="table-cell">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="table-cell tabular-nums">₹{(bill.billAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="table-cell tabular-nums font-medium">₹{(bill.balanceAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="table-cell">
                      <span className={statusStyles[bill.status] || 'badge-gray'}>{bill.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {bill.status !== 'Paid' && (
                          <>
                            <button
                              onClick={() => setPaymentModalBill(bill)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                              title="Record Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReminder(bill)}
                              className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
                              title="Send Reminder"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditModalBill(bill)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400 transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reminder Preview Modal */}
      {reminderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reminder Preview</h3>
              <button onClick={() => setReminderModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">To: {reminderModal.partyName}</p>
                <p className="text-sm text-gray-500">Bill: {reminderModal.billNumber}</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-900 rounded-xl p-4 mb-6">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{reminderMessage}</pre>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setReminderModal(null)} className="btn-secondary">Cancel</button>
                <button onClick={sendReminder} disabled={sending} className="btn-primary">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send Reminder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isAddModalOpen && (
        <AddInvoiceModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => { setIsAddModalOpen(false); fetchBills(); }} 
        />
      )}
      
      {editModalBill && (
        <EditInvoiceModal 
          bill={editModalBill} 
          onClose={() => setEditModalBill(null)} 
          onSuccess={() => { setEditModalBill(null); fetchBills(); }} 
        />
      )}

      {paymentModalBill && (
        <RecordPaymentModal 
          bill={paymentModalBill} 
          onClose={() => setPaymentModalBill(null)} 
          onSuccess={() => { setPaymentModalBill(null); fetchBills(); }} 
        />
      )}
    </div>
  );
};

export default Bills;
