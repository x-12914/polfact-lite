import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';

export function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617] selection:bg-indigo-500/30">
      <Sidebar />
      <div className="flex flex-1 flex-col relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-custom relative z-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
