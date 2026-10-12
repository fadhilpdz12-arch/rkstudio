import React from 'react';
import '../styles/About.css';

function About() {
  return (
    <section id="about" className="about">
      <div className="about-content">
        <h2>About Studio Besut</h2>
        <p>
          Studio Besut is a modern, minimalist camera self-studio designed for photographers, content creators, and anyone looking for professional-quality photos without the high costs of traditional studio rentals.
        </p>
        <p>
          With state-of-the-art equipment, professional lighting, and clean aesthetic backdrops, we provide the perfect environment for your creative vision.
        </p>
        <div className="about-features">
          <div className="feature">
            <h3>📸 Professional Equipment</h3>
            <p>High-end cameras and lighting setup</p>
          </div>
          <div className="feature">
            <h3>🎨 Modern Aesthetic</h3>
            <p>Clean, minimalist design backdrops</p>
          </div>
          <div className="feature">
            <h3>💼 Affordable Rates</h3>
            <p>Professional quality at accessible prices</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;