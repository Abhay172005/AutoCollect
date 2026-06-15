import { useState } from 'react';
import { reportService } from '../services/dataService';
import { Download, Loader2, AlertTriangle, CheckCircle, Clock, CreditCard, Bell, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const reportTypes = [
  { key: 'pending', label: 'Pending Bills', icon: Clock, color: 'from-blue-500 to-blue-600', desc: 'All upcoming, due today, and overdue bills' },
  { key: 'overdue', label: 'Overdue Bills', icon: AlertTriangle, color: 'from-red-500 to-red-600', desc: 'Bills past their due date' },
  { key: 'paid', label: 'Paid Bills', icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', desc: 'Fully paid invoices' },
  { key: 'partial', label: 'Partially Paid', icon: CreditCard, color: 'from-purple-500 to-purple-600', desc: 'Invoices with partial payments' },
  { key: 'reminders', label: 'Reminder Report', icon: Bell, color: 'from-amber-500 to-amber-600', desc: 'All sent reminder logs' },
];

const Reports = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateReport = async (type) => {
    setSelectedType(type);
    setLoading(true);
    try {
      const res = await reportService.getReport(type);
      setData(res.data.data || []);
      setSummary(res.data.summary);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    if (!selectedType) return;
    setExporting(true);
    try {
      const res = await reportService.exportReport(selectedType);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedType}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const isReminderReport = selectedType === 'reminders';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and export business reports</p>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {reportTypes.map(({ key, label, icon: Icon, color, desc }) => (
          <button
            key={key}
            onClick={() => generateReport(key)}
            className={`glass-card-hover p-5 text-left transition-all ${
              selectedType === key ? 'ring-2 ring-primary-500 shadow-glow' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{label}</h3>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </button>
        ))}
      </div>

      {/* Report Data */}
      {selectedType && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary */}
          {summary && (
            <div className="glass-card p-4 flex flex-wrap items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.count}</p>
                <p className="text-xs text-gray-500">Total Records</p>
              </div>
              {!isReminderReport && (
                <>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{(summary.totalAmount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">Total Amount</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary-600">₹{(summary.totalBalance || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">Total Balance</p>
                  </div>
                </>
              )}
              <div className="ml-auto">
                <button onClick={exportCSV} disabled={exporting} className="btn-primary">
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export CSV
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {isReminderReport ? (
                      <>
                        <th className="table-header">Party</th>
                        <th className="table-header">Bill No.</th>
                        <th className="table-header">Phone</th>
                        <th className="table-header">Type</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Sent At</th>
                      </>
                    ) : (
                      <>
                        <th className="table-header">Party</th>
                        <th className="table-header">Bill No.</th>
                        <th className="table-header">Bill Date</th>
                        <th className="table-header">Due Date</th>
                        <th className="table-header">Bill Amount</th>
                        <th className="table-header">Balance</th>
                        <th className="table-header">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="table-row">
                        {Array.from({ length: isReminderReport ? 6 : 7 }).map((_, j) => (
                          <td key={j} className="table-cell"><Skeleton className="w-full h-4" /></td>
                        ))}
                      </tr>
                    ))
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={isReminderReport ? 6 : 7} className="px-4 py-8">
                        <EmptyState 
                          icon={FileSpreadsheet} 
                          title="No data found" 
                          description="There is no data available for this report type."
                        />
                      </td>
                    </tr>
                  ) : isReminderReport ? (
                    data.map((r) => (
                      <tr key={r._id} className="table-row">
                        <td className="table-cell font-medium">{r.partyName}</td>
                        <td className="table-cell">{r.billNumber}</td>
                        <td className="table-cell">{r.phoneNumber || '—'}</td>
                        <td className="table-cell"><span className="badge-info">{r.reminderType}</span></td>
                        <td className="table-cell">
                          <span className={r.status === 'Sent' ? 'badge-success' : 'badge-danger'}>{r.status}</span>
                        </td>
                        <td className="table-cell">{new Date(r.sentAt).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    data.map((bill) => (
                      <tr key={bill._id} className="table-row">
                        <td className="table-cell font-medium">{bill.partyName}</td>
                        <td className="table-cell">{bill.billNumber}</td>
                        <td className="table-cell">{bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="table-cell">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="table-cell tabular-nums">₹{(bill.billAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="table-cell tabular-nums font-medium">₹{(bill.balanceAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="table-cell">
                          <span className={
                            bill.status === 'Paid' ? 'badge-success' :
                            bill.status === 'Overdue' ? 'badge-danger' :
                            bill.status === 'Due Today' ? 'badge-warning' : 'badge-info'
                          }>{bill.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
