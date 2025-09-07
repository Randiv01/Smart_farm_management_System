import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import Button from '../P-Button.jsx';
import { Moon, Sun, Globe, UserCog, Key, ServerCog, Save } from 'lucide-react';
import "../styles/theme.css";
import '../styles/P-Settings.css';
const Settings = () => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  const {
    language,
    changeLanguage,
    t
  } = useLanguage();
  const [activeTab, setActiveTab] = useState('appearance');
  const handleTabChange = tab => {
    setActiveTab(tab);
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <div className="setting-group">
            <h3>Theme</h3>
            <div className="theme-options">
              <div className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
                <Sun size={32} />
                <span>Light Mode</span>
              </div>
              <div className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                <Moon size={32} />
                <span>Dark Mode</span>
              </div>
            </div>
          </div>;
      case 'language':
        return <div className="setting-group">
            <h3>Language</h3>
            <div className="language-options">
              <div className={`language-option ${language === 'en' ? 'active' : ''}`} onClick={() => language !== 'en' && changeLanguage('en')}>
                <span className="language-flag">🇺🇸</span>
                <span>English</span>
              </div>
              <div className={`language-option ${language === 'ta' ? 'active' : ''}`} onClick={() => language !== 'ta' && changeLanguage('ta')}>
                <span className="language-flag">🇱🇰</span>
                <span>Tamil</span>
              </div>
              <div className={`language-option ${language === 'si' ? 'active' : ''}`} onClick={() => language !== 'si' && changeLanguage('si')}>
                <span className="language-flag">🇱🇰</span>
                <span>Sinhala</span>
              </div>
            </div>
            <div className="language-preview">
              <h4>Preview</h4>
              <div className="preview-item">
                <span className="preview-label">Dashboard:</span>
                <span>{t('dashboard')}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Greenhouse Management:</span>
                <span>{t('greenhouseManagement')}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Search:</span>
                <span>{t('search')}</span>
              </div>
            </div>
          </div>;
      case 'roles':
        return <div className="setting-group">
            <h3>User Roles & Permissions</h3>
            <div className="roles-list">
              <div className="role-item">
                <div className="role-header">
                  <h4>Administrator</h4>
                  <button className="role-action-button">Edit</button>
                </div>
                <p className="role-description">Full system access with all permissions</p>
                <div className="role-permissions">
                  <span className="permission-badge">Full Access</span>
                  <span className="permission-badge">User Management</span>
                  <span className="permission-badge">System Settings</span>
                </div>
              </div>
              <div className="role-item">
                <div className="role-header">
                  <h4>Farm Manager</h4>
                  <button className="role-action-button">Edit</button>
                </div>
                <p className="role-description">Manage farm operations and view reports</p>
                <div className="role-permissions">
                  <span className="permission-badge">View Dashboard</span>
                  <span className="permission-badge">Manage Greenhouses</span>
                  <span className="permission-badge">Manage Inspections</span>
                  <span className="permission-badge">View Reports</span>
                </div>
              </div>
              <div className="role-item">
                <div className="role-header">
                  <h4>Field Worker</h4>
                  <button className="role-action-button">Edit</button>
                </div>
                <p className="role-description">Record inspections and harvest data</p>
                <div className="role-permissions">
                  <span className="permission-badge">View Dashboard</span>
                  <span className="permission-badge">Record Inspections</span>
                  <span className="permission-badge">Record Harvest</span>
                </div>
              </div>
            </div>
          </div>;
      case 'api':
        return <div className="setting-group">
            <h3>API & Integrations</h3>
            <form className="endpoints-form">
              <div className="form-group">
                <label htmlFor="weatherApi">Weather API Endpoint</label>
                <input type="text" id="weatherApi" defaultValue="https://api.weather.example.com/v1" />
                <p className="endpoint-hint">Used for weather forecasting and alerts</p>
              </div>
              <div className="form-group">
                <label htmlFor="sensorApi">Sensor Data API Endpoint</label>
                <input type="text" id="sensorApi" defaultValue="https://api.sensors.example.com/data" />
                <p className="endpoint-hint">Connect to greenhouse sensor network</p>
              </div>
              <div className="form-group">
                <label htmlFor="apiKey">API Key</label>
                <input type="password" id="apiKey" defaultValue="••••••••••••••••" />
                <p className="endpoint-hint">Authentication key for API access</p>
              </div>
              <Button icon={<Save size={16} />} onClick={e => {
              e.preventDefault();
              console.log('API settings saved');
            }}>
                Save Settings
              </Button>
            </form>
          </div>;
      default:
        return null;
    }
  };
  return <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>
      <div className="settings-container">
        <div className="settings-sidebar">
          <button className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => handleTabChange('appearance')}>
            <span className="tab-icon">
              {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            <span>Appearance</span>
          </button>
          <button className={`settings-tab ${activeTab === 'language' ? 'active' : ''}`} onClick={() => handleTabChange('language')}>
            <span className="tab-icon">
              <Globe size={18} />
            </span>
            <span>Language</span>
          </button>
          <button className={`settings-tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => handleTabChange('roles')}>
            <span className="tab-icon">
              <UserCog size={18} />
            </span>
            <span>User Roles</span>
          </button>
          <button className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`} onClick={() => handleTabChange('api')}>
            <span className="tab-icon">
              <ServerCog size={18} />
            </span>
            <span>API & Integrations</span>
          </button>
        </div>
        <div className="settings-content">
          {renderTabContent()}
        </div>
      </div>
    </div>;
};
export default Settings;