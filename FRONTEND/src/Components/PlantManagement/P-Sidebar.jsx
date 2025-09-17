import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { LayoutDashboard, Warehouse, ClipboardCheck, Sprout, Bug, Gauge, TrendingUp, Settings, Menu, X } from 'lucide-react';
import './styles/P-Sidebar.css';

const Sidebar = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/PlantManagement', label: 'dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/PlantManagement/greenhouse', label: 'greenhouseManagement', icon: <Warehouse size={20} /> },
    { path: '/PlantManagement/inspection', label: 'inspectionManagement', icon: <ClipboardCheck size={20} /> },
    { path: '/PlantManagement/fertilizing', label: 'fertilizingManagement', icon: <Sprout size={20} /> },
    { path: '/PlantManagement/pest-disease', label: 'pestDiseaseManagement', icon: <Bug size={20} /> },
    { path: '/PlantManagement/monitor-control', label: 'monitorControl', icon: <Gauge size={20} /> },
    { path: '/PlantManagement/productivity', label: 'productivity', icon: <TrendingUp size={20} /> },
    { path: '/PlantManagement/settings', label: 'settings', icon: <Settings size={20} /> },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`pm-sidebar ${isCollapsed ? 'pm-collapsed' : ''}`}>
      <div className="pm-logo-container">
        <div className="pm-logo">
          <Sprout size={24} />
          {!isCollapsed && <span>Smart Farm</span>}
        </div>
        <button className="pm-toggle-button" onClick={toggleSidebar}>
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
      <nav className="pm-nav-menu">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`pm-nav-item ${location.pathname.startsWith(item.path) ? 'pm-active' : ''}`}
          >
            <div className="pm-nav-icon">{item.icon}</div>
            {!isCollapsed && <span>{t(item.label)}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
