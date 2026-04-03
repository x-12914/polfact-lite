import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  FileCheck,
  Upload,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
}

const baseNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Persons of Interest', href: '/pois', icon: UserIcon, roles: ['user', 'journalist', 'admin'] },
  { name: 'Claims', href: '/claims', icon: FileCheck, roles: ['user', 'journalist', 'admin'] },
  { name: 'Sources', href: '/sources', icon: FileText, roles: ['user', 'journalist', 'admin'] },
  { name: 'Media Submissions', href: '/submissions', icon: Upload, roles: ['journalist', 'admin'] },
];

const journalistNavigation: NavItem[] = [
  { name: 'Web Scraper', href: '/scraper', icon: FileText, roles: ['journalist', 'admin'] },
];

const adminNavigation: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', icon: ShieldAlert, roles: ['admin'] },
  { name: 'User Management', href: '/users', icon: Users, roles: ['admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const { userRole } = useAuth();

  const getNavigation = (): NavItem[] => {
    const nav = [...baseNavigation];

    if (userRole === 'journalist' || userRole === 'admin') {
      nav.push(...journalistNavigation);
    }

    if (userRole === 'admin') {
      nav.push(...adminNavigation);
    }

    return nav.filter(item => !item.roles || item.roles.includes(userRole || 'user'));
  };

  const navigation = getNavigation();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-blue-400">PolFact Lite</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      {/* Settings - Admin Only */}
      {userRole === 'admin' && (
        <div className="border-t border-slate-800 p-4">
          <Link
            to="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 text-slate-400" />
            Settings
          </Link>
        </div>
      )}
    </div>
  );
}
