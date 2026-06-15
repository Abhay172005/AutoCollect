import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dataService';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, AlertTriangle, CreditCard, CheckCircle, IndianRupee, Bell, TrendingUp, Activity, Users, UploadCloud, Rocket, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import Skeleton from '../components/ui/Skeleton';

const statConfig = [
  { key: 'totalPending', label: 'Total Pending', icon: FileText, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  { key: 'dueToday', label: 'Due Today', icon: Clock, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  { key: 'overdue', label: 'Overdue Bills', icon: AlertTriangle, color: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
  { key: 'partiallyPaid', label: 'Partially Paid', icon: CreditCard, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  { key: 'paid', label: 'Paid Bills', icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'totalOutstanding', label: 'Total Outstanding', icon: IndianRupee, color: 'from-primary-500 to-primary-700', bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-600 dark:text-primary-400', isCurrency: true },
  { key: 'remindersSentToday', label: 'Reminders Today', icon: Bell, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [outstandingData, setOutstandingData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, outstandingRes, trendRes, statusRes, actRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getOutstandingByCustomer(),
        dashboardService.getOverdueTrend(),
        dashboardService.getCollectionStatus(),
        dashboardService.getRecentActivities()
      ]);
      setStats(statsRes.data.data);
      setOutstandingData(outstandingRes.data.data || []);
      setTrendData(trendRes.data.data || []);
      setStatusData(statusRes.data.data || []);
      setActivities(actRes.data.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="stat-card">
              <Skeleton className="w-10 h-10 mb-3 rounded-xl" />
              <Skeleton className="w-16 h-6 mb-1" />
              <Skeleton className="w-24 h-4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="glass-card p-6 h-80" />
          <Skeleton className="glass-card p-6 h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your receivables and collections</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/parties" className="btn-secondary">
            <Users className="w-4 h-4" /> Add Party
          </Link>
          <Link to="/upload" className="btn-primary">
            <UploadCloud className="w-4 h-4" /> Upload ERP
          </Link>
        </div>
      </div>

      {stats?.totalPending === 0 && activities.length === 0 ? (
        <div className="glass-card p-8 md:p-12 text-center animate-fade-in mt-8">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Rocket className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Welcome to AutoCollect!</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-10 text-lg">
            Let's get your automated receivables engine up and running in 3 simple steps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-6 rounded-2xl bg-white/50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 relative overflow-hidden group hover:border-primary-500/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110" />
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-5 text-primary-600 dark:text-primary-400 font-bold text-lg">1</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Your Parties</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Import or add your client details so we know who to remind.</p>
              <Link to="/parties" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1">Go to Parties <ArrowRight className="w-4 h-4"/></Link>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 relative overflow-hidden group hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110" />
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5 text-emerald-600 dark:text-emerald-400 font-bold text-lg">2</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload ERP Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Export your outstanding report from Tally/Busy and drop it here.</p>
              <Link to="/upload" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1">Upload Report <ArrowRight className="w-4 h-4"/></Link>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/50 dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 relative overflow-hidden group hover:border-cyan-500/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110" />
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-5 text-cyan-600 dark:text-cyan-400 font-bold text-lg">3</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Send Reminders</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Review your matched invoices and blast WhatsApp reminders instantly.</p>
              <Link to="/bills" className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1">View Bills <ArrowRight className="w-4 h-4"/></Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mt-6">
            {statConfig.map(({ key, label, icon: Icon, color, bg, text, isCurrency }, i) => {
              const val = stats?.[key] || 0;
              const isHighlight = (key === 'overdue' || key === 'dueToday') && val > 0;
              return (
                <div key={key} className={`stat-card animate-slide-up ${isHighlight ? 'ring-2 ring-red-500/50 dark:ring-red-500/50 bg-red-50/50 dark:bg-red-900/10 scale-[1.02] shadow-lg' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                  {isHighlight && (
                    <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-bl-full -mr-2 -mt-2" />
                  )}
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${text} ${isHighlight ? 'animate-pulse' : ''}`} />
                  </div>
                  <p className={`text-2xl font-bold tabular-nums ${isHighlight ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {isCurrency ? formatCurrency(val) : val}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              );
            })}
          </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding by Customer */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Outstanding by Customer</h2>
            </div>
            {outstandingData.length > 0 && (
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-700 px-2.5 py-1 rounded-full">
                Top {outstandingData.length}
              </span>
            )}
          </div>
          {outstandingData.length > 0 ? (
            <div className="space-y-3">
              {outstandingData.map((item, idx) => {
                const maxVal = outstandingData[0]?.totalOutstanding || 1;
                const pct = Math.round((item.totalOutstanding / maxVal) * 100);
                const barColors = [
                  'from-primary-500 to-primary-400',
                  'from-emerald-500 to-emerald-400',
                  'from-amber-500 to-amber-400',
                  'from-rose-500 to-rose-400',
                  'from-blue-500 to-blue-400',
                  'from-purple-500 to-purple-400',
                  'from-cyan-500 to-cyan-400',
                  'from-orange-500 to-orange-400',
                ];
                const dotColors = [
                  'bg-primary-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
                  'bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-500'
                ];
                return (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[idx % dotColors.length]}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.partyName}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(item.totalOutstanding)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColors[idx % barColors.length]} transition-all duration-700 ease-out group-hover:opacity-80`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">No data available</div>
          )}
        </div>

        {/* Collection Status */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Collection Status</h2>
          </div>
          {statusData.length > 0 ? (
            <div>
              {/* Donut Chart with center stat */}
              <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="status"
                      stroke="none"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#f1f5f9',
                        fontSize: '13px',
                        padding: '8px 14px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {statusData.reduce((sum, d) => sum + d.count, 0)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Bills</span>
                </div>
              </div>

              {/* Custom legend grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-700/50">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.status}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{item.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">No data available</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Trend */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overdue Bills Trend</h2>
          </div>
          <div className="h-72">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v, name) => [name === 'amount' ? formatCurrency(v) : v, name]}
                    contentStyle={{
                      background: 'rgba(15,23,42,0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#f1f5f9',
                      fontSize: '13px',
                      padding: '8px 14px',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#colorAmount)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">No overdue trend data</div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h2>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
            {activities.length > 0 ? activities.map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  act.type === 'reminder' ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-primary-50 dark:bg-primary-900/20'
                }`}>
                  {act.type === 'reminder' ? (
                    <Bell className="w-4 h-4 text-cyan-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{act.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{act.partyName} · {timeAgo(act.date)}</p>
                </div>
                {act.amount != null && (
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatCurrency(act.amount)}
                  </span>
                )}
              </div>
            )) : (
              <div className="text-center text-sm text-gray-400 py-8">No recent activities</div>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;
