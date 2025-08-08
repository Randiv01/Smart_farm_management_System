// src/Navbar/Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            Easy<span>Farming</span>
          </Link>
        </div>
        <nav className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/service">Service</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/testimonial">Testimonial</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <div className="login-link"><Link to="/login">Login</Link></div>
            <li className="search-icon">
              <Link to="/search">
                <i className="fa fa-search" aria-hidden="true"></i>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="navbar-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
