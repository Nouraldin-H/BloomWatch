// Global variables to make date and GIBS matrix parameters flexible
let date = "2025-04-15"; // Default
let matrixSet = "250m";
let matrix = 3;
let row = 1;
let col = 2;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map-container').setView([0, 0], 2);

    // Fallback base layer (OpenStreetMap)
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add MODIS NDVI layer from GIBS (overlay)
    // Use regular curly braces in URL, not `` and ${}, for Leaflet
    const gibsUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_NDVI/default/{time}/{z}/{x}/{y}.png';
    const ndviLayer = L.tileLayer(gibsUrl, {
        attribution: '© NASA GIBS, MODIS Terra',
        tileSize: 256,
        maxZoom: 8,
        minZoom: 1,
        time: date, // Use global variable here
        opacity: 0.8,
        errorTileUrl: '',
        noWrap: true
    });

    // Add layer control
    const baseLayers = {
        'OpenStreetMap': baseLayer
    };
    const overlayLayers = {
        'NDVI Overlay': ndviLayer
    };
    L.control.layers(baseLayers, overlayLayers).addTo(map);
    ndviLayer.addTo(map); // Add NDVI by default

    // Log tile errors for debugging (fix for undefined tile)
    ndviLayer.on('tileerror', (error, tile) => {
        console.error('Tile error:', error, 'for tile:', tile && tile.src ? tile.src : 'unknown');
    });

    // Marker layer group to manage pins
    const markerGroup = L.layerGroup().addTo(map);

    // Update timeline display with NDVI sync (for days, use <input type="date"> in HTML!)
    const slider = document.getElementById('date-slider');
    const dateDisplay = document.getElementById('selected-date');
    slider.addEventListener('input', () => {
        dateDisplay.textContent = slider.value;
        date = slider.value; // Update global date variable
        if (ndviLayer.setParams) {
            ndviLayer.setParams({ time: date });
        }
        console.log('Updated NDVI date to:', date);
    });

    // Search button with geocoding
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', () => {
        const location = document.getElementById('location-search').value;
        console.log('Searching for:', location);
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
            headers: { 'User-Agent': 'BloomWatch/1.0' }
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Geocoding results:', data);
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 5);
                    fetchBloomData(lat, lon, date);
                } else {
                    alert('Location not found. Try "Brazil country" or "Rio de Janeiro".');
                }
            })
            .catch(error => {
                console.error('Geocoding error:', error);
                if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                    alert('Network error. Check your connection or try again.');
                }
            });
    });

    // Info panel update on map click
    map.on('click', (e) => {
        fetchBloomData(e.latlng.lat, e.latlng.lng, date);
    });

    // Fetch bloom data (real NASA API integration)
    function fetchBloomData(lat, lon, date) {
        const infoPanel = document.getElementById('bloom-info');
        // Clear previous content
        infoPanel.innerHTML = '';
        // Set initial content
        infoPanel.innerHTML = `Analyzing blooms at (${lat.toFixed(2)}, ${lon.toFixed(2)}) for ${date} ...<br>`;
        // Clear old markers
        markerGroup.clearLayers();
        // Add new marker
        const marker = L.marker([lat, lon]).addTo(markerGroup)
            .bindPopup(`Location: (${lat.toFixed(2)}, ${lon.toFixed(2)})<br>Date: ${date}`)
            .openPopup();

        // NASA API key
        const apiKey = 'uIiHd7Fm0KeAVeMbVh5MUCQuNJk4Hs9wETszzwXO';
        const apiUrl = `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${date}&dim=0.1&api_key=${apiKey}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.url) {
                    infoPanel.innerHTML += `<p><img src="${data.url}" alt="NASA Satellite Image" style="max-width:100%; height:auto;"></p>`;
                    infoPanel.innerHTML += `<p>Satellite imagery provided. Data is not available for this spot and date.</p>`;
                } else {
                    infoPanel.innerHTML += `<p>bloom data not available for this location/date.</p>`;
                }
            })
            .catch(error => {
                console.error('NASA API error:', error);
                if (!infoPanel.innerHTML.includes('bloom data not available')) {
                    infoPanel.innerHTML += `<p>bloom data not available for this location/date.</p>`;
                }
            });
    }
});

