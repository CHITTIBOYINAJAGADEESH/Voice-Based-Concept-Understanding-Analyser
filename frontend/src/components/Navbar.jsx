import React, { useState } from 'react';
import { Mic, BookOpen, Clock, HelpCircle, Info, Sun, Moon, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar({ page, setPage, theme, toggleTheme, user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'assessment', label: 'Oral Assessment', icon: Mic },
    { id: 'profile', label: 'Profile Dashboard', icon: User },
    { id: 'faq', label: 'FAQs', icon: HelpCircle },
    { id: 'about', label: 'About', icon: Info }
  ];

  const handleNavigate = (id) => {
    setPage(id);
    setDrawerOpen(false);
  };

  const handleMobileLogout = () => {
    onLogout();
    setDrawerOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand" onClick={() => handleNavigate('home')}>
            <div style={{
              background: theme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              padding: '0.4rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme === 'dark' ? '0 0 12px rgba(20, 184, 166, 0.25)' : 'none'
            }}>
              <Mic size={20} style={{ color: theme === 'dark' ? '#14b8a6' : '#6366f1' }} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>VBCUA </span>
          </div>

          {/* Desktop Menu */}
          <ul className="navbar-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = page === item.id || (item.id === 'assessment' && page === 'dashboard');
              return (
                <li
                  key={item.id}
                  className={`navbar-item ${isActive ? 'active' : ''}`}
                >
                  <button onClick={() => handleNavigate(item.id)}>
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Desktop Actions */}
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user && (
              <button
                className="theme-toggle-btn"
                onClick={onLogout}
                title="Sign Out"
                aria-label="Sign Out"
                style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
              >
                <LogOut size={16} />
              </button>
            )}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobile Actions/Trigger */}
          <div className="navbar-actions-mobile" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title="Toggle Theme"
              aria-label="Toggle Theme"
              style={{ width: '36px', height: '36px' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="mobile-menu-toggle"
              onClick={() => setDrawerOpen(!drawerOpen)}
              title="Toggle Menu"
              aria-label="Toggle Menu"
              style={{ width: '36px', height: '36px' }}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`mobile-menu-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mic size={18} style={{ color: theme === 'dark' ? '#14b8a6' : '#6366f1' }} />
            <span style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 50%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              VBCUA Menu
            </span>
          </div>
          <button 
            className="theme-toggle-btn" 
            onClick={() => setDrawerOpen(false)}
            title="Close Menu"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>

        <ul className="drawer-menu-list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id || (item.id === 'assessment' && page === 'dashboard');
            return (
              <li
                key={item.id}
                className={`drawer-menu-item ${isActive ? 'active' : ''}`}
              >
                <button onClick={() => handleNavigate(item.id)}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {user && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {user.email}
              </span>
            </div>
            <button
              className="btn-premium btn-danger"
              onClick={handleMobileLogout}
              style={{ width: '100%', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
