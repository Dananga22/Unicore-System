import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Map, 
  ChevronRight, 
  Menu, 
  X,
  Layout,
  Zap,
  Search,
  Award
} from 'lucide-react';
import HeroCarousel from './HeroCarousel';
import './LandingPage.css';

const LandingPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    return (
        <div className="landing-page">
            {/* CUSTOM RESPONSIVE NAVBAR */}
            <nav className={`custom-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    <Link to="/" className="nav-logo" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                        UniCore
                    </Link>

                    {/* Desktop Links */}
                    <div className="nav-links desktop-only">
                        <a href="#features" className="nav-item" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
                        <a href="#facilities" className="nav-item" onClick={(e) => scrollToSection(e, 'facilities')}>Facilities</a>
                        <a href="#workflow" className="nav-item" onClick={(e) => scrollToSection(e, 'workflow')}>Support</a>
                        <a href="#contact" className="nav-item" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
                    </div>

                    <div className="nav-auth desktop-only">
                        <Link to="/login" className="btn-login">Log In</Link>
                        <Link to="/signup" className="btn-signup-nav">Sign Up</Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                    </button>
                </div>
            </nav>

            {/* MOBILE MENU OVERLAY */}
            <div className={`mobile-overlay ${isMenuOpen ? 'active' : ''}`}>
                <div className="mobile-menu-content">
                    <a href="#features" className="mobile-item" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
                    <a href="#facilities" className="mobile-item" onClick={(e) => scrollToSection(e, 'facilities')}>Facilities</a>
                    <a href="#workflow" className="mobile-item" onClick={(e) => scrollToSection(e, 'workflow')}>Support</a>
                    <a href="#contact" className="mobile-item" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
                    <div className="mobile-auth">
                        <Link to="/login" className="mobile-btn login" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                        <Link to="/signup" className="mobile-btn signup" onClick={() => setIsMenuOpen(false)}>Create Account</Link>
                    </div>
                </div>
            </div>
            {/* FULL-WIDTH HERO CAROUSEL */}
            <div style={{ paddingTop: '0' }}>
              <HeroCarousel />
            </div>

            {/* FEATURES SECTION */}
            <section id="features" className="section-padding">
                <div className="section-header">
                    <div className="badge-pill mb-4" style={{ background: '#eef2ff', color: '#4f46e5', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800, display: 'inline-block' }}>
                        SMART FEATURES
                    </div>
                    <h2>Everything you need to manage your campus</h2>
                    <p>Powerful, intuitive tools designed to completely streamline university operations and enhance the academic experience.</p>
                </div>
                
                <div className="features-grid">
                    <div className="feature-card-modern">
                        <div className="feature-icon-wrapper" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                            <MapPin size={28} />
                        </div>
                        <h3>Facility Booking</h3>
                        <p>Browse and centrally manage all university rooms, specialized labs, and hardware with a few clicks.</p>
                    </div>
                    <div className="feature-card-modern">
                        <div className="feature-icon-wrapper" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                            <Zap size={28} />
                        </div>
                        <h3>Real-Time Availability</h3>
                        <p>Reserve facilities instantly with automated conflict resolution and real-time status updates across the campus.</p>
                    </div>
                    <div className="feature-card-modern">
                        <div className="feature-icon-wrapper" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                            <AlertCircle size={28} />
                        </div>
                        <h3>Ticket Reporting</h3>
                        <p>Report physical damage or IT issues immediately and track their resolution progress with full transparency.</p>
                    </div>
                    <div className="feature-card-modern">
                        <div className="feature-icon-wrapper" style={{ background: '#faf5ff', color: '#a855f7' }}>
                            <Layout size={28} />
                        </div>
                        <h3>User Dashboard</h3>
                        <p>Personalized workspace for students and staff to manage their bookings, tickets, and campus notifications.</p>
                    </div>
                </div>
            </section>

            {/* FACILITIES GRID SECTION */}
            <section id="facilities" className="section-padding facilities-section">
                <div className="section-header">
                    <div className="badge-pill mb-4" style={{ background: '#f0fdf4', color: '#15803d', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800, display: 'inline-block' }}>
                        PREMIUM SPACES
                    </div>
                    <h2>World-Class Academic Infrastructure</h2>
                    <p>Discover the high-tech environments designed to foster innovation and collaborative learning.</p>
                </div>

                <div className="facilities-grid">
                    {[
                        { title: 'Lecture Theatres', img: '/images/facility_lecture.png', desc: 'Acoustically optimized spaces for grand seminars.' },
                        { title: 'Computing Labs', img: '/images/facility_lab.png', desc: 'High-performance workstations for digital innovation.' },
                        { title: 'Grand Auditoriums', img: '/images/facility_auditorium.png', desc: 'Large scale venues for university-wide events.' },
                        { title: 'Collaborative Study', img: '/images/facility_library.png', desc: 'Quiet zones and pods for intense group work.' }
                    ].map((facility, idx) => (
                        <div key={idx} className="facility-card">
                            <img src={facility.img} alt={facility.title} className="facility-img" />
                            <div className="facility-info">
                                <h4>{facility.title}</h4>
                                <p>{facility.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SUPPORT WORKFLOW SECTION */}
            <section id="workflow" className="section-padding">
                <div className="section-header">
                    <h2>Seamless Support Workflow</h2>
                    <p>Getting help should be easy. Our streamlined ticketing process ensures your campus issues are resolved in record time.</p>
                </div>

                <div className="workflow-container">
                    <div className="step-item">
                        <div className="step-number"><Search size={32} /></div>
                        <h5>Report Issue</h5>
                        <p className="text-muted px-4" style={{ fontSize: '0.9rem' }}>Submit a ticket with photos and location details in seconds.</p>
                    </div>
                    <div className="step-item">
                        <div className="step-number"><Calendar size={32} /></div>
                        <h5>Track Progress</h5>
                        <p className="text-muted px-4" style={{ fontSize: '0.9rem' }}>Receive real-time updates and notifications on your request status.</p>
                    </div>
                    <div className="step-item">
                        <div className="step-number"><Award size={32} /></div>
                        <h5>Resolve Quickly</h5>
                        <p className="text-muted px-4" style={{ fontSize: '0.9rem' }}>Our expert technicians ensure academic life continues without delay.</p>
                    </div>
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="final-cta">
                <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h2 className="animate-fade">Start managing your campus smarter today</h2>
                    <p className="mb-8 opacity-90" style={{ fontSize: '1.25rem' }}>Join thousands of students and staff already using UniCore to power their university journey.</p>
                    <div className="btn-group">
                        <Link to="/signup" className="btn-white">Get Started</Link>
                        <Link to="/signup" className="btn-outline-white">Sign Up Now</Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer id="contact" className="section-padding" style={{ background: '#0f172a', color: '#fff' }}>
                <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem' }}>
                    <div className="footer-brand">
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff' }}>UniCore</h3>
                        <p style={{ color: '#9ca3af', lineHeight: 1.8 }}>The unified platform designed to simplify academic and administrative operations for leading universities globally.</p>
                    </div>
                    
                    <div className="footer-links">
                        <h4 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Platform</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} style={{ color: '#9ca3af', textDecoration: 'none' }}>Core Features</a>
                            <a href="#facilities" onClick={(e) => scrollToSection(e, 'facilities')} style={{ color: '#9ca3af', textDecoration: 'none' }}>Resource Hub</a>
                            <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>Technician Portal</Link>
                        </div>
                    </div>

                    <div className="footer-contact">
                        <h4 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Contact Us</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#9ca3af' }}>
                            <div className="flex items-center gap-3"><Mail size={16} /> support@unicore.edu</div>
                            <div className="flex items-center gap-3"><Phone size={16} /> +94 (11) 234 5678</div>
                            <div className="flex items-center gap-3"><Map size={16} /> University Campus, HQ 01</div>
                        </div>
                    </div>
                </div>
                
                <div style={{ maxWidth: '1300px', margin: '4rem auto 0', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    <p>&copy; 2026 UniCore Systems. Developed with Precision for Smarter Campuses.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
