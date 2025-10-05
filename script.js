document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map-container').setView([0, 0], 2);

    // Fallback base layer (OpenStreetMap)
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add MODIS NDVI layer from GIBS (overlay)
    const gibsUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_NDVI/default/{time}/{z}/{x}/{y}.png';
    const ndviLayer = L.tileLayer(gibsUrl, {
        attribution: '© NASA GIBS, MODIS Terra',
        tileSize: 256,
        maxZoom: 8,
        minZoom: 1,
        time: '2025-04-15',
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

    // Log tile errors for debugging
    ndviLayer.on('tileerror', (error, tile) => {
        console.error('Tile error:', error, 'for tile:', tile.src);
        // Optional: Notify user if appropriate
        // alert('NDVI data not available. Check console.');
    });

    // Marker layer group to manage pins
    const markerGroup = L.layerGroup().addTo(map);

    // Update timeline display with NDVI sync
    const slider = document.getElementById('date-slider');
    const yearDisplay = document.getElementById('selected-year');
    slider.addEventListener('input', () => {
        yearDisplay.textContent = slider.value;
        const newDate = `${slider.value}-05-01`;
        if (ndviLayer.setParams) {
            ndviLayer.setParams({ time: newDate });
        }
        console.log('Updated NDVI date to:', newDate);
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
                if (data.length >= 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 5);
                    fetchBloomData(lat, lon, slider.value);
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
        const year = slider.value;
        fetchBloomData(e.latlng.lat, e.latlng.lng, year);
    });

    // Fetch bloom data (real NASA API integration)
    function fetchBloomData(lat, lon, year) {
        const infoPanel = document.getElementById('bloom-info');
        // Clear previous content
        infoPanel.innerHTML = '';

        // Set initial content
        infoPanel.innerHTML = `Analyzing blooms at (${lat.toFixed(2)}, ${lon.toFixed(2)}) for ${year} ...<br>`;

        // Clear old markers
        markerGroup.clearLayers();

        // Add new marker
        const marker = L.marker([lat, lon]).addTo(markerGroup)
            .bindPopup(`Location: (${lat.toFixed(2)}, ${lon.toFixed(2)})<br>Year: ${year}`)
            .openPopup();

        // NASA API key
        const apiKey = 'ZktDK0NIj2638lKwYDes68EbPyHZUbr4AL1Lkn7Q';
        const date = `${year}-05-01`;
        const apiUrl = `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${date}&dim=0.1&api_key=${apiKey}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.url) {
                    // Display imagery
                    infoPanel.innerHTML += `<p><img src="${data.url}" alt="NASA Satellite Image" style="max-width:100%; height:auto;"></p>`;
                    // Since real NDVI is not parsed here, don't simulate a bloom detection.
                    infoPanel.innerHTML += `<p>Satellite imagery provided. Data is not available for this spot and date.</p>`;
                } else {
                    infoPanel.innerHTML += `<p>No imagery available for this location/date.</p>`;
                }
            })
            .catch(error => {
                console.error('NASA API error:', error);
                infoPanel.innerHTML += `<p>bloom data not available for this location/year.</p>`;
            });
    }
});
