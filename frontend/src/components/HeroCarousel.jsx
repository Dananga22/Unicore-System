import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';

const slides = [
  {
    image: '/images/hero_campus.png',
    title: 'Smart Campus Management Made Simple',
    subtitle: 'Digitizing the academic landscape with a unified operating system for students and staff.',
    cta: 'Get Started',
    link: '/signup'
  },
  {
    image: '/images/hero_booking.png',
    title: 'Book Facilities, Manage Resources, and Track Requests',
    subtitle: 'Instantly reserve labs, halls, and equipment with real-time availability and smart conflict resolution.',
    cta: 'Explore Facilities',
    link: '/resources'
  },
  {
    image: '/images/hero_facilities.png',
    title: 'A Smarter Way to Run University Operations',
    subtitle: 'From advanced computing suites to grand auditoriums, manage every resource with precision.',
    cta: 'Learn More',
    link: '#features'
  },
  {
    image: '/images/hero_support.png',
    title: 'Instant Support & Real-Time Resolution',
    subtitle: 'Integrated ticketing and maintenance systems to keep your campus running at peak performance.',
    cta: 'Access Support',
    link: '/tickets/new'
  }
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  return (
    <div 
      className="hero-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="slides-wrapper">
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className={`slide-item ${index === current ? 'active' : ''}`}
            style={{ opacity: index === current ? 1 : 0 }}
          >
            <div 
              className="slide-bg" 
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="slide-overlay"></div>
            </div>
            
            <div className="slide-content-container">
              <div className="slide-content animate-slide-up">
                <h1 className="slide-title">{slide.title}</h1>
                <p className="slide-subtitle">{slide.subtitle}</p>
                <div className="slide-actions">
                  <Link 
                    to={slide.link} 
                    className="btn-carousel-primary"
                    onClick={(e) => {
                      if (slide.link.startsWith('#')) {
                        e.preventDefault();
                        const el = document.getElementById(slide.link.substring(1));
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {slide.cta} <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation UI */}
      <button className="nav-btn prev" onClick={prevSlide}>
        <ChevronLeft size={32} />
      </button>
      <button className="nav-btn next" onClick={nextSlide}>
        <ChevronRight size={32} />
      </button>

      {/* Pagination Dots */}
      <div className="carousel-dots">
        {slides.map((_, index) => (
          <button 
            key={index}
            className={`dot ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
