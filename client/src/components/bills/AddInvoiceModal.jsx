import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { billService } from '../../services/dataService';

const AddInvoiceModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partyName: '',
    city: '',
    billNumber: '',
    billDate: '',
    creditDays: 30,
    billAmount: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await billService.createBill({
        ...formData,
        billAmount: Number(formData.billAmount),
        creditDays: Number(formData.creditDays)
      });
      toast.success('Invoice created successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Manual Invoice</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="add-invoice-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Party Name *</label>
              <input required type="text" className="input-field" value={formData.partyName} onChange={e => setFormData({ ...formData, partyName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input type="text" className="input-field" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Number *</label>
              <input required type="text" className="input-field" value={formData.billNumber} onChange={e => setFormData({ ...formData, billNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Date *</label>
              <input required type="date" className="input-field" value={formData.billDate} onChange={e => setFormData({ ...formData, billDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Amount *</label>
                <input required type="number" min="0" step="0.01" className="input-field" value={formData.billAmount} onChange={e => setFormData({ ...formData, billAmount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Days</label>
                <input type="number" min="0" className="input-field" value={formData.creditDays} onChange={e => setFormData({ ...formData, creditDays: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea className="input-field min-h-[80px]" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex gap-3 justify-end shrink-0 bg-gray-50 dark:bg-dark-800/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="add-invoice-form" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInvoiceModal;
