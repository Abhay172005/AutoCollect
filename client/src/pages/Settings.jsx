import { useState, useEffect } from 'react';
import { settingsService } from '../services/dataService';
import { Save, Loader2, Building2, MessageSquareText, User, Mail, CalendarDays, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';

const Settings = () => {
  const [settings, setSettings] = useState({
    merchantName: '',
    businessName: '',
    defaultReminderTemplate: '',
    defaultCreditDays: 30,
    adminEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      setSettings(res.data.data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const previewText = (settings.defaultReminderTemplate || '')
    .replace('{partyName}', 'Sample Party')
    .replace('{balanceAmount}', '1,50,000')
    .replace('{billNumber}', 'INV-001')
    .replace('{businessName}', settings.businessName || 'Your Business')
    .replace('{dueDate}', new Date().toLocaleDateString('en-IN'))
    .replace('{billAmount}', '2,00,000');

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="w-40 h-8" />
        <div className="glass-card p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}><Skeleton className="w-24 h-4 mb-2" /><Skeleton className="w-full h-10" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your business and app preferences</p>
      </div>

      {/* Business Information Card */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-dark-700/50 bg-gray-50/50 dark:bg-dark-900/30">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary-500" /> Business Information
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" /> Merchant Name
              </label>
              <input
                value={settings.merchantName}
                onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })}
                className="input-field"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" /> Business Name
              </label>
              <input
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="input-field"
                placeholder="Business name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> Admin Email
              </label>
              <input
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                className="input-field"
                placeholder="admin@company.com"
                type="email"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" /> Default Credit Days
              </label>
              <input
                value={settings.defaultCreditDays}
                onChange={(e) => setSettings({ ...settings, defaultCreditDays: parseInt(e.target.value) || 0 })}
                className="input-field w-32"
                type="number"
                min={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Template Card */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-dark-700/50 bg-gray-50/50 dark:bg-dark-900/30 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-primary-500" /> Reminder Template
          </h2>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-ghost py-1.5 px-3 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? 'Hide Preview' : 'Live Preview'}
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {['{partyName}', '{balanceAmount}', '{billNumber}', '{businessName}', '{dueDate}', '{billAmount}'].map(v => (
              <span key={v} className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[11px] font-mono font-medium cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                onClick={() => {
                  const el = document.getElementById('template-textarea');
                  if (el) {
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const text = settings.defaultReminderTemplate;
                    const newText = text.substring(0, start) + v + text.substring(end);
                    setSettings({ ...settings, defaultReminderTemplate: newText });
                  }
                }}
              >
                {v}
              </span>
            ))}
          </div>
          <textarea
            id="template-textarea"
            value={settings.defaultReminderTemplate}
            onChange={(e) => setSettings({ ...settings, defaultReminderTemplate: e.target.value })}
            className="input-field font-mono text-sm"
            rows={6}
            placeholder="Enter reminder message template..."
          />

          {/* Live Preview */}
          {showPreview && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 p-4 animate-scale-in">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">WhatsApp Preview</p>
              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-700">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{previewText}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
