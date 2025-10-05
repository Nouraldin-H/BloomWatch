let date = "2025-04-15"; // We might only just need this but keeping the other variables for now ~Nouraldin
let matrixSet = "250m";
let matrix = 3;
let row = 1;
let col = 2;

const imageURL = `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_NDVI_8Day/default/${date}/${matrixSet}/${matrix}/${row}/${col}.png`;
const display = document.querySelector('.display').innerHTML('<img src="${url}">');

// is below needed?
fetch(imageURL).then(res => {
    if (!res.ok) {
        throw new Error("Network response not ok, image could not load");
    }
    return res.blob();
}).then(blob => {
    const img = document.createAttribute('img');
    img.src = URL.createObjectURL(blob);
    display.appendChild(img);
}).catch(err => {
    console.error("Error: could not fetch image: ", err);
});