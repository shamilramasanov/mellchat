import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Filter, 
  Shield, 
  MessageSquare, 
  Heart,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';
import adminAPI from '@shared/services/adminAPI';

const GlobalRulesContent = () => {
  const { t } = useTranslation();
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('spam');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getGlobalRules();
      setRules(response.rules || {});
    } catch (err) {
      setError(err.message || 'Failed to load rules');
      console.error('Failed to load global rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (ruleType, settings) => {
    const rule = rules[ruleType];
    if (!rule) return;

    setSaving(prev => ({ ...prev, [ruleType]: true }));
    try {
      // Сохраняем сразу в БД
      const response = await adminAPI.saveGlobalRule(ruleType, settings, rule.enabled);
      
      if (response && response.success) {
        // Обновляем список правил из БД
        await loadRules();
        console.log(`✅ Rule "${ruleType}" saved to database`);
      } else {
        throw new Error('Save failed - no success response');
      }
    } catch (err) {
      console.error(`Failed to save rule ${ruleType}:`, err);
      alert(t('admin.globalRules.saveError'));
    } finally {
      setSaving(prev => ({ ...prev, [ruleType]: false }));
    }
  };

  const handleToggleRule = async (ruleType, enabled) => {
    try {
      await adminAPI.toggleGlobalRule(ruleType, enabled);
      await loadRules();
    } catch (err) {
      console.error(`Failed to toggle rule ${ruleType}:`, err);
      alert(t('admin.globalRules.toggleError'));
    }
  };

  const handleOptimizeRules = async () => {
    if (!confirm(t('admin.globalRules.optimizeConfirm'))) {
      return;
    }

    setOptimizing(true);
    try {
      const response = await adminAPI.optimizeGlobalRules();
      
      if (response && response.success) {
        await loadRules();
        alert(`${t('admin.globalRules.optimizeSuccess')}\n\n${response.summary || ''}`);
      } else {
        throw new Error('Optimization failed');
      }
    } catch (err) {
      console.error('Failed to optimize rules:', err);
      alert(err.response?.data?.message || t('admin.globalRules.optimizeError'));
    } finally {
      setOptimizing(false);
    }
  };

  const updateSetting = (ruleType, key, value) => {
    setRules(prev => ({
      ...prev,
      [ruleType]: {
        ...prev[ruleType],
        settings: {
          ...prev[ruleType].settings,
          [key]: value
        }
      }
    }));
  };

  const renderSpamSettings = () => {
    const rule = rules?.spam;
    if (!rule) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.spam.threshold')}
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rule.settings?.threshold || 0.7}
              onChange={(e) => updateSetting('spam', 'threshold', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.globalRules.spam.thresholdHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.spam.minLength')}
            </label>
            <input
              type="number"
              min="1"
              value={rule.settings?.minLength || 3}
              onChange={(e) => updateSetting('spam', 'minLength', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.spam.maxLength')}
            </label>
            <input
              type="number"
              min="1"
              value={rule.settings?.maxLength || 500}
              onChange={(e) => updateSetting('spam', 'maxLength', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.spam.emojiRatio')}
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rule.settings?.emojiRatio || 0.5}
              onChange={(e) => updateSetting('spam', 'emojiRatio', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.spam.capsRatio')}
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rule.settings?.capsRatio || 0.7}
              onChange={(e) => updateSetting('spam', 'capsRatio', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.spam.repeatRatio')}
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rule.settings?.repeatRatio || 0.3}
              onChange={(e) => updateSetting('spam', 'repeatRatio', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          onClick={() => handleSaveRule('spam', rule.settings)}
          disabled={saving.spam}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving.spam ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('admin.globalRules.saving')}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{t('admin.globalRules.save')}</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const renderQuestionsSettings = () => {
    const rule = rules?.questions;
    if (!rule) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.questions.minLength')}
            </label>
            <input
              type="number"
              min="1"
              value={rule.settings?.minLength || 5}
              onChange={(e) => updateSetting('questions', 'minLength', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.questions.questionWords')}
            </label>
            <textarea
              value={(rule.settings?.questionWords || []).join(', ')}
              onChange={(e) => {
                const words = e.target.value.split(',').map(w => w.trim()).filter(Boolean);
                updateSetting('questions', 'questionWords', words);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              rows="3"
              placeholder="?, как, что, где, когда, why, how..."
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.globalRules.questions.wordsHint')}</p>
          </div>
        </div>

        <button
          onClick={() => handleSaveRule('questions', rule.settings)}
          disabled={saving.questions}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving.questions ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('admin.globalRules.saving')}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{t('admin.globalRules.save')}</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const renderMoodSettings = () => {
    const rule = rules?.mood;
    if (!rule) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.mood.sampleSize')}
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={rule.settings?.sampleSize || 50}
              onChange={(e) => updateSetting('mood', 'sampleSize', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.globalRules.mood.sampleSizeHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.mood.updateInterval')}
            </label>
            <input
              type="number"
              min="100"
              value={rule.settings?.updateInterval || 1000}
              onChange={(e) => updateSetting('mood', 'updateInterval', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.globalRules.mood.intervalHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.mood.happyThreshold')}
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rule.settings?.happyThreshold || 0.6}
              onChange={(e) => updateSetting('mood', 'happyThreshold', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.mood.neutralThreshold')}
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rule.settings?.neutralThreshold || 0.4}
              onChange={(e) => updateSetting('mood', 'neutralThreshold', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.globalRules.mood.sadThreshold')}
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rule.settings?.sadThreshold || 0.2}
              onChange={(e) => updateSetting('mood', 'sadThreshold', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          onClick={() => handleSaveRule('mood', rule.settings)}
          disabled={saving.mood}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving.mood ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('admin.globalRules.saving')}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{t('admin.globalRules.save')}</span>
            </>
          )}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-2">{t('admin.common.error')}</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRules}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('admin.common.retry')}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'spam', label: t('admin.globalRules.tabs.spam'), icon: Shield },
    { id: 'questions', label: t('admin.globalRules.tabs.questions'), icon: MessageSquare },
    { id: 'mood', label: t('admin.globalRules.tabs.mood'), icon: Heart }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.globalRules.title')}</h2>
          <p className="text-gray-600">{t('admin.globalRules.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOptimizeRules}
            disabled={optimizing}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
          >
            {optimizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('admin.globalRules.optimizing')}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{t('admin.globalRules.optimize')}</span>
              </>
            )}
          </button>
          <button
            onClick={loadRules}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t('admin.common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const rule = rules?.[tab.id];
            return (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {rule && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRule(tab.id, !rule.enabled);
                    }}
                    className="ml-2 cursor-pointer"
                  >
                    {rule.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {activeTab === 'spam' && renderSpamSettings()}
          {activeTab === 'questions' && renderQuestionsSettings()}
          {activeTab === 'mood' && renderMoodSettings()}
        </div>

        {/* Saved Rules List */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('admin.globalRules.savedRules')}
          </h3>
          
          {rules && Object.keys(rules).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(rules).map(([ruleType, rule]) => {
                const ruleLabels = {
                  spam: t('admin.globalRules.tabs.spam'),
                  questions: t('admin.globalRules.tabs.questions'),
                  mood: t('admin.globalRules.tabs.mood')
                };
                
                return (
                  <div
                    key={ruleType}
                    className={`p-4 rounded-lg border ${
                      rule.enabled
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    } cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setActiveTab(ruleType)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {ruleLabels[ruleType] || ruleType}
                      </h4>
                      {rule.enabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{t('admin.globalRules.status')}:</span>
                        <span className={`font-medium ${
                          rule.enabled ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {rule.enabled 
                            ? t('admin.globalRules.enabled') 
                            : t('admin.globalRules.disabled')
                          }
                        </span>
                      </div>
                      
                      {rule.updatedAt && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{t('admin.globalRules.lastUpdated')}:</span>
                          <span>
                            {new Date(rule.updatedAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(ruleType, !rule.enabled);
                          }}
                          className={`w-full text-xs px-3 py-1 rounded ${
                            rule.enabled
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } transition-colors`}
                        >
                          {rule.enabled
                            ? t('admin.globalRules.disable')
                            : t('admin.globalRules.enable')
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Filter className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">{t('admin.globalRules.noRules')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalRulesContent;

