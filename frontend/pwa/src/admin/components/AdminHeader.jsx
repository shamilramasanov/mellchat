import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useAdminStore from '../store/adminStore';

const AdminHeader = ({ activeTab, onToggleSidebar }) => {
  const { adminUser, logout } = useAdminStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getTabTitle = (tab) => {
    const titles = {
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      moderation: 'Moderation',
      system: 'System Management',
      database: 'Database Management',
      security: 'Security & Access',
      'ai-assistant': 'AI Assistant'
    };
    return titles[tab] || 'Admin Panel';
  };

  return (
    <motion.header 
      className="admin-header"
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="admin-header__left">
        <button 
          className="admin-header__sidebar-toggle"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          ☰
        </button>
        
        <div className="admin-header__title">
          <h1>{getTabTitle(activeTab)}</h1>
          <span className="admin-header__breadcrumb">
            Admin Panel / {getTabTitle(activeTab)}
          </span>
        </div>
      </div>

      <div className="admin-header__right">
        <div className="admin-header__notifications">
          <button 
            className="admin-header__notification-btn"
            title="Notifications"
          >
            🔔
            <span className="admin-header__notification-badge">3</span>
          </button>
        </div>

        <div className="admin-header__user">
          <button 
            className="admin-header__user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="admin-header__user-avatar">
              {adminUser?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="admin-header__user-info">
              <span className="admin-header__user-name">
                {adminUser?.username || 'Admin'}
              </span>
              <span className="admin-header__user-role">
                Super Admin
              </span>
            </div>
            <span className="admin-header__user-arrow">
              {showUserMenu ? '▲' : '▼'}
            </span>
          </button>

          {showUserMenu && (
            <motion.div 
              className="admin-header__user-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="admin-header__user-menu-item">
                <span className="admin-header__menu-icon">👤</span>
                Profile Settings
              </div>
              <div className="admin-header__user-menu-item">
                <span className="admin-header__menu-icon">⚙️</span>
                Preferences
              </div>
              <div className="admin-header__user-menu-divider"></div>
              <div 
                className="admin-header__user-menu-item admin-header__user-menu-item--danger"
                onClick={handleLogout}
              >
                <span className="admin-header__menu-icon">🚪</span>
                Logout
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default AdminHeader;
