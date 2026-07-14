import React from 'react';
import { Mic, BookOpen, Clock, HelpCircle, Info, Sun, Moon, User, LogOut } from 'lucide-react';

export default function Navbar({ page, setPage, theme, toggleTheme, user, onLogout }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'assessment', label: 'Oral Assessment', icon: Mic },
    { id: 'profile', label: 'Profile Dashboard', icon: User },
    { id: 'faq', label: 'FAQs', icon: HelpCircle },
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setPage('home')}>
          <div style={{
            background: theme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(99, 102, 241, 0.1)',
            padding: '0.4rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifycontent: 'center',
            boxShadow: theme === 'dark' ? '0 0 12px rgba(20, 184, 166, 0.25)' : 'none'
          }}>
            <Mic size={20} style={{ color: theme === 'dark' ? '#14b8a6' : '#6366f1' }} />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>VBCUA </span>
        </div>

        <ul className="navbar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id || (item.id === 'assessment' && page === 'dashboard');
            return (
              <li
                key={item.id}
                className={`navbar-item ${isActive ? 'active' : ''}`}
              >
                <button onClick={() => setPage(item.id)}>
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

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
      </div>
    </nav>
  );
}
