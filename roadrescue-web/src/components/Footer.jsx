import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-muted py-5 border-top border-secondary mt-auto" style={{ backgroundColor: '#0A0C10' }}>
      <div className="container">
        <div className="row g-4 justify-content-between">
          <div className="col-lg-4 col-md-6">
            <h5 className="text-white fw-bold font-outfit mb-3">
              <i className="fas fa-truck-monster text-gradient-primary me-2"></i>
              Road<span style={{ color: 'var(--primary-color)' }}>Rescue</span>
            </h5>
            <p className="small mb-4" style={{ lineHeight: '1.7' }}>
              Real-time AI-powered emergency roadside assistance platform. Instantly connecting stranded drivers with professional, certified nearby mechanic partners.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="btn btn-outline-secondary btn-sm rounded-circle text-white p-2" style={{ width: '36px', height: '36px' }}><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="btn btn-outline-secondary btn-sm rounded-circle text-white p-2" style={{ width: '36px', height: '36px' }}><i className="fab fa-twitter"></i></a>
              <a href="#" className="btn btn-outline-secondary btn-sm rounded-circle text-white p-2" style={{ width: '36px', height: '36px' }}><i className="fab fa-instagram"></i></a>
              <a href="#" className="btn btn-outline-secondary btn-sm rounded-circle text-white p-2" style={{ width: '36px', height: '36px' }}><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3 font-outfit small tracking-wider">Services</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted hover:text-white">Tire Repair</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted hover:text-white">Battery Jump</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted hover:text-white">Engine Fix</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted hover:text-white">Fuel Delivery</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted hover:text-white">Towing</a></li>
            </ul>
          </div>
          
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="text-white fw-bold text-uppercase mb-3 font-outfit small tracking-wider">Resources</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted">About Us</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted">API Docs</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted">Admin Console</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted">Contact Support</a></li>
              <li className="mb-2"><a href="#" className="text-decoration-none text-muted">Developer Team</a></li>
            </ul>
          </div>
          
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold text-uppercase mb-3 font-outfit small tracking-wider">Emergency Support</h6>
            <p className="small mb-3">Our rescue coordination center is online 24/7 to dispatch professional help to your exact location.</p>
            <div className="bg-secondary bg-opacity-25 rounded p-3 border border-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <div className="fw-bold text-white small"><i className="fa-solid fa-server text-warning me-2"></i>System Status</div>
              <small className="text-success d-flex align-items-center mt-1"><span className="spinner-grow spinner-grow-sm text-success me-2" role="status" style={{ width: '8px', height: '8px' }}></span>All Services Operational</small>
            </div>
          </div>
        </div>
        
        <hr className="border-secondary my-4" />
        
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
          <p className="small mb-0">&copy; {new Date().getFullYear()} RoadRescue Inc. All rights reserved.</p>
          <div className="d-flex gap-3 small">
            <a href="#" className="text-decoration-none text-muted">Privacy Policy</a>
            <span className="text-secondary">|</span>
            <a href="#" className="text-decoration-none text-muted">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
