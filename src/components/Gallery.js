import React from 'react';
import './Gallery.css';

const Gallery = () => {
  const images = [
    // Add image URLs here
    'image1.jpg',
    'image2.jpg',
    'image3.jpg',
    'image4.jpg',
    'image5.jpg',
  ];

  return (
    <div className="gallery">
      <h2>Our Gallery</h2>
      <div className="gallery-grid">
        {images.map((image, index) => (
          <div key={index} className="gallery-item">
            <img src={image} alt={`Gallery item ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;