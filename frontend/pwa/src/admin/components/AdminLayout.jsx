import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Dashboard from './Dashboard/Dashboard';
import Analytics from './Analytics/Analytics';
import Moderation from './Moderation/Moderation';
import System from './System/System';
import Database from './Database/Database';
import Security from './Security/Security';
import AIAssistant from './AIAssistant/AIAssistant';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import LoginForm from './LoginForm';
import useAdminStore from '../store/adminStore';
import './AdminLayout.css';
import './AdminPage.css';

const AdminLayout = () => {
  const { isAuthenticated } = useAdminStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'moderation':
        return <Moderation />;
      case 'system':
        return <System />;
      case 'database':
        return <Database />;
      case 'security':
        return <Security />;
      case 'ai-assistant':
        return <AIAssistant />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`admin-layout__main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <AdminHeader 
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <motion.main 
          className="admin-layout__content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminLayout;
