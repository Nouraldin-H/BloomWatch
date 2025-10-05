document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map-container').setView([0, 0], 2);

    // Fallback base layer (OpenStreetMap)
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    let time = "2024-05-01";
    let z = 3;
    let y = 1;
    let x = 2;
 

    // Add MODIS NDVI layer from GIBS (overlay)
    const gibsUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_NDVI/default/${time}/${z}/${x}/${y}.png`;
    const ndviLayer = L.tileLayer(gibsUrl, {
        attribution: '© NASA GIBS, MODIS Terra',
        tileSize: 256,
        maxZoom: 8,
        minZoom: 1,
        time: '2024-05-01',
        opacity: 0.7,
        errorTileUrl: '',
        noWrap: true
    }).addTo(map);

    // Marker layer group to manage pins
    const markerGroup = L.layerGroup().addTo(map);

    // Update timeline display
    const slider = document.getElementById('date-slider');
    const yearDisplay = document.getElementById('selected-year');
    slider.addEventListener('input', () => {
        yearDisplay.textContent = slider.value;
        const newDate = `${slider.value}-05-01`;
        ndviLayer.setParams({ time: newDate });
        console.log('Updated date to:', newDate);
    });

    // Search button with geocoding
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', () => {
        const location = document.getElementById('location-search').value;
        console.log('Searching for:', location);
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
            headers: { 'User-Agent': 'BloomWatch/1.0[](https://github.com/your-repo)' }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Geocoding results:', data);
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 5); // Zoom to location
                    fetchBloomData(lat, lon, slider.value); // Update info panel
                } else {
                    alert('Location not found. Try "Brazil country" or "Rio de Janeiro".');
                }
            })
            .catch(error => {
                console.error('Geocoding error:', error); // Log error, no alert
                // Only alert if it's a critical failure (e.g., network down)
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

    // Fetch bloom data (mock NDVI)
    function fetchBloomData(lat, lon, year) {
        const infoPanel = document.getElementById('bloom-info');
        infoPanel.innerHTML = `Analyzing blooms at (${lat.toFixed(2)}, ${lon.toFixed(2)}) for ${year}...`;
        
        // Clear old markers
        markerGroup.clearLayers();
        
        // Add new marker
        const marker = L.marker([lat, lon]).addTo(markerGroup)
            .bindPopup(`Location: (${lat.toFixed(2)}, ${lon.toFixed(2)})<br>Year: ${year}`)
            .openPopup();
        
        // Mock NDVI
        const ndvi = Math.random() * 0.8 + 0.2;
        if (ndvi > 0.4) {
            infoPanel.innerHTML += `<p><strong>Bloom detected!</strong> NDVI: ${ndvi.toFixed(2)} (High vegetation activity).</p>`;
        } else {
            infoPanel.innerHTML += `<p>No significant bloom. NDVI: ${ndvi.toFixed(2)}.</p>`;
        }
    }
});
