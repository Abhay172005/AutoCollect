import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { partyService } from '../services/dataService';
import { Search, Plus, Edit2, Trash2, Phone, PhoneOff, X, Loader2, MapPin, ExternalLink, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const Parties = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cities, setCities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editParty, setEditParty] = useState(null);
  const [form, setForm] = useState({ partyName: '', phoneNumber: '', city: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [selectedParties, setSelectedParties] = useState([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  useEffect(() => {
    fetchParties();
    fetchCities();
  }, [search, cityFilter]);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await partyService.getParties({ search, city: cityFilter });
      setParties(res.data.data);
      setSelectedParties([]); // Clear selection when data changes
    } catch (err) {
      toast.error('Failed to fetch parties');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await partyService.getCities();
      setCities(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch cities');
    }
  };

  const openAddForm = () => {
    setForm({ partyName: '', phoneNumber: '', city: '', email: '', notes: '' });
    setEditParty(null);
    setShowForm(true);
  };

  const openEditForm = (party) => {
    setForm({
      partyName: party.partyName,
      phoneNumber: party.phoneNumber || '',
      city: party.city || '',
      email: party.email || '',
      notes: party.notes || ''
    });
    setEditParty(party);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.partyName.trim()) {
      toast.error('Party name is required');
      return;
    }
    setSaving(true);
    try {
      if (editParty) {
        await partyService.updateParty(editParty._id, form);
        toast.success('Party updated');
      } else {
        await partyService.addParty(form);
        toast.success('Party added');
      }
      setShowForm(false);
      fetchParties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await partyService.deleteParty(deleteConfirm._id);
      toast.success('Party deleted');
      setDeleteConfirm(null);
      fetchParties();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedParties(parties.map(p => p._id));
    } else {
      setSelectedParties([]);
    }
  };

  const handleSelectParty = (id) => {
    setSelectedParties(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedParties.length} parties?`)) return;
    
    setDeletingBulk(true);
    try {
      await partyService.bulkDeleteParties(selectedParties);
      toast.success(`${selectedParties.length} parties deleted`);
      setSelectedParties([]);
      fetchParties();
    } catch (err) {
      toast.error('Failed to delete parties');
    } finally {
      setDeletingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parties</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage customer information and contacts</p>
        </div>
        <div className="flex gap-3">
          {selectedParties.length > 0 && (
            <button onClick={handleBulkDelete} disabled={deletingBulk} className="btn-danger">
              {deletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deletingBulk ? 'Deleting...' : `Delete (${selectedParties.length})`}
            </button>
          )}
          <button onClick={openAddForm} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Party
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
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="input-field w-full sm:w-48"
          >
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Select All Toggle */}
      {parties.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <input 
            type="checkbox" 
            id="selectAll"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
            checked={selectedParties.length === parties.length}
            onChange={handleSelectAll}
          />
          <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Select All Parties
          </label>
        </div>
      )}

    {/* Party Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <Skeleton className="w-32 h-5 mb-2" />
              <Skeleton className="w-24 h-4 mb-4" />
              <Skeleton className="w-full h-4" />
            </div>
          ))}
        </div>
      ) : parties.length === 0 ? (
        <div className="glass-card">
          <EmptyState 
            icon={Users} 
            title="No parties found" 
            description="Add your customers to start tracking their payments."
            action={openAddForm}
            actionText="Add Party"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parties.map((party) => (
            <div key={party._id} className={`glass-card-hover p-5 relative ${selectedParties.includes(party._id) ? 'ring-2 ring-primary-500 bg-primary-50/20 dark:bg-primary-900/10' : ''}`}>
              
              {/* Card Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                  checked={selectedParties.includes(party._id)}
                  onChange={() => handleSelectParty(party._id)}
                />
              </div>

              <div className="flex items-start justify-between mb-3 ml-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                    {party.partyName?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{party.partyName}</h3>
                    {party.city && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{party.city}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/bills?search=${encodeURIComponent(party.partyName)}`}
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
                    title="View Bills"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEditForm(party)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 hover:text-primary-600 transition-colors"
                    title="Edit Party"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(party)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete Party"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {party.phoneNumber ? (
                    <>
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{party.phoneNumber}</span>
                    </>
                  ) : (
                    <>
                      <PhoneOff className="w-4 h-4 text-amber-500" />
                      <span className="badge-warning text-xs">Missing Phone</span>
                    </>
                  )}
                </div>
                {party.email && (
                  <p className="text-xs text-gray-500 truncate">{party.email}</p>
                )}
                {party.notes && (
                  <p className="text-xs text-gray-400 truncate">{party.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editParty ? 'Edit Party' : 'Add Party'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Party Name *</label>
                <input
                  value={form.partyName}
                  onChange={(e) => setForm({ ...form, partyName: e.target.value })}
                  className="input-field"
                  placeholder="Enter party name"
                  disabled={!!editParty}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="input-field"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="Enter email"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-field"
                  placeholder="Add notes..."
                  rows={2}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : editParty ? 'Update' : 'Add Party'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Party</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.partyName}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parties;
