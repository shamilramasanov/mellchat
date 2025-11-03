import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Settings, 
  Shield, 
  Database, 
  Bot, 
  Activity,
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ArrowLeft,
  Globe,
  LogOut,
  Filter
} from 'lucide-react';
import { LANGUAGES, LANGUAGE_NAMES } from '@shared/utils/constants';
import DashboardContent from '../components/admin/DashboardContent';
import AnalyticsContent from '../components/admin/AnalyticsContent';
import ModerationContent from '../components/admin/ModerationContent';
import SystemContent from '../components/admin/SystemContent';
import DatabaseContent from '../components/admin/DatabaseContent';
import SecurityContent from '../components/admin/SecurityContent';
import AIAssistantContent from '../components/admin/AIAssistantContent';
import UsersContent from '../components/admin/UsersContent';
import GlobalRulesContent from '../components/admin/GlobalRulesContent';
import UserActivityContent from '../components/admin/UserActivityContent';
import AdminLoginScreen from '../components/admin/AdminLoginScreen';

const AdminScreen = ({ onBack }) => {
  // ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ В НАЧАЛЕ - до любых условных return!
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Проверяем авторизацию при монтировании
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token');
      const user = localStorage.getItem('admin_user');
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          setAdminUser(userData);
          setIsAuthenticated(true);
        } catch (e) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageMenu && !event.target.closest('.language-selector')) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu]);

  const handleLoginSuccess = (token, user) => {
    console.log('🎉 Admin login success in AdminScreen:', { hasToken: !!token, user });
    setAdminUser(user);
    setIsAuthenticated(true);
    console.log('✅ Admin authenticated state updated');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setShowLanguageMenu(false);
  };

  // Показываем загрузку при проверке авторизации
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Показываем экран входа если не авторизован
  if (!isAuthenticated) {
    return (
      <AdminLoginScreen 
        onSuccess={handleLoginSuccess} 
        onBack={onBack}
      />
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: t('common.dashboard'), color: 'text-blue-500' },
    { id: 'analytics', icon: TrendingUp, label: t('common.analytics'), color: 'text-green-500' },
    { id: 'moderation', icon: Shield, label: t('common.moderation'), color: 'text-purple-500' },
    { id: 'users', icon: Users, label: t('admin.users.title'), color: 'text-teal-500' },
    { id: 'user-activity', icon: Activity, label: t('admin.userActivity.title'), color: 'text-purple-500' },
    { id: 'global-rules', icon: Filter, label: t('admin.globalRules.title'), color: 'text-pink-500' },
    { id: 'system', icon: Settings, label: t('common.system'), color: 'text-orange-500' },
    { id: 'database', icon: Database, label: t('common.database'), color: 'text-cyan-500' },
    { id: 'security', icon: Shield, label: t('common.security'), color: 'text-red-500' },
    { id: 'ai-assistant', icon: Bot, label: t('common.aiAssistant'), color: 'text-indigo-500' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'moderation':
        return <ModerationContent />;
      case 'users':
        return <UsersContent />;
      case 'user-activity':
        return <UserActivityContent />;
      case 'global-rules':
        return <GlobalRulesContent />;
      case 'system':
        return <SystemContent />;
      case 'database':
        return <DatabaseContent />;
      case 'security':
        return <SecurityContent />;
      case 'ai-assistant':
        return <AIAssistantContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('admin.title')}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {adminUser?.username || 'Admin Panel'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${activeTab === item.id ? 'text-blue-500' : item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('common.backToApp')}</span>
            </button>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{t('common.systemOnline')}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-500">{t('common.dashboard')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{t('common.lastUpdated')}: 2 min ago</span>
              </div>
              
              {/* Language Selector */}
              <div className="relative language-selector">
                <button 
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span className="language-name">{LANGUAGE_NAMES[i18n.language]}</span>
                </button>
                
                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {Object.values(LANGUAGES).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                            i18n.language === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <span className="language-name">{LANGUAGE_NAMES[lang]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};



export default AdminScreen;
