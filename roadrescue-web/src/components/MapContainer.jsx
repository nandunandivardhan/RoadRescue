import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Set up custom icons to prevent default Leaflet asset bundler issues in Vite
const customerIcon = L.divIcon({
  className: 'custom-customer-icon',
  html: `<div style="background-color: #FF6B35; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #FFF; box-shadow: 0 0 10px rgba(255, 107, 53, 0.8);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const mechanicIcon = L.divIcon({
  className: 'custom-mechanic-icon',
  html: `<div style="background-color: #1B2CC1; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #FFF; box-shadow: 0 0 12px rgba(27, 44, 193, 0.8);"><i class="fas fa-tools" style="color: white; font-size: 8px; position: absolute; top: 2px; left: 2px;"></i></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const defaultIcon = L.divIcon({
  className: 'custom-default-icon',
  html: `<div style="background-color: #6C757D; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Component to dynamically fly/pan map to center when coordinates change
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const RoadRescueMap = ({ 
  center = [20.5937, 78.9629], // Default: India
  zoom = 13,
  customerLocation = null,
  mechanicLocation = null,
  nearbyMechanics = [],
  customerAddress = "Your Pickup Location",
  mechanicName = "Mechanic en Route"
}) => {
  const custLat = customerLocation
    ? (parseFloat(customerLocation.latitude) || parseFloat(customerLocation.lat))
    : null;
  const custLng = customerLocation
    ? (parseFloat(customerLocation.longitude) || parseFloat(customerLocation.lng))
    : null;

  const mechLat = mechanicLocation
    ? (parseFloat(mechanicLocation.latitude) || parseFloat(mechanicLocation.lat))
    : null;
  const mechLng = mechanicLocation
    ? (parseFloat(mechanicLocation.longitude) || parseFloat(mechanicLocation.lng))
    : null;

  const mapCenter = (custLat && custLng)
    ? [custLat, custLng]
    : (center && center[0] && center[1] ? [parseFloat(center[0]), parseFloat(center[1])] : [28.4595, 77.0266]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '350px' }}>
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', minHeight: '350px', borderRadius: '16px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer Location Marker */}
        {custLat && custLng && (
          <Marker 
            position={[custLat, custLng]} 
            icon={customerIcon}
          >
            <Popup>
              <div style={{ color: '#FFF' }}>
                <strong style={{ color: '#FF6B35' }}>Your Location</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>{customerAddress}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Assigned Mechanic Marker */}
        {mechLat && mechLng && (
          <Marker 
            position={[mechLat, mechLng]} 
            icon={mechanicIcon}
          >
            <Popup>
              <div>
                <strong style={{ color: '#1B2CC1' }}>{mechanicName}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>En route to your location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Draw Route Polyline */}
        {custLat && custLng && mechLat && mechLng && (
          <Polyline 
            positions={[
              [mechLat, mechLng],
              [custLat, custLng]
            ]}
            color="#FF6B35"
            weight={4}
            opacity={0.85}
          />
        )}

        {/* Nearby Mechanics Markers */}
        {nearbyMechanics.map((mech, index) => {
          const mLat = parseFloat(mech.latitude) || parseFloat(mech.lat);
          const mLng = parseFloat(mech.longitude) || parseFloat(mech.lng);
          if (!mLat || !mLng) return null;
          return (
            <Marker 
              key={mech.id || index} 
              position={[mLat, mLng]} 
              icon={mechanicIcon}
            >
              <Popup>
                <div>
                  <strong style={{ color: '#FF6B35' }}>{mech.user?.name || mech.name || 'Available Mechanic'}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
                    Specialty: {mech.specialty || 'General fix'}<br/>
                    Experience: {mech.experienceYears || 0} years<br/>
                    Rating: ⭐ {mech.rating || '5.0'}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Dynamic Map Controller */}
        <MapRecenter center={mapCenter} />
      </MapContainer>
    </div>
  );
};

export default RoadRescueMap;
