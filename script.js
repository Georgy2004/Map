// Initialize the map
const map = L.map('map').setView([0, 0], 2);

// Add map tiles layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Variables to store markers and tracking state
let locationMarker, accuracyCircle;
let isTracking = false;
let watchId = null;
const trackBtn = document.getElementById('track-btn');
const locateBtn = document.getElementById('locate-btn');

// Handle successful location detection
function onLocationFound(e) {
  const radius = e.accuracy / 2;
  
  // Remove previous markers if they exist
  if (locationMarker) {
    map.removeLayer(locationMarker);
    map.removeLayer(accuracyCircle);
  }
  
  // Add new marker and accuracy circle
  locationMarker = L.marker(e.latlng).addTo(map)
    .bindPopup(`You are here (accuracy: ${Math.round(radius)}m)`).openPopup();
  
  accuracyCircle = L.circle(e.latlng, radius, {
    color: 'blue',
    fillOpacity: 0.2
  }).addTo(map);
  
  // Center map on location
  map.setView(e.latlng, Math.max(16, map.getZoom()));
}

// Handle location detection errors
function onLocationError(e) {
  console.error('Location error:', e);
  alert(`Location error: ${e.message}`);
  
  // Fallback to IP-based location
  fetch('https://ipapi.co/json')
    .then(res => res.json())
    .then(data => {
      onLocationFound({
        latlng: L.latLng(data.latitude, data.longitude),
        accuracy: 50000  // Large accuracy radius for IP-based
      });
    })
    .catch(err => {
      console.error('IP location fallback failed:', err);
      alert('Could not determine your location.');
    });
}

// Set up event listeners for the map
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// Find user location once
function locateUser() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported - using IP fallback");
    onLocationError({message: "Browser doesn't support geolocation"});
    return;
  }
  
  // Show loading state
  locateBtn.textContent = "Locating...";
  locateBtn.disabled = true;
  
  map.locate({
    setView: true,
    maxZoom: 16,
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
  
  // Reset button after a short delay
  setTimeout(() => {
    locateBtn.textContent = "Show My Location";
    locateBtn.disabled = false;
  }, 2000);
}

// Toggle continuous location tracking
function toggleTracking() {
  if (isTracking) {
    // Stop tracking
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    isTracking = false;
    trackBtn.textContent = "Start Tracking";
    trackBtn.style.background = "#0078d4";
  } else {
    // Start tracking
    if (!navigator.geolocation) {
      alert("Geolocation not supported on your device.");
      return;
    }
    
    isTracking = true;
    trackBtn.textContent = "Stop Tracking";
    trackBtn.style.background = "#d44500";
    
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        onLocationFound({
          latlng: L.latLng(position.coords.latitude, position.coords.longitude),
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        onLocationError(error);
        toggleTracking(); // Stop tracking on error
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }
}

// Set up button click handlers
document.getElementById('locate-btn').addEventListener('click', locateUser);
document.getElementById('track-btn').addEventListener('click', toggleTracking);

// Initial location check on page load (optional - comment out if not desired)
// window.addEventListener('load', locateUser);