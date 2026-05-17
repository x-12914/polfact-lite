import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  FileCheck,
  Upload,
  User as UserIcon,
  ShieldAlert,
  Search,
  Database,
  BarChart3,
  Scan,
  X,
  Mic
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  name: string;
  description?: string;
  href: string;
  icon: any;
  roles?: string[];
}

interface SidebarProps {
  onClose?: () => void;
}

const baseNavigation: NavItem[] = [
  { name: 'Console', description: 'Real-time overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live ASR', description: 'Real-time Mic Ingestion', href: '/live-asr', icon: Mic, roles: ['user', 'journalist', 'admin'] },
  { name: 'Subjects', description: 'Persona Intelligence', href: '/pois', icon: UserIcon, roles: ['user', 'journalist', 'admin'] },
  { name: 'Claims', description: 'Fact Verification', href: '/claims', icon: FileCheck, roles: ['user', 'journalist', 'admin'] },
  { name: 'Sources', description: 'Evidence Archive', href: '/sources', icon: Database, roles: ['user', 'journalist', 'admin'] },
  { name: 'Media Box', description: 'Signal Processing', href: '/submissions', icon: Upload, roles: ['journalist', 'admin'] },
  { name: 'DF Analyzer', description: 'AI Video Analysis', href: '/analyzer', icon: Scan, roles: ['user', 'journalist', 'admin'] },
  { name: 'Site Monitor', description: 'Autonomous Site Audits', href: '/site-monitor', icon: ShieldAlert, roles: ['journalist', 'admin'] },
];

const journalistNavigation: NavItem[] = [
  { name: 'OSINT Scraper', description: 'Web Intelligence', href: '/scraper', icon: Search, roles: ['journalist', 'admin'] },
];

const adminNavigation: NavItem[] = [
  { name: 'HQ Command', description: 'System Oversight', href: '/admin', icon: ShieldAlert, roles: ['admin'] },
  { name: 'Recruits', description: 'User Management', href: '/users', icon: Users, roles: ['admin'] },
];

export function Sidebar({ onClose }: SidebarProps) {
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
    <div className="flex h-full w-64 lg:w-72 flex-col bg-[#020617] border-r border-slate-800/60 shadow-2xl z-50">
      <div className="flex h-20 lg:h-24 items-center justify-between px-6 lg:px-8 border-b border-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <div>
            <span className="text-sm font-black text-white uppercase tracking-[0.2em] block leading-none">Fact Checker</span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mt-1 opacity-80">Ecosystem v1.0</span>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 lg:px-4 py-6 lg:py-8 scrollbar-custom">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-3 lg:ml-4">Command Center</div>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 lg:gap-4 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-3 transition-all duration-300 relative',
                  isActive 
                    ? 'bg-indigo-600/10 text-white border-r-2 border-indigo-500 shadow-[inset_0_0_20px_-10px_rgba(99,102,241,0.3)]' 
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg lg:rounded-xl transition-all duration-300 flex-shrink-0',
                  isActive ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-900/50 text-slate-500 group-hover:bg-slate-800 group-hover:text-slate-300'
                )}>
                  <item.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-[0.1em] block truncate">{item.name}</span>
                  <span className="text-[9px] font-medium text-slate-600 block mt-0.5 group-hover:text-slate-400 truncate">{item.description}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 lg:p-6 border-t border-slate-800/40 bg-slate-900/20">
        {userRole === 'admin' && (
          <Link
            to="/settings"
            className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-slate-400 hover:text-white transition-all duration-300 group"
          >
            <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-indigo-600/10 group-hover:text-indigo-400 transition-all flex-shrink-0">
              <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
            Settings
          </Link>
        )}
        <div className="mt-3 lg:mt-4 px-3 lg:px-4 py-3 lg:py-4 rounded-xl lg:rounded-2xl bg-indigo-600/5 border border-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
               <span className="text-[10px] font-bold text-slate-300">FC</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-white uppercase tracking-wider truncate">Fact Checker Core</p>
              <p className="text-[9px] text-indigo-400 font-bold uppercase">{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
