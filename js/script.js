// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// global vars.
const statesOrder = ['ME','NH','VT','MA','RI','CT','NY','NJ','PA','DE','MD','VA','WV','NC','SC','GA','FL'];
let xScale, yScale, colorScale;
let allData = [];

// create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// setting axis scales (categorical)
xScale = d3.scaleBand()
    .domain(d3.range(1, 21))
    .range([0, width])
    .padding(0.05);

yScale = d3.scaleBand()
    .domain(statesOrder)
    .range([0, height])
    .padding(0.05);

colorScale = d3.scaleSequential()
    .domain(d3.extent(allData, d => d.snwd))
    .interpolator(d3.interpolateBlues);

// drawing the axis
svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

svg.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale));

// labeling chart and axis
svg.append('text')
    .attr('x', width/2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('Snow Depth by State and Week (2017)');


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
        console.log(data); // debug
        allData = data.filter(d => d.week <= 20);

        colorScale = d3.scaleSequential()
            .domain(d3.extent(allData, d => d.snwd))
            .interpolator(d3.interpolateBlues);
        
        svg.selectAll('.cell')
            .data(allData)
            .enter()
            .append('rect')
            .attr('class', 'cell')
            .attr('x', d => xScale(d.week))
            .attr('y', d => yScale(d.state))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.snwd));
    })
    .catch(error => console.error('Error loading data:', error))
}

window.addEventListener('load', init);
