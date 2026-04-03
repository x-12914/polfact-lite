import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  User, 
  Globe, 
  Save, 
  Lock, 
  Moon, 
  Sun,
  Laptop
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme.tsx';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'application' | 'language';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { theme, setTheme } = useTheme();

  const navigation = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'application', name: 'Application', icon: SettingsIcon },
    { id: 'language', name: 'Language', icon: Globe },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {activeTab === 'profile' && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Settings</h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                      <input type="text" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                      <input type="text" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" defaultValue="Doe" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="button" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white"><Save className="h-4 w-4" /> Save Changes</button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'application' && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Application Appearance</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', name: 'Light', icon: Sun },
                    { id: 'dark', name: 'Dark', icon: Moon },
                    { id: 'system', name: 'System', icon: Laptop },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTheme(item.id as any)}
                      className={`flex flex-col items-center gap-3 rounded-xl border p-4 transition-all ${
                        theme === item.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs font-bold uppercase tracking-wider">{item.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
