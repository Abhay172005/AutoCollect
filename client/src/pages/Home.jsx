import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowRight, 
  CheckCircle2, 
  BellRing, 
  FileSpreadsheet, 
  TrendingUp, 
  ShieldCheck, 
  Clock,
  Zap,
  Users,
  IndianRupee,
  Wallet,
  UploadCloud,
  MessageSquare,
  BarChart
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      title: 'Seamless Integrations',
      description: 'Upload Excel, CSV, or PDF exports directly from Tally, Busy, or Marg without manual entry.',
      color: 'text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      icon: <BellRing className="w-6 h-6" />,
      title: 'WhatsApp Reminders',
      description: 'Send real WhatsApp payment reminders to your clients with one click using the Twilio API.',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Actionable Insights',
      description: 'Track outstanding balances, aging summaries, and collection performance on a beautiful dashboard.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Save 10+ Hours/Week',
      description: 'Eliminate manual follow-ups and instantly reduce your average collection period.',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: 'Secure & Reliable',
      description: 'Your financial data is encrypted and securely managed, giving you total peace of mind.',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: 'Smart Matching',
      description: 'Intelligent extraction ensures bill numbers and party names are matched perfectly every time.',
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
    }
  ];

  const stats = [
    { value: '50+', label: 'Parties Tracked', icon: <Users className="w-5 h-5" /> },
    { value: '₹10L+', label: 'Receivables Managed', icon: <IndianRupee className="w-5 h-5" /> },
    { value: '3x', label: 'Faster Recovery', icon: <Zap className="w-5 h-5" /> },
    { value: '100%', label: 'Free to Use', icon: <CheckCircle2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 font-sans selection:bg-primary-500/30">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-dark-900/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-dark-700/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              AutoCollect
            </span>
          </div>
          <div>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] bg-primary-500/15 dark:bg-primary-500/10 blur-[140px] rounded-full" />
          <div className="absolute top-[10%] right-[-15%] w-[40%] h-[60%] bg-amber-500/15 dark:bg-amber-500/10 blur-[140px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[30%] w-[30%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-dark-700/50 text-sm font-semibold mb-8 animate-fade-in shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-gray-700 dark:text-gray-300">Now with Twilio WhatsApp API Integration</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            Automate Your <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-amber-500">
              Payment Collections
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            AutoCollect connects directly to your ERP exports and sends smart, automated WhatsApp reminders to your clients. Recover your outstanding payments 3x faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <Link 
              to={isAuthenticated ? "/dashboard" : "/login"} 
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-semibold text-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-900/20 dark:hover:shadow-white/20 transition-all duration-300 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              {isAuthenticated ? "Enter Dashboard" : "Get Started for Free"}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 -mt-10 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-2xl rounded-2xl border border-gray-200/50 dark:border-dark-700/50 p-5 text-center shadow-card hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-center mb-2 text-primary-500">{stat.icon}</div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How AutoCollect Works
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Three simple steps to transform your chaotic receivables into a streamlined, automated engine.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary-100 via-primary-300 to-primary-100 dark:from-dark-800 dark:via-primary-800 dark:to-dark-800 z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-800 border-4 border-gray-50 dark:border-dark-950 shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <UploadCloud className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Import Data</h3>
              <p className="text-gray-600 dark:text-gray-400">Export your outstanding bills from Tally/Busy and upload the CSV, Excel, or PDF directly.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-800 border-4 border-gray-50 dark:border-dark-950 shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <BarChart className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Track & Analyze</h3>
              <p className="text-gray-600 dark:text-gray-400">AutoCollect matches bills to parties instantly. Monitor your dashboard to see who owes what.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-800 border-4 border-gray-50 dark:border-dark-950 shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Auto Remind</h3>
              <p className="text-gray-600 dark:text-gray-400">Send personalized, professional WhatsApp payment reminders with a single click via Twilio.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white/50 dark:bg-dark-900/50 backdrop-blur-3xl border-y border-gray-200/50 dark:border-dark-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to collect faster
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              A powerful suite of tools designed specifically for B2B merchants to streamline receivables.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="p-7 rounded-2xl bg-white/80 dark:bg-dark-800/60 backdrop-blur-xl border border-gray-100/80 dark:border-dark-700/50 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to automate your follow-ups?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
            Join the smart merchants who have slashed their outstanding receivables.
          </p>
          <Link 
            to={isAuthenticated ? "/dashboard" : "/login"} 
            className="btn-primary px-8 py-4 text-lg inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Go to App <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200/50 dark:border-dark-800/50 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 AutoCollect.</p>
      </footer>
    </div>
  );
};

export default Home;
