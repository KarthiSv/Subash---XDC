import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/ui/button';
import {
  LayoutDashboard, FileText, Image, Music, Sparkles, Shirt,
  Calendar, LogOut, ChevronRight, Menu, X, Loader2
} from 'lucide-react';

const sidebarLinks = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/dashboard/content', label: 'Site Content', icon: FileText },
  { path: '/admin/dashboard/gallery', label: 'Gallery Manager', icon: Image },
  { path: '/admin/dashboard/classes', label: 'Dance Classes', icon: Music },
  { path: '/admin/dashboard/services', label: 'Dance Services', icon: Sparkles },
  { path: '/admin/dashboard/costumes', label: 'Costumes', icon: Shirt },
  { path: '/admin/dashboard/bookings', label: 'Bookings', icon: Calendar },
];

export default function AdminLayout() {
  const { admin, loading, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin');
    }
  }, [admin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-white/[0.06]">
          <Link to="/" className="font-playfair text-xl font-bold text-white">
            X<span className="text-gold">DC</span>
            <span className="text-white/30 text-xs font-inter ml-2">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-inter transition-all duration-200 ${
                  isActive
                    ? 'text-gold bg-gold/[0.08] border-r-2 border-gold'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="mb-3 px-2">
            <p className="text-white text-sm font-inter font-semibold">{admin.name}</p>
            <p className="text-white/30 text-xs font-inter">{admin.email}</p>
          </div>
          <Button
            onClick={() => { logout(); navigate('/admin'); }}
            variant="outline"
            className="w-full border-white/[0.06] text-white/40 hover:text-white hover:bg-white/[0.03] rounded-none font-inter text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-inter text-white text-sm font-semibold">
            {sidebarLinks.find(l => l.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className="ml-auto">
            <Link to="/" target="_blank">
              <Button variant="outline" className="border-white/[0.06] text-white/40 hover:text-gold rounded-none font-inter text-xs">
                View Site
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
