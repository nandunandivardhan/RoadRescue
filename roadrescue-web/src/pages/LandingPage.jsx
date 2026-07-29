import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const serviceCategories = [
    { id: 'flat_tire', label: 'Tire Repair', icon: 'fa-solid fa-tire', color: '#FF6B35', desc: 'Flat tire swap, puncture repair, and air refills done on the spot.' },
    { id: 'battery', label: 'Battery Jump', icon: 'fa-solid fa-car-battery', color: '#2979FF', desc: 'Dead battery diagnostics and high-amp jump-starts instantly.' },
    { id: 'engine', label: 'Engine Help', icon: 'fa-solid fa-gauge-high', color: '#FF1744', desc: 'Overheating check, belt repairs, and emergency engine scans.' },
    { id: 'fuel', label: 'Fuel Delivery', icon: 'fa-solid fa-gas-pump', color: '#FFB300', desc: 'Running low? We deliver gasoline or diesel directly to your lane.' },
    { id: 'towing', label: 'Towing Service', icon: 'fa-solid fa-truck-pickup', color: '#00C853', desc: 'Professional flatbed towing to the nearest authorized workshop.' },
    { id: 'other', label: 'General Diagnostics', icon: 'fa-solid fa-wrench', color: '#6B7280', desc: 'Brake troubleshooting, fluid leaks, and custom mechanical checkups.' },
  ];

  return (
    <div className="bg-dark text-white min-vh-100 d-flex flex-column">
      {/* Hero Section */}
      <section className="position-relative py-5 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0F1117 0%, #151A25 100%)' }}>
        <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 opacity-25" style={{ zIndex: 0 }}>
          <div className="w-100 h-100" style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>
        </div>
        
        <div className="container position-relative py-5" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-center text-lg-start animate-fade-in">
              <h1 className="display-4 font-outfit fw-black text-gradient mb-3" style={{ lineHeight: '1.15' }}>
                AI-Powered <br/>Real-Time Roadside <br/><span style={{ color: 'var(--primary-color)' }}>Assistance</span>
              </h1>
              <p className="lead text-muted mb-4" style={{ fontSize: '1.15rem' }}>
                Stranded on the highway? RoadRescue instantly allocates the closest certified mechanic partner, tracking their route live on your screen using advanced spatial algorithms.
              </p>
              <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3">
                <Link to="/login" className="btn btn-primary-custom d-flex align-items-center justify-content-center gap-2 px-4 py-3 text-decoration-none">
                  <i className="fa-solid fa-kit-medical fs-5"></i> Get Assistance Now
                </Link>
                <Link to="/register" className="btn btn-secondary-custom d-flex align-items-center justify-content-center gap-2 px-4 py-3 text-decoration-none">
                  Register as Mechanic
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="glass-card p-4 mx-auto animate-pulse" style={{ maxWidth: '480px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <span className="bg-danger p-2 rounded-circle me-2 animate-pulse-sos"></span>
                    <span className="fw-bold font-outfit text-white">Live Operations Map</span>
                  </div>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">12 Mechanics Online</span>
                </div>
                {/* Mock Live Map Preview */}
                <div className="bg-dark rounded-4 p-3 border border-secondary text-center position-relative mb-4" style={{ height: '240px', overflow: 'hidden' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                    className="w-100 h-100 object-fit-cover rounded-3 opacity-25 position-absolute top-0 start-0" 
                    alt="Map"
                  />
                  <div className="position-relative d-flex flex-column h-100 justify-content-between" style={{ zIndex: 1 }}>
                    <div className="d-flex justify-content-between">
                      <div className="bg-dark bg-opacity-75 rounded px-2 py-1 small border border-secondary">
                        <i className="fa-solid fa-location-crosshairs text-primary me-1"></i> NH-48 Highway
                      </div>
                      <div className="bg-danger rounded px-2 py-1 small text-white animate-pulse">
                        <i className="fa-solid fa-circle-exclamation me-1"></i> Active Emergency
                      </div>
                    </div>
                    <div className="my-auto">
                      <div className="bg-dark border border-secondary rounded-pill d-inline-flex align-items-center p-2 px-3 shadow">
                        <i className="fa-solid fa-truck-pickup text-primary me-2"></i>
                        <span className="small text-white">Mechanic #RR-204 is en route...</span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">ETA: 4 minutes</small>
                      <small className="text-warning">⭐ 4.9 Rating</small>
                    </div>
                  </div>
                </div>
                
                {/* SOS Assistance Preview Bar */}
                <div className="d-grid">
                  <Link to="/login" className="btn btn-danger py-2.5 fw-bold font-outfit d-flex align-items-center justify-content-center gap-2 rounded-3 text-decoration-none shadow" style={{ background: 'linear-gradient(135deg, #FF1744 0%, #B71C1C 100%)', border: 'none' }}>
                    <i className="fa-solid fa-bell-concierge"></i> Trigger SOS Emergency Rescue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-5 bg-dark border-top border-bottom border-secondary bg-opacity-50">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-3 col-6">
              <div className="p-3">
                <h3 className="display-6 font-outfit fw-extrabold text-gradient-primary mb-1">15 Mins</h3>
                <p className="text-muted small mb-0">Average Response Time</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3">
                <h3 className="display-6 font-outfit fw-extrabold text-gradient-primary mb-1">4.9/5.0</h3>
                <p className="text-muted small mb-0">Customer satisfaction score</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3">
                <h3 className="display-6 font-outfit fw-extrabold text-gradient-primary mb-1">200+</h3>
                <p className="text-muted small mb-0">Verified mechanic partners</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3">
                <h3 className="display-6 font-outfit fw-extrabold text-gradient-primary mb-1">24/7</h3>
                <p className="text-muted small mb-0">Emergency support service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section className="py-5 bg-dark">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="text-primary fw-bold text-uppercase tracking-wider small">On-Demand Help</span>
            <h2 className="display-5 font-outfit fw-bold mt-1 text-white">Emergency Services Categories</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              We resolve the most common vehicle malfunctions right where they happen, avoiding hefty towing fees whenever possible.
            </p>
          </div>
          
          <div className="row g-4">
            {serviceCategories.map((serv) => (
              <div className="col-lg-4 col-md-6" key={serv.id}>
                <div className="glass-card p-4 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div className="p-3 rounded-3 me-3" style={{ backgroundColor: serv.color + '20' }}>
                      <i className={`${serv.icon} fs-4`} style={{ color: serv.color }}></i>
                    </div>
                    <h5 className="font-outfit fw-bold mb-0 text-white">{serv.label}</h5>
                  </div>
                  <p className="text-muted small flex-grow-1" style={{ lineHeight: '1.6' }}>{serv.desc}</p>
                  <Link to="/login" className="btn btn-link text-decoration-none p-0 mt-3 d-inline-flex align-items-center text-primary fw-bold small">
                    Request {serv.label} <i className="fa-solid fa-arrow-right ms-2 transition-transform"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-5 bg-dark bg-opacity-70 border-top border-secondary">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="text-primary fw-bold text-uppercase tracking-wider small">Driver Reviews</span>
            <h2 className="display-6 font-outfit fw-bold mt-1 text-white">Loved by Road Warriors</h2>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="glass-card p-4">
                <div className="d-flex align-items-center mb-3">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" className="rounded-circle me-3 border border-secondary" width="45" height="45" alt="Reviewer" />
                  <div>
                    <h6 className="font-outfit fw-bold mb-0 text-white">Ananya Sharma</h6>
                    <small className="text-muted">Stranded on highway</small>
                  </div>
                </div>
                <p className="text-muted small mb-0 italic" style={{ lineHeight: '1.6' }}>
                  "My tire blew on the way to Jaipur at 11 PM. The app detected my location perfectly. Mechanic accepted within 30 seconds and got there in 15 minutes. Absolute life-saver!"
                </p>
                <div className="text-warning mt-3">★★★★★</div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-4">
                <div className="d-flex align-items-center mb-3">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" className="rounded-circle me-3 border border-secondary" width="45" height="45" alt="Reviewer" />
                  <div>
                    <h6 className="font-outfit fw-bold mb-0 text-white">Rahul Verma</h6>
                    <small className="text-muted">Battery jump client</small>
                  </div>
                </div>
                <p className="text-muted small mb-0 italic" style={{ lineHeight: '1.6' }}>
                  "My battery died in a shopping mall basement. I requested a battery jump, the mechanic arrived on a scooter with a heavy-duty power pack, and had my car running in under 10 minutes."
                </p>
                <div className="text-warning mt-3">★★★★★</div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-4">
                <div className="d-flex align-items-center mb-3">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" className="rounded-circle me-3 border border-secondary" width="45" height="45" alt="Reviewer" />
                  <div>
                    <h6 className="font-outfit fw-bold mb-0 text-white">Priya Patel</h6>
                    <small className="text-muted">Commuter client</small>
                  </div>
                </div>
                <p className="text-muted small mb-0 italic" style={{ lineHeight: '1.6' }}>
                  "I ran out of fuel on the freeway. RoadRescue sent a mechanic who brought 5 liters of fuel. This service gives me total peace of mind for long road trips."
                </p>
                <div className="text-warning mt-3">★★★★★</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-5 bg-dark border-top border-secondary">
        <div className="container py-4">
          <div className="glass-card p-5 bg-gradient style-card" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(27,44,193,0.1) 100%)' }}>
            <div className="row align-items-center g-4">
              <div className="col-lg-7 text-center text-lg-start">
                <h3 className="h1 font-outfit fw-bold text-white mb-2">Download our Android Mobile App</h3>
                <p className="text-muted mb-0">Get access to safety guides, emergency roadside alerts, and instant geolocating with the RoadRescue APK. Fully compiled and optimized for mobile devices.</p>
              </div>
              <div className="col-lg-5 text-center text-lg-end">
                <div className="d-flex justify-content-center justify-content-lg-end gap-3 flex-wrap">
                  <a href="/RoadRescue.apk" download="RoadRescue.apk" className="btn btn-primary-custom px-4 py-3 d-inline-flex align-items-center gap-2 text-decoration-none text-white">
                    <i className="fab fa-android fs-4"></i> Download Android APK (v1.0)
                  </a>
                  <button className="btn btn-secondary-custom px-4 py-3 d-inline-flex align-items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <i className="fa-solid fa-display fs-5"></i> Use Web Version
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
