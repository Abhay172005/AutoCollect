import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { searchService, dashboardService } from '../../services/dataService';
import {
  Menu, Search, Bell, Moon, Sun, X, FileText, Users, Sparkles
} from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await dashboardService.getNotifications();
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch notifications');
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.globalSearch(searchQuery);
        setSearchResults(res.data.data);
        setShowSearch(true);
      } catch (err) {
        console.error('Search failed');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const notifColors = {
    danger: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-dark-700">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: menu + search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Greeting — hidden on mobile */}
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'} 👋
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Here's your receivables overview</p>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bills, parties, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults && setShowSearch(true)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-800 border-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Search results dropdown */}
            {showSearch && searchResults && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-200 dark:border-dark-700 max-h-80 overflow-y-auto z-50">
                {searchResults.bills?.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">Bills</p>
                    {searchResults.bills.map((bill) => (
                      <button
                        key={bill._id}
                        onClick={() => { navigate('/bills'); setShowSearch(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-primary-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{bill.billNumber}</p>
                          <p className="text-xs text-gray-500">{bill.partyName} · ₹{bill.balanceAmount?.toLocaleString('en-IN')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.parties?.length > 0 && (
                  <div className="p-3 border-t border-gray-100 dark:border-dark-700">
                    <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">Parties</p>
                    {searchResults.parties.map((party) => (
                      <button
                        key={party._id}
                        onClick={() => { navigate('/parties'); setShowSearch(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-left"
                      >
                        <Users className="w-4 h-4 text-primary-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{party.partyName}</p>
                          <p className="text-xs text-gray-500">{party.city} · {party.phoneNumber || 'No phone'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {(!searchResults.bills?.length && !searchResults.parties?.length) && (
                  <div className="p-6 text-center text-sm text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: notifications + theme */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-light">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-200 dark:border-dark-700 z-50">
                <div className="p-4 border-b border-gray-100 dark:border-dark-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((notif, i) => (
                      <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-dark-700 last:border-0 ${notifColors[notif.type] || ''}`}>
                        <Bell className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm font-medium">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
