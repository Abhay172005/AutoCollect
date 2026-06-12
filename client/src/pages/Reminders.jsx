import { useState, useEffect } from 'react';
import { reminderService } from '../services/dataService';
import { Bell, Send, Eye, CheckCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Reminders = () => {
  const [bills, setBills] = useState({ dueToday: [], overdue3Days: [], overdue7Days: [], overdue15Days: [], other: [] });
  const [loading, setLoading] = useState(true);
  const [previewModal, setPreviewModal] = useState(null);
  const [previewMessage, setPreviewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    fetchDueBills();
  }, []);

  const fetchDueBills = async () => {
    try {
      const res = await reminderService.getDueBills();
      setBills(res.data.data || { dueToday: [], overdue3Days: [], overdue7Days: [], overdue15Days: [], other: [] });
    } catch (err) {
      toast.error('Failed to fetch due bills');
    } finally {
      setLoading(false);
    }
  };



  const previewReminder = async (bill) => {
    try {
      const res = await reminderService.previewReminder(bill._id);
      setPreviewMessage(res.data.data.message);
      setPreviewModal(bill);
    } catch (err) {
      toast.error('Failed to load preview');
    }
  };

  const sendSingleReminder = async () => {
    if (!previewModal) return;
    setSending(true);
    try {
      const res = await reminderService.sendReminder({ billId: previewModal._id });
      if (res.data.data && res.data.data.success === false) {
        toast.error(
          <div className="flex flex-col gap-1">
            <strong>❌ WhatsApp Reminder Failed</strong>
            <span className="text-sm">Please verify that the recipient has joined the Twilio Sandbox.</span>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.success('✅ WhatsApp Reminder Sent Successfully');
        setPreviewModal(null);
        fetchDueBills();
      }
    } catch (err) {
      toast.error(
        <div className="flex flex-col gap-1">
          <strong>❌ WhatsApp Reminder Failed</strong>
          <span className="text-sm">Please verify that the recipient has joined the Twilio Sandbox.</span>
        </div>,
        { duration: 6000 }
      );
    } finally {
      setSending(false);
    }
  };

  const sendBulkReminders = async (bucketBills) => {
    const ids = bucketBills.map(b => b._id);
    if (ids.length === 0) {
      toast.error('No bills in this category');
      return;
    }
    setBulkSending(true);
    try {
      const res = await reminderService.sendBulkReminders({ billIds: ids });
      const { sent, failed } = res.data.data;
      toast.success(`${sent} sent, ${failed} failed`);
      fetchDueBills();
    } catch (err) {
      toast.error('Bulk send failed');
    } finally {
      setBulkSending(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      'Due Today': 'badge-warning',
      'Overdue': 'badge-danger',
      'Partially Paid': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-semibold'
    };
    return <span className={styles[status] || 'badge-gray'}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Send payment reminders for due and overdue invoices
          </p>
        </div>
      </div>
      {/* Due bills summary */}
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {Object.values(bills).reduce((sum, bucket) => sum + bucket.length, 0)}
          </p>
          <p className="text-xs text-gray-500">Total bills due for reminders</p>
        </div>
      </div>

      {/* Buckets */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : Object.values(bills).every(bucket => bucket.length === 0) ? (
        <div className="glass-card text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
          <p className="font-medium">All clear!</p>
          <p className="text-sm">No bills currently due for reminders</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: 'dueToday', label: 'Due Today', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { key: 'overdue3Days', label: '3 Days Overdue', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { key: 'overdue7Days', label: '7 Days Overdue', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            { key: 'overdue15Days', label: '15 Days Overdue', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
            { key: 'other', label: 'Other Due Bills', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-dark-800' }
          ].map(({ key, label, color, bg }) => {
            const bucketBills = bills[key];
            if (!bucketBills || bucketBills.length === 0) return null;

            return (
              <div key={key} className="glass-card overflow-hidden">
                <div className={`p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between ${bg}`}>
                  <h3 className={`font-semibold ${color}`}>{label} ({bucketBills.length})</h3>
                  <button 
                    onClick={() => sendBulkReminders(bucketBills)} 
                    disabled={bulkSending} 
                    className="btn-primary py-1.5 px-3 text-sm"
                  >
                    {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-header">Party</th>
                        <th className="table-header">Bill No.</th>
                        <th className="table-header">Due Date</th>
                        <th className="table-header">Balance</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Reminder</th>
                        <th className="table-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bucketBills.map(bill => (
                        <tr key={bill._id} className="table-row">
                          <td className="table-cell font-medium">{bill.partyName}</td>
                          <td className="table-cell">{bill.billNumber}</td>
                          <td className="table-cell">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                          <td className="table-cell tabular-nums font-medium">₹{(bill.balanceAmount || 0).toLocaleString('en-IN')}</td>
                          <td className="table-cell">{statusBadge(bill.status)}</td>
                          <td className="table-cell">
                            {bill.reminderSent ? (
                              <span className="badge-success">Sent</span>
                            ) : (
                              <span className="badge-gray">Not Sent</span>
                            )}
                          </td>
                          <td className="table-cell">
                            <button
                              onClick={() => previewReminder(bill)}
                              className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-colors"
                              title="Preview & Send"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal — WhatsApp Style */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in overflow-hidden">
            {/* WhatsApp-style header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {previewModal.partyName?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{previewModal.partyName}</h3>
                  <p className="text-emerald-100 text-xs">Bill: {previewModal.billNumber} · ₹{(previewModal.balanceAmount || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button onClick={() => setPreviewModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            {/* Chat area */}
            <div className="p-6 bg-[#efeae2] dark:bg-dark-900 min-h-[180px]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              <div className="max-w-[85%] ml-auto">
                <div className="bg-[#dcf8c6] dark:bg-emerald-900/40 rounded-2xl rounded-tr-md p-4 shadow-sm">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">{previewMessage}</pre>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 text-right mt-2">
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </p>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-700 flex gap-3 justify-end bg-white dark:bg-dark-800">
              <button onClick={() => setPreviewModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={sendSingleReminder} disabled={sending} className="btn-primary">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
