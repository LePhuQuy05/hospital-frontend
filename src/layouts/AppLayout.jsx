import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative flex">
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" hidden={!isSidebarOpen} onClick={() => setIsSidebarOpen(false)} />

        <div className={`fixed inset-y-0 left-0 z-50 transform bg-white shadow-xl transition duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-72`}>
          <div className="flex items-center justify-between border-b border-slate-200 p-4 lg:hidden">
            <div className="text-lg font-semibold">Menu</div>
            <button type="button" onClick={() => setIsSidebarOpen(false)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <Sidebar />
        </div>

        <div className="flex flex-1 flex-col lg:ml-72">
          <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
