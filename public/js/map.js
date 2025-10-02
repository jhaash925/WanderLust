document.addEventListener('DOMContentLoaded', function() {
  console.log('maplibregl:', typeof maplibregl);

  // Replace with your MapTiler API key
  const apiKey = mapToken;

  console.log('mapToken:', mapToken);
  console.log('listing:', listing);
  console.log('listing.geometry:', listing.geometry);

  // Default to Delhi if geometry is missing
  let coordinates = listing.geometry?.coordinates || [77.2090, 28.6139];

  console.log('coordinates:', coordinates);

  // Validate coordinates range
  const isValidLng = coordinates[0] >= -180 && coordinates[0] <= 180;
  const isValidLat = coordinates[1] >= -90 && coordinates[1] <= 90;

  if (!isValidLng || !isValidLat) {
    console.error('Invalid coordinates range:', coordinates);
    // Fallback to Delhi coordinates
    coordinates = [77.2090, 28.6139];
    console.log('Fallback coordinates:', coordinates);
  }

const style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapToken}`;


  if (!apiKey) {
    console.warn('MAP_TOKEN is not set. Using free demo style. For better maps, set MAP_TOKEN.');
  }

  const container = document.getElementById('map');
  console.log('Map container:', container);

  if (!container) {
    console.error('Map container not found');
    return;
  }

  try {
    const map = new maplibregl.Map({
      container: 'map',
      style: style,
      center: coordinates, // [lng, lat]
      zoom: 9
    });

    console.log('Map object created:', map);

    map.on('load', () => {
      console.log('Map style loaded successfully');
    });

    map.on('error', (e) => {
      console.error('Map error:', e);
    });

    // Add zoom controls
    map.addControl(new maplibregl.NavigationControl());

    // Add marker if geometry exists
    if (listing.geometry) {
      new maplibregl.Marker( {color : "red"} )
        .setLngLat(coordinates)
        .setPopup(new maplibregl.Popup().setHTML(`<b>${listing.title}</b> <br> <p> Exact location will be provided after booking.</p>`))
        .addTo(map);
    }

    console.log('Map initialized successfully');
  } catch (error) {
    console.error('Error initializing map:', error);
  }
});
