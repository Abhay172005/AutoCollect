import { useState } from 'react';
import { X, Loader2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { billService } from '../../services/dataService';

const RecordPaymentModal = ({ bill, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paymentAmount = Number(amount);
    
    if (paymentAmount <= 0) {
      return toast.error('Amount must be greater than 0');
    }
    if (paymentAmount > bill.balanceAmount) {
      return toast.error('Payment cannot exceed current balance');
    }

    setLoading(true);
    try {
      await billService.recordPayment(bill._id, { amount: paymentAmount });
      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
        <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Record Payment
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 space-y-1">
            <p className="text-sm text-gray-500">Bill No: <span className="font-medium text-gray-900 dark:text-gray-300">{bill.billNumber}</span></p>
            <p className="text-sm text-gray-500">Party: <span className="font-medium text-gray-900 dark:text-gray-300">{bill.partyName}</span></p>
            <p className="text-sm text-gray-500">Current Balance: <span className="font-bold text-emerald-600">₹{(bill.balanceAmount || 0).toLocaleString('en-IN')}</span></p>
          </div>
          
          <form id="record-payment-form" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Amount *</label>
              <input 
                required 
                type="number" 
                min="0.01" 
                step="0.01" 
                max={bill.balanceAmount}
                className="input-field" 
                placeholder="Enter amount"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex gap-3 justify-end bg-gray-50 dark:bg-dark-800/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="record-payment-form" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
