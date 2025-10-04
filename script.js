document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map-container').setView([0, 0], 2); // Center on world, zoom level 2
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Update timeline display
    const slider = document.getElementById('date-slider');
    const yearDisplay = document.getElementById('selected-year');
    slider.addEventListener('input', () => {
        yearDisplay.textContent = slider.value;
        // Later: Use this to filter data by year
    });

    // Search button (placeholder for now)
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', () => {
        const location = document.getElementById('location-search').value;
        alert(`Searching for blooms in: ${location}`); // Replace with real search later
    });

    // Info panel update (example on map click)
    map.on('click', (e) => {
        const infoPanel = document.getElementById('bloom-info');
        infoPanel.textContent = `Clicked at latitude: ${e.latlng.lat}, longitude: ${e.latlng.lng}. Loading bloom data...`;
        // Later: Fetch NASA data for this location
    });
    // Fetch NASA imagery (replace DEMO_KEY with your key)
function fetchBloomData(lat, lon, year) {
    const apiKey = 'ZktDK0NIj2638lKwYDes68EbPyHZUbr4AL1Lkn7Q';
    const date = `${year}-05-01`; // Example spring date for blooms
    fetch(`https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=${date}&dim=0.1&api_key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            const infoPanel = document.getElementById('bloom-info');
            if (data.url) {
                infoPanel.innerHTML = `<p>Bloom imagery for ${year}:</p><img src="${data.url}" alt="NASA Bloom Image" style="max-width:100%;">`;
                // Add to map: L.imageOverlay(data.url, [[lat-0.05, lon-0.05], [lat+0.05, lon+0.05]]).addTo(map);
            } else {
                infoPanel.textContent = 'No data found. Try another location/date.';
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Call it on map click
map.on('click', (e) => {
    const year = slider.value;
    fetchBloomData(e.latlng.lat, e.latlng.lng, year);
});
});