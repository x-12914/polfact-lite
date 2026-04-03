import { Bell, Search, UserCircle, LogIn, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, userRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Filter notifications by role (Static for lite version)
  const allNotifications = [
    { id: 1, message: 'New claim added', time: '5 minutes ago', color: 'bg-blue-100', roles: ['journalist', 'admin'] },
    { id: 4, message: 'Claim status updated', time: '3 hours ago', color: 'bg-indigo-100', roles: ['user', 'admin'] },
  ];

  const notifications = allNotifications.filter(notif => 
    notif.roles.includes(userRole || 'user')
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

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
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex w-96 max-w-lg items-center rounded-lg bg-slate-100 px-3 py-2">
        <Search className="mr-2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search claims, POIs..."
          className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
        />
      </div>

      <div className="flex items-center space-x-6">
        {isAuthenticated ? (
          <>
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-xl z-50">
                  <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 ${notif.color} hover:opacity-75 transition-opacity cursor-pointer`}>
                        <p className="text-sm font-medium text-slate-900">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</span>
                <span className="text-xs text-slate-500">{getRoleLabel()}</span>
              </div>
              <div className="flex flex-col items-center">
                <UserCircle className="h-8 w-8 text-slate-400" />
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
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
