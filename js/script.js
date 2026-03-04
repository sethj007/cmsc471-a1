// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// global vars. 
let allData;

// create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// load csv and transform data
function init() {
    d3.csv("./data/east_coast_weather.csv", d => ({
        state: d.state,
        week: +d.week,
        snwd: +d.SNWD,
        tavg: +d.TAVG,
        snwf: +d.SNOW
    }))
    .then(data => {
        console.log(data)
        allData = data
    })
    .catch(error => console.error('Error loading data:', error))
}

init();
