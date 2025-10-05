document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map-container').setView([0, 0], 2);

    // Add MODIS NDVI layer from GIBS
    const gibsUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_NDVI/default/{time}/{z}/{x}/{y}.png';
    const ndviLayer = L.tileLayer(gibsUrl, {
        attribution: '© NASA GIBS, MODIS Terra',
        tileSize: 256,
        maxZoom: 8,
        minZoom: 1,
        time: '2024-05-01' // Use a past date with available data
    }).addTo(map);

    // Update timeline display
    const slider = document.getElementById('date-slider');
    const yearDisplay = document.getElementById('selected-year');
    slider.addEventListener('input', () => {
        yearDisplay.textContent = slider.value;
        const newDate = `${slider.value}-05-01`;
        map.eachLayer(layer => {
            if (layer.options.time) {
                layer.options.time = newDate;
                layer.redraw(); // Refresh the layer with new time
            }
        });
    });

    // Search button with geocoding
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', () => {
        const location = document.getElementById('location-search').value;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
            headers: { 'User-Agent': 'BloomWatch/1.0[](https://yourdomain.com)' } // Add user agent
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 10);
                    fetchBloomData(lat, lon, slider.value);
                } else {
                    alert('Location not found. Try a more specific name (e.g., "Rio de Janeiro").');
                }
            })
            .catch(error => {
                console.error('Geocoding error:', error);
                alert('Error searching location. Check console for details.');
            });
    });

    // Info panel update on map click
    map.on('click', (e) => {
        const year = slider.value;
        fetchBloomData(e.latlng.lat, e.latlng.lng, year);
    });

    // Fetch bloom data (mock NDVI for now)
    function fetchBloomData(lat, lon, year) {
        const infoPanel = document.getElementById('bloom-info');
        infoPanel.innerHTML = `Analyzing blooms at (${lat.toFixed(2)}, ${lon.toFixed(2)}) for ${year}...`;
        // Add marker
        L.marker([lat, lon]).addTo(map)
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