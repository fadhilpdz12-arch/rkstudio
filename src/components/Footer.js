import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Camera Self-Studio. All rights reserved.</p>
      <div className="footer-links">
        <a href="/about">About Us</a>
        <a href="/services">Services</a>
        <a href="/contact">Contact</a>
      </div>
    </footer>
  );
}

export default Footer;