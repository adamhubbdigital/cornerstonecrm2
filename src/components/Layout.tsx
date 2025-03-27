import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, CheckSquare, PieChart, HelpCircle, Settings, Menu, X, LogOut, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { SearchBar } from './SearchBar';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-electron-blue' },
  { path: '/organisations', label: 'Organisations', icon: Building2, iconColor: 'text-exodus-fruit' },
  { path: '/contacts', label: 'Contacts', icon: Users, iconColor: 'text-fade-green' },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, iconColor: 'text-orange-ville' },
  { path: '/calendar', label: 'Calendar', icon: Calendar, iconColor: 'text-prunus-avium' },
  { path: '/reports', label: 'Reports', icon: PieChart, iconColor: 'text-mint-leaf' },
  { path: '/help', label: 'Help', icon: HelpCircle, iconColor: 'text-american-river', mobileOnly: true }
];

const bottomMenuItems = [
  { path: '/help', label: 'Help', icon: HelpCircle, iconColor: 'text-american-river', desktopOnly: true },
  { path: '/settings', label: 'Settings', icon: Settings, iconColor: 'text-american-river' }
];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-lynx-white">
      <header className="bg-white border-b border-city-lights fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-electron-blue"
            >
              <Menu className="h-6 w-6 text-main-text" />
            </button>

            <Link to="/dashboard" className="flex items-center space-x-3 min-w-0">
              <img
                src="https://pregnancyadvice.org.uk/Images/Content/2315/743240.png?modify_dt=635787726343730000"
                alt="Cornerstone Logo"
                className="h-8 w-8 flex-shrink-0 rounded-full object-contain"
              />
              <h1 className="text-xl font-semibold text-main-text truncate">Cornerstone CRM</h1>
            </Link>
          </div>
          
          <div className="hidden md:block flex-1 max-w-xl mx-4">
            <SearchBar />
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] mt-[104px] md:mt-16">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex w-64 bg-white border-r border-city-lights flex-col fixed left-0 bottom-0 top-16 z-40">
          <div className="flex-1 overflow-y-auto py-6">
            <div className="space-y-3">
              {menuItems.filter(item => !item.mobileOnly).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-electron-blue bg-opacity-10 text-main-text'
                        : 'text-main-text hover:bg-city-lights hover:bg-opacity-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-electron-blue' : item.iconColor}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-city-lights space-y-3 bg-white">
            {bottomMenuItems.filter(item => !item.mobileOnly).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    isActive
                      ? 'bg-electron-blue bg-opacity-10 text-main-text'
                      : 'text-main-text hover:bg-city-lights hover:bg-opacity-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-electron-blue' : item.iconColor}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMobileMenu}
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              />

              <motion.nav
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="md:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://pregnancyadvice.org.uk/Images/Content/2315/743240.png?modify_dt=635787726343730000"
                      alt="Cornerstone Logo"
                      className="h-8 w-8 flex-shrink-0 rounded-full object-contain"
                    />
                    <span className="text-lg font-semibold text-main-text">CRM</span>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-2 py-4 overflow-y-auto">
                  <div className="space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={closeMobileMenu}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-electron-blue bg-opacity-10 text-main-text'
                              : 'text-main-text hover:bg-city-lights hover:bg-opacity-50'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? 'text-electron-blue' : item.iconColor}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Menu Items and Logout */}
                <div className="px-2 py-4 border-t border-gray-200">
                  {bottomMenuItems.filter(item => !item.desktopOnly).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                          isActive
                            ? 'bg-electron-blue bg-opacity-10 text-main-text'
                            : 'text-main-text hover:bg-city-lights hover:bg-opacity-50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-electron-blue' : item.iconColor}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className="w-full mt-2 flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-lynx-white md:ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;