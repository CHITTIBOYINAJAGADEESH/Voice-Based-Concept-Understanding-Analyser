import React from 'react';
import { Mic, BookOpen, Clock, HelpCircle, Info, Phone, Sun, Moon } from 'lucide-react';

export default function Navbar({ page, setPage, theme, toggleTheme }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'assessment', label: 'Oral Assessment', icon: Mic },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'faq', label: 'FAQs', icon: HelpCircle },
    { id: 'about', label: 'About', icon: Info },
    { id: 'support', label: 'Support', icon: Phone },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setPage('home')}>
          <Mic size={24} style={{ color: theme === 'dark' ? '#06b6d4' : '#2563eb' }} />
          <span>VBCUA Analyser</span>
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
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="navbar-actions">
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
