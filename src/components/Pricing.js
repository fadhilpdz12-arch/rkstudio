import React from 'react';
import './Pricing.css';

const Pricing = () => {
  return (
    <div className="pricing">
      <h2>Pricing</h2>
      <div className="pricing-option">
        <h3>Basic Package</h3>
        <p>Includes a 1-hour session with 10 edited photos.</p>
        <p>Price: $100</p>
      </div>
      <div className="pricing-option">
        <h3>Standard Package</h3>
        <p>Includes a 2-hour session with 20 edited photos.</p>
        <p>Price: $180</p>
      </div>
      <div className="pricing-option">
        <h3>Premium Package</h3>
        <p>Includes a 3-hour session with 30 edited photos and a photo album.</p>
        <p>Price: $250</p>
      </div>
    </div>
  );
};

export default Pricing;