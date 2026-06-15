import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageTransition from './PageTransition';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#09090b] relative overflow-hidden flex">
      {/* Animated Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400 blur-[120px] mix-blend-multiply animate-pulse-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400 blur-[120px] mix-blend-multiply animate-pulse-slow" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-400 blur-[120px] mix-blend-multiply animate-pulse-slow" style={{animationDelay: '2s'}} />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex-1 flex flex-col min-w-0 lg:ml-[300px] h-screen overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 scrollbar-thin">
          <div className="max-w-[1600px] mx-auto w-full">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
