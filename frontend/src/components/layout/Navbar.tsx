import { Search, UserCircle, LogIn, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, userRole } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return '🛡️ Admin';
      case 'journalist':
        return '🧑‍💼 Journalist';
      default:
        return '👤 User';
    }
  };

  return (
    <header className="navbar-glass flex h-14 sm:h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex-shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-white transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 min-w-0 max-w-lg items-center rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 px-3 sm:px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all">
        <Search className="mr-2 sm:mr-3 h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search claims, POIs..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none font-medium"
        />
      </div>

      <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
        {isAuthenticated ? (
          <>
          <div className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-200 dark:border-zinc-700 pl-3 sm:pl-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name || 'User'}</span>
                <span className="text-xs text-slate-500">{getRoleLabel()}</span>
              </div>
              <div className="flex flex-col items-center">
                <UserCircle className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 dark:text-zinc-500" />
                <button 
                  onClick={handleLogout}
                  className="text-[10px] sm:text-xs text-slate-500 cursor-pointer hover:text-blue-600 mt-0.5 sm:mt-1"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 sm:px-6 py-2 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
