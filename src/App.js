import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './components/Gallery';
import Pricing from './components/Pricing';
import Contact from './pages/Contact';
import Booking from './components/Booking';
import './styles/App.css';

function App() {
  return (
    <>
      <Header />
      <Home />
      <Gallery />
      <Services />
      <Pricing />
      <Booking />
      <About />
      <Contact />
      <Footer />
    </>
  );
}

export default App;