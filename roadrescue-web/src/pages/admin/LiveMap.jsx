import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminNav from '../../components/admin/AdminNav';
import { useAdminLiveMap } from '../../hooks/useAdminLiveMap';
import '../../styles/adminDashboard.css';

// Create custom SVG DivIcons for Leaflet mapping with full defensive defaults
const createMechanicIcon = (name) => {
  const safeName = (typeof name === 'string' && name.trim()) ? name.trim() : 'Mechanic';
  const shortName = safeName.split(' ')[0] || 'Mechanic';
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: rgba(33, 150, 243, 0.2); border: 2px solid #2196F3; border-radius: 50%; box-shadow: 0 0 12px #2196F3;">
        <i class="fas fa-screwdriver-wrench" style="color: #64B5F6; font-size: 13px;"></i>
        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: #1A1F2E; color: #E8E8E8; font-size: 8px; font-weight: 600; padding: 1px 5px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">
          ${shortName}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

const createCustomerIcon = (name) => {
  const safeName = (typeof name === 'string' && name.trim()) ? name.trim() : 'Customer';
  const shortName = safeName.split(' ')[0] || 'Customer';
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: rgba(76, 175, 80, 0.2); border: 2px solid #4CAF50; border-radius: 50%; box-shadow: 0 0 12px #4CAF50;">
        <i class="fas fa-car" style="color: #81C784; font-size: 13px;"></i>
        <div style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); background: #1A1F2E; color: #E8E8E8; font-size: 8px; font-weight: 600; padding: 1px 5px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">
          ${shortName}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

const createSOSIcon = (name) => {
  const safeName = (typeof name === 'string' && name.trim()) ? name.trim() : 'Emergency';
  const shortName = safeName.split(' ')[0] || 'Emergency';
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="admin-pulse-emergency" style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(244, 67, 54, 0.25); border: 2px solid #F44336; border-radius: 50%; animation: admin-pulse-red 1.5s infinite;">
        <i class="fas fa-triangle-exclamation" style="color: #E57373; font-size: 16px; animation: flash-text 1s infinite;"></i>
        <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); background: #F44336; color: #FFFFFF; font-size: 8px; font-weight: 800; padding: 1px 6px; border-radius: 3px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          SOS: ${shortName}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Component to automatically fit bounds for all active markers dynamically
const AutoFitBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = markers.map(m => [m.lat, m.lng]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [markers, map]);
  return null;
};

const LiveMap = () => {
  const { mechanics = [], requests = [], loading } = useAdminLiveMap();

  // Layers filters togglers
  const [showMechanics, setShowMechanics] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Map DOM mount confirmed status to prevent Leaflet initialization timing errors
  const [isMapMounted, setIsMapMounted] = useState(false);
  useEffect(() => {
    setIsMapMounted(true);
    return () => setIsMapMounted(false);
  }, []);

  // Safe filtration & mapping arrays
  const validMechanics = (mechanics || []).filter((mech) => {
    if (!mech) return false;
    const lat = parseFloat(mech.lat);
    const lng = parseFloat(mech.lng);
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  });

  const validRequests = (requests || []).filter((req) => {
    if (!req) return false;
    const lat = parseFloat(req.lat);
    const lng = parseFloat(req.lng);
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  });

  const SOSCount = validRequests.filter(r => r.isSOS || r.priority === 'SOS' || r.priority === 'sos').length;

  const allActiveMarkers = [
    ...validMechanics.map(m => ({ lat: m.lat, lng: m.lng })),
    ...validRequests.map(r => ({ lat: r.lat, lng: r.lng }))
  ];

  return (
    <div className="admin-theme min-vh-100 pb-5" style={{ backgroundColor: '#0F1419' }}>
      <AdminNav />

      <div className="container-fluid px-4 py-4">
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
              GPS Synchronization
            </span>
            <h2 className="fw-black font-outfit text-white mb-0 admin-title-gradient">Real-time Operations Map</h2>
          </div>

          {/* Quick Stats Panel */}
          <div className="admin-glass-card py-2 px-3 d-flex gap-3 align-items-center small">
            <div>
              <span className="text-muted">Mechanics: </span>
              <span className="text-info fw-bold">{validMechanics.length} Online</span>
            </div>
            <div className="border-start border-secondary border-opacity-25 h-100" style={{ width: '1px', height: '14px' }}></div>
            <div>
              <span className="text-muted">Active Cases: </span>
              <span className="text-success fw-bold">{validRequests.length} Requests</span>
            </div>
            {SOSCount > 0 && (
              <>
                <div className="border-start border-secondary border-opacity-25 h-100" style={{ width: '1px', height: '14px' }}></div>
                <div>
                  <span className="text-danger fw-bold admin-flash-text">
                    <span className="spinner-grow spinner-grow-sm text-danger me-1"></span>
                    {SOSCount} SOS Alerts
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Map Layout Panel */}
        <div className="row g-4">
          
          {/* Filter Layers Toggles Sidebar */}
          <div className="col-12 col-lg-3">
            <div className="admin-glass-card p-4 h-100">
              <h5 className="fw-bold font-outfit text-white mb-4">Map Filters & Toggles</h5>
              
              <div className="form-check form-switch mb-3 text-white-50">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="toggleMechs"
                  checked={showMechanics}
                  onChange={() => setShowMechanics(!showMechanics)}
                />
                <label className="form-check-label ms-2 small fw-semibold" htmlFor="toggleMechs">
                  <i className="fas fa-screwdriver-wrench text-info me-2"></i> Show Mechanics ({validMechanics.length})
                </label>
              </div>

              <div className="form-check form-switch mb-3 text-white-50">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="toggleCusts"
                  checked={showCustomers}
                  onChange={() => setShowCustomers(!showCustomers)}
                />
                <label className="form-check-label ms-2 small fw-semibold" htmlFor="toggleCusts">
                  <i className="fas fa-user-group text-success me-2"></i> Show Customers ({validRequests.length})
                </label>
              </div>

              <div className="form-check form-switch mb-4 text-white-50">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="toggleRoutes"
                  checked={showRoutes}
                  onChange={() => setShowRoutes(!showRoutes)}
                />
                <label className="form-check-label ms-2 small fw-semibold" htmlFor="toggleRoutes">
                  <i className="fas fa-route text-warning me-2"></i> Draw Route Polylines
                </label>
              </div>

              {/* Legends explanation */}
              <div className="border-top border-secondary border-opacity-10 pt-4 mt-3">
                <h6 className="fw-bold text-white mb-2">Map Legends</h6>
                <div className="d-flex flex-column gap-2 small text-white-50">
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2196F3', display: 'inline-block', boxShadow: '0 0 6px #2196F3' }}></span>
                    <span>Online Mechanic Partner</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4CAF50', display: 'inline-block', boxShadow: '0 0 6px #4CAF50' }}></span>
                    <span>Active Help Request</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F44336', display: 'inline-block', boxShadow: '0 0 6px #F44336' }}></span>
                    <span>Critical Emergency SOS Alarm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaflet Map Viewer */}
          <div className="col-12 col-lg-9">
            <div 
              className="admin-map admin-dark-map"
              style={{ 
                height: '550px', 
                width: '100%', 
                backgroundColor: '#1A1F2E', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                position: 'relative' 
              }}
            >
              {loading || !isMapMounted ? (
                <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center bg-dark">
                  <div className="spinner-border text-warning mb-3" role="status"></div>
                  <span className="text-white-50 small font-outfit">Synchronizing live coordinate mapping...</span>
                </div>
              ) : validMechanics.length === 0 && validRequests.length === 0 ? (
                <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center text-center p-4 bg-dark">
                  <i className="fas fa-map-location-dot text-muted fs-1 mb-3"></i>
                  <h5 className="text-white fw-bold">No Active Coordinates Available</h5>
                  <p className="text-muted small max-width-350 mb-0">
                    There are currently no active rescue requests or online mechanics broadcasting GPS telemetry.
                  </p>
                </div>
              ) : (
                <MapContainer 
                  center={[28.4595, 77.0266]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  {/* Load dark styled cartographic tiles */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />

                  {/* Auto-fit all active markers dynamically */}
                  <AutoFitBounds markers={allActiveMarkers} />

                  {/* 1. Plot Mechanics Markers */}
                  {showMechanics && validMechanics.map((mech) => {
                    const specialtyText = (mech.specialty || '').replace('_', ' ').toUpperCase();
                    return (
                      <Marker 
                        key={mech.id} 
                        position={[mech.lat, mech.lng]}
                        icon={createMechanicIcon(mech.name)}
                      >
                        <Popup>
                          <div className="p-1">
                            <strong className="text-white d-block mb-1">{mech.name || 'System Mechanic'}</strong>
                            <span className="d-block small text-white-50"><i className="fas fa-briefcase text-warning me-1.5"></i> Specialty: {specialtyText || 'GENERAL'}</span>
                            <span className="d-block small text-white-50 mt-1"><i className="fas fa-phone text-warning me-1.5"></i> {mech.phone || 'No contact phone'}</span>
                            <Link to={`/admin/mechanics/${mech.id}`} className="btn admin-btn-primary btn-xs w-100 mt-2.5 text-center text-decoration-none d-block font-outfit" style={{ fontSize: '10px', padding: '3px 0' }}>
                              Inspect Partner Profile
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* 2. Plot Customers and SOS Markers */}
                  {showCustomers && validRequests.map((req) => {
                    const isSOS = req.isSOS === true || req.priority === 'SOS' || req.priority === 'sos';
                    const icon = isSOS ? createSOSIcon(req.customerName) : createCustomerIcon(req.customerName);
                    const issueText = (req.issueType || '').replace('_', ' ').toUpperCase();
                    
                    return (
                      <React.Fragment key={req.id}>
                        <Marker 
                          position={[req.lat, req.lng]}
                          icon={icon}
                        >
                          <Popup>
                            <div className="p-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <strong className="text-white">{req.customerName || 'System Driver'}</strong>
                                {isSOS && <span className="badge bg-danger text-white ms-2 px-2 py-0.5 rounded" style={{ fontSize: '8px' }}>SOS</span>}
                              </div>
                              <span className="d-block small text-white-50"><i className="fas fa-map-pin text-warning me-1.5"></i> {req.pickupAddress || 'Active location'}</span>
                              <span className="d-block small text-white-50 mt-1"><i className="fas fa-triangle-exclamation text-warning me-1.5"></i> Request: {issueText || 'GENERAL ASSISTANCE'}</span>
                              <Link to={`/admin/customers/${req.customerId}`} className="btn admin-btn-primary btn-xs w-100 mt-2.5 text-center text-decoration-none d-block font-outfit" style={{ fontSize: '10px', padding: '3px 0' }}>
                                Inspect Driver Profile
                              </Link>
                            </div>
                          </Popup>
                        </Marker>

                        {/* 3. Draw Route Polylines to assigned mechanics */}
                        {showRoutes && req.mechLat && req.mechLng && (
                          <Polyline 
                            positions={[
                              [req.mechLat, req.mechLng],
                              [req.lat, req.lng]
                            ]}
                            color={isSOS ? '#F44336' : '#FF6B35'}
                            weight={3}
                            dashArray={isSOS ? '5, 5' : '0'}
                            opacity={0.8}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LiveMap;
