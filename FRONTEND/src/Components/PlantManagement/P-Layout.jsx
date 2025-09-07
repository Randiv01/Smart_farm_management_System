import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './P-Sidebar';
import Header from './P-Header';
import './styles/P-Layout.css';

const Layout = () => {
  return (
    <div className="pm-layout">
      <Sidebar />
      <div className="pm-content-container">
        <Header />
        <main className="pm-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
