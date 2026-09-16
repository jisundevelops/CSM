import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/assets', label: 'Assets', icon: 'AS' },
  { to: '/findings', label: 'Findings', icon: 'FN' },
  { to: '/risks', label: 'Risks', icon: 'RK' },
  { to: '/tasks', label: 'Tasks', icon: 'TK' },
  { to: '/evidence', label: 'Evidence', icon: 'EV' },
  { to: '/audit', label: 'Audit Log', icon: 'AU' },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-2xl leading-none px-2"
          aria-label="Open menu"
        >
          &#9776;
        </button>
        <h1 className="text-lg font-bold">CSM</h1>
        <div className="w-8" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-50
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">CSM</h1>
            <p className="text-xs text-gray-400 mt-1">Continuous Security Manager</p>
          </div>
          <button
            onClick={closeMobile}
            className="md:hidden text-gray-400 hover:text-white text-xl px-2"
            aria-label="Close menu"
          >
            &#10005;
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-xs font-mono bg-gray-800 rounded px-1.5 py-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 pt-20 md:pt-6 w-full">
        <Outlet />
      </main>
    </div>
  );
};