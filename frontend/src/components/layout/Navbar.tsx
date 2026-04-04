import { Search, UserCircle, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function Navbar() {
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
    <header className="navbar-glass flex h-16 w-full items-center justify-between px-8">
      <div className="flex w-96 max-w-lg items-center rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all">
        <Search className="mr-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search claims, POIs..."
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
        />
      </div>

      <div className="flex items-center space-x-6">
        {isAuthenticated ? (
          <>
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</span>
                <span className="text-xs text-slate-500">{getRoleLabel()}</span>
              </div>
              <div className="flex flex-col items-center">
                <UserCircle className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
                <button 
                  onClick={handleLogout}
                  className="text-xs text-slate-500 cursor-pointer hover:text-blue-600 mt-1"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-blue-700 transition-all"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
