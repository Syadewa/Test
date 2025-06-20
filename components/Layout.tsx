import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  if (!user) {
    // For routes like login page that don't use the main layout
    return <Outlet />; 
  }

  return (
    <div className="min-h-screen bg-smkn-gray flex flex-col">
      <Navbar toggleMobileSidebar={toggleMobileSidebar} />
      
      {/* Container for Sidebar and Main content. 
          - 'flex-1': takes remaining vertical space from parent flex-col.
          - 'md:flex': on medium screens and up, this becomes a flex row container.
          - 'pt-16': global padding top to push content below the fixed Navbar.
      */}
      <div className="flex-1 md:flex pt-16"> 
        <Sidebar isMobileOpen={isMobileSidebarOpen} closeMobileSidebar={toggleMobileSidebar} />
        
        {/* Main content area 
            - 'w-full': On mobile (when parent is block), takes full width.
            - 'md:flex-1': On desktop (when parent is flex), takes remaining horizontal space.
            - 'overflow-y-auto': Allows main content to scroll independently.
            - 'h-full': Attempts to fill the height of its flex container parent.
        */}
        <main className="w-full md:flex-1 overflow-y-auto h-full">
          <div className="p-4 sm:p-6 lg:p-8"> {/* Inner padding for content */}
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
};

export default Layout;