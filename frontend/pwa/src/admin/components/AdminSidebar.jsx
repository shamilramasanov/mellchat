import React from 'react';
import { motion } from 'framer-motion';

const AdminSidebar = ({ 
  activeTab, 
  onTabChange, 
  collapsed, 
  onToggleCollapse 
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'System overview and metrics'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Reports and insights'
    },
    {
      id: 'moderation',
      label: 'Moderation',
      icon: '🛡️',
      description: 'AI and manual moderation'
    },
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      description: 'Configuration and monitoring'
    },
    {
      id: 'database',
      label: 'Database',
      icon: '🗄️',
      description: 'DB management and optimization'
    },
    {
      id: 'security',
      label: 'Security',
      icon: '🔒',
      description: 'Access control and audit'
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: '🤖',
      description: 'Chat with AI helper'
    }
  ];

  return (
    <motion.aside 
      className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__logo">
          <span className="admin-sidebar__logo-icon">🎯</span>
          {!collapsed && (
            <span className="admin-sidebar__logo-text">MellChat Admin</span>
          )}
        </div>
        
        <button 
          className="admin-sidebar__toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="admin-sidebar__nav">
        <ul className="admin-sidebar__menu">
          {menuItems.map((item) => (
            <li key={item.id} className="admin-sidebar__menu-item">
              <button
                className={`admin-sidebar__menu-btn ${
                  activeTab === item.id ? 'active' : ''
                }`}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.description : undefined}
              >
                <span className="admin-sidebar__menu-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="admin-sidebar__menu-label">{item.label}</span>
                    <span className="admin-sidebar__menu-description">
                      {item.description}
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-sidebar__footer">
        {!collapsed && (
          <div className="admin-sidebar__status">
            <div className="admin-sidebar__status-indicator"></div>
            <span className="admin-sidebar__status-text">System Online</span>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
