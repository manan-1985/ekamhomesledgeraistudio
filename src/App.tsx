import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import DashboardTab from './components/DashboardTab';
import ResidentsTab from './components/ResidentsTab';
import IncomeTab from './components/IncomeTab';
import ExpensesTab from './components/ExpensesTab';
import ReportsTab from './components/ReportsTab';
import RegistrationsTab from './components/RegistrationsTab';
import { 
  LayoutDashboard, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  BarChart3, 
  Sparkles, 
  LogOut, 
  LogIn, 
  Loader2,
  Mail,
  Lock,
  UserCheck,
  Globe,
  Database,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { EkamLogoCompact } from './components/EkamLogo';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenApply: () => void;
}

function Header({ onOpenLogin, onOpenApply }: HeaderProps) {
  const { residents, user, logout, useLocalBypass, profile } = useData();
  const [showDropdown, setShowDropdown] = useState(false);
  const activeCount = residents.filter((r) => r.active).length;

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 select-none">
            <div className="p-1 rounded-xl bg-[#FAF9D2]/80 border border-[#1D3E24]/10 flex items-center justify-center shadow-xs">
              <EkamLogoCompact size={32} brandColor="#1D3E24" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-emerald-950 text-[17px] tracking-tight leading-none">Ekam Homes Doon</h1>
                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">
                  {useLocalBypass ? 'OFFLINE' : 'LIVE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-none mt-1">
                Occupancy: {activeCount} active tenants
              </p>
            </div>
          </div>

          {/* User Account Controls */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-[#1D3E24]/5"
            >
              {user && user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-emerald-500/20 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-100 uppercase">
                  {user ? (user.displayName || user.email || 'A').charAt(0) : 'G'}
                </div>
              )}
              <div className="hidden md:flex flex-col items-start text-left shrink-0">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user ? (user.displayName || 'Live Session') : 'Guest User'}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {user ? user.email : 'Click for login/apply'}
                </p>
              </div>
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl z-50 animate-fade-in text-slate-800">
                  {user ? (
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-black text-slate-800 truncate">{user.displayName || 'Registered User'}</p>
                      <p className="text-[10px] text-slate-450 font-bold truncate mt-0.5">{user.email}</p>
                      {profile ? (
                        <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 border border-emerald-100 text-emerald-800">
                          Manager Profile Active
                        </span>
                      ) : (
                        <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 border border-amber-100 text-amber-805">
                          Verification Pending
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-black text-slate-800">Local Guest View</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Not connected to Cloud</p>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {!user ? (
                      <>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            onOpenLogin();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-slate-705 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all cursor-pointer text-left"
                        >
                          <LogIn className="w-4 h-4 text-slate-400" />
                          <span>Login / Sign In</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            onOpenApply();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-emerald-850 hover:bg-emerald-50/70 rounded-xl transition-all cursor-pointer text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Apply for Manager</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {!profile && (
                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              onOpenApply();
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-emerald-850 hover:bg-emerald-50/70 rounded-xl transition-all cursor-pointer text-left"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span>Apply for Manager</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-red-650 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all cursor-pointer mt-1 pt-1 border-t border-slate-100 text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Logout</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MainLayout() {
  const { 
    user, 
    userLoading, 
    loading, 
    error,
    setError,
    login, 
    loginEmail,
    registerEmail,
    useLocalBypass,
    setUseLocalBypass,
    logout,
    profile,
    profileLoading,
    saveProfile,
    allRegistrations
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Login screen sub-state selection
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Profile completion states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Pre-fill profile name from Google authentication when available
  React.useEffect(() => {
    if (user && !profile && !regName && user.displayName) {
      setRegName(user.displayName);
    }
  }, [user, profile, regName]);

  // Shared Month Selection state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setActionLoading(true);
    try {
      if (isRegistering) {
        await registerEmail(email, password);
      } else {
        await loginEmail(email, password);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Guest login option removed

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'residents', label: 'Tenants', icon: Users },
    { id: 'income', label: 'Income', icon: ArrowDownLeft, colorClass: 'text-emerald-500' },
    { id: 'expenses', label: 'Expenses', icon: ArrowUpRight, colorClass: 'text-red-500' },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  if (user && user.email === 'mbansal198542@gmail.com') {
    navigationItems.push({ id: 'registrations', label: 'Managers', icon: ShieldCheck });
  }

  // 1. Loading screen while authenticating
  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 tracking-wide">Syncing secure ledger status...</p>
        </div>
      </div>
    );
  }

  // 2. Beautiful multi-method Authentication screen
  if (!user) {
    return (
      <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Subtle decorative grid/lights */}
        <div className="absolute inset-0 bg-[radial-gradient(#1D3E24_1px,transparent_1px)] [background-size:16px_16px] opacity-3" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-white border border-slate-200 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 text-center animate-fade-in z-10">
          
          {/* Logo Brand Title */}
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF9D2]/80 border border-[#1D3E24]/10 flex items-center justify-center shadow-xs mx-auto">
              <EkamLogoCompact size={44} brandColor="#1D3E24" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-emerald-950 tracking-tight">Ekam Homes Doon</h2>
              <p className="text-[9px] text-emerald-800 bg-emerald-50 font-black uppercase px-2 py-0.5 rounded-full inline-block border border-emerald-100">
                Co-Living & Hostel Ledger v3.2.2
              </p>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
              Provide your credential below or run instantly offline in browser memory.
            </p>
          </div>

          {/* Authentication Error banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200/50 rounded-xl text-left flex items-start space-x-2 text-red-650 max-h-24 overflow-y-auto">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="text-[11px] font-bold">
                <span className="block font-black uppercase text-[9px] tracking-wide text-red-650">Authentication Notice:</span>
                {error.includes('auth/popup-blocked') 
                  ? 'Your browser blocked the Google Sign-in popup. Please use the Email options below.' 
                  : error}
              </div>
            </div>
          )}

          {/* Method Selection Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setAuthMethod('email')}
              className={`py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                authMethod === 'email' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Email Sign-in
            </button>
            <button
              onClick={() => setAuthMethod('google')}
              className={`py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                authMethod === 'google' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Google Auth
            </button>
          </div>

          {/* TAB 2: Email & Password */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-left py-1">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@ekamhomes.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#1D3E24] focus:ring-1 focus:ring-[#1D3E24] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#1D3E24] focus:ring-1 focus:ring-[#1D3E24] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-2 flex items-center justify-center bg-[#1D3E24] hover:bg-[#152e1a] disabled:bg-[#1d3e24]/60 text-white py-3 px-5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md active:scale-98"
              >
                {actionLoading && <Loader2 className="w-4.5 h-4.5 animate-spin mr-2" />}
                <span>{isRegistering ? 'Create Free Secure Ledger' : 'Sign In securely'}</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold underline cursor-pointer"
                >
                  {isRegistering ? 'Already have an account? Sign In' : "Don't have a login yet? Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Google Login */}
          {authMethod === 'google' && (
            <div className="space-y-4 py-2">
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                Syncs with your Google Account across different devices. Note: requires allowing second-party popup windows in your browser settings.
              </p>
              <button
                type="button"
                onClick={login}
                className="w-full flex items-center justify-center space-x-3 bg-[#1D3E24] hover:bg-[#152e1a] text-white py-3 px-5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md active:scale-98"
              >
                {/* Google multi-color vector icon */}
                <svg className="w-4.5 h-4.5 shrink-0 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.103 1.025 5.047 1.926l3.227-3.11C18.281 1.7 15.483 1 12.24 1 5.955 1 12.24 1 12.24 1s4.955 11.24 11.24 11.24c6.558 0 10.922-4.611 10.922-11.12 0-.75-.084-1.32-.181-1.825h-10.741"
                  />
                </svg>
                <span>Google Log-in</span>
              </button>
            </div>
          )}

          {/* Fallback Option: Browser Local Database Mode */}
          <div className="border-t border-slate-200/60 pt-4 mt-2">
            <button
              type="button"
              onClick={() => setUseLocalBypass(true)}
              className="w-full flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 py-2.5 px-4 rounded-xl font-bold text-[11px] transition-all cursor-pointer active:scale-98"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Use Offline Browser-Local Mode</span>
            </button>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">
              Runs instantly. Data is stored directly inside your browser cache.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // 2.5 Optional Profile registration helper
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    setRegLoading(true);
    try {
      await saveProfile(regName, regPhone);
      setShowApplyModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRegLoading(false);
    }
  };

  // 3. Loading database snapshots
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-55 flex flex-col items-center justify-center p-6 select-none relative">
        <div className="absolute inset-0 bg-[radial-gradient(#1D3E24_1px,transparent_1px)] [background-size:16px_16px] opacity-3" />
        
        <div className="relative bg-white border border-slate-205 py-8 px-6 rounded-3xl shadow-xl space-y-6 text-center max-w-sm w-full">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <div className="space-y-1.5">
            <p className="text-xs font-black text-slate-800 tracking-wide uppercase">Connecting to Cloud Tables</p>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Fetching ledger records and active lease metrics from your private Firestore database...
            </p>
          </div>

          {/* Quick Local Bypass Fallback option right inside the loading pane */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[10px] text-slate-400 font-bold">
              Connecting taking too long or blocked by firewall?
            </p>
            <button
              type="button"
              onClick={() => setUseLocalBypass(true)}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>Convert to Instant Local Storage</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-[9px] text-slate-455 hover:text-slate-600 block mx-auto underline cursor-pointer"
            >
              Cancel Connection & Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Ledger Shell
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      <div>
        <Header 
          onOpenLogin={() => {
            // Restore cloud authentication screen by disabling offline override
            setUseLocalBypass(false);
          }}
          onOpenApply={() => setShowApplyModal(true)}
        />

        {/* Tab Selection Navigation bar */}
        <div className="border-b border-slate-200/60 bg-white shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-3xs border border-blue-105/10'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Primary Page Canvas */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <DashboardTab
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === 'residents' && <ResidentsTab />}

          {activeTab === 'income' && (
            <IncomeTab
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          )}

          {activeTab === 'registrations' && (
            <RegistrationsTab />
          )}
        </main>
      </div>

      {/* manager application request modal overlay ("this window") */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplyModal(false)}
              className="absolute inset-0 bg-[#07130B]/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
              className="relative bg-white border border-slate-200 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-center z-10 overflow-hidden"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF9D2]/80 border border-[#1D3E24]/10 flex items-center justify-center shadow-xs mx-auto">
                  <ShieldCheck className="w-10 h-10 text-[#1D3E24]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-emerald-950 tracking-tight">Apply for Manager</h2>
                  <p className="text-[10px] text-emerald-850 bg-emerald-50 font-black uppercase px-2.5 py-0.5 rounded-full inline-block border border-emerald-100">
                    Setup Manager Registration
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
                  Ekam Homes managers get read/write sync access to the ledger database. Your request goes immediately to lead administrator <span className="font-extrabold text-[#1D3E24] underline">mbansal198542@gmail.com</span>.
                </p>
              </div>

              {!user || useLocalBypass ? (
                <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-2xl space-y-3.5 text-left">
                  <div className="flex items-start space-x-2.5 text-amber-900">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-600" />
                    <div className="text-[11px] font-bold">
                      <span className="block font-black uppercase text-[9px] tracking-wide text-amber-800">Connection Action Required:</span>
                      Applications require registering a real email/Google authentication session on the live network.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setUseLocalBypass(false);
                      logout();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-800 hover:bg-emerald-900 transition-all cursor-pointer text-center shadow-3xs"
                  >
                    Return & Log In Live
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Registered Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-355" />
                      <input
                        type="email"
                        disabled
                        value={user.email || ''}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-450 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Your Full Name</label>
                    <div className="relative">
                      <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-805 focus:outline-hidden focus:border-[#1D3E24] focus:ring-1 focus:ring-[#1D3E24] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Your Phone / Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="e.g. +91 98XXX XXX00"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-805 focus:outline-hidden focus:border-[#1D3E24] focus:ring-1 focus:ring-[#1D3E24] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col space-y-2">
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full flex items-center justify-center bg-[#1D3E24] hover:bg-[#152e1a] disabled:bg-[#1d3e24]/60 text-white py-3 px-5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md active:scale-98"
                    >
                      {regLoading && <Loader2 className="w-4.5 h-4.5 animate-spin mr-2" />}
                      <span>Submit Application Request</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="w-full border border-slate-205 text-slate-500 hover:bg-slate-50 py-2.5 px-5 rounded-xl font-semibold text-xs transition-all cursor-pointer text-center"
                    >
                      Cancel / Back
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:justify-between sm:items-center text-slate-400 text-xs font-semibold">
          <p>© 2026 Ekam Homes Doon. All rights preserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center justify-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>Responsive Bookkeeping Dashboard</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <MainLayout />
    </DataProvider>
  );
}
