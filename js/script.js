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

// tooltips
const tooltip = d3.select('#tooltip');

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
        
        const snwdValues = allData.map(d => d.snwd).sort(d3.ascending);
        const p95 = snwdValues[Math.floor(snwdValues.length * 0.95)];

        colorScale = d3.scaleSequential()
            .domain([0, p95])
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
            .attr('fill', d => colorScale(d.snwd))
            // tooltips -- mouse hovering & the works
            .on('mouseover', function(event, d) {
                tooltip.style('display', 'block')
                    .html(`
                        <strong>${d.state}</strong> — Week ${d.week}<br/>
                        Snow Depth: ${d.snwd.toFixed(2)} in<br/>
                        Avg. Temp: ${d.tavg.toFixed(1)} °F<br/>
                        Snowfall: ${d.snwf.toFixed(2)} in
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.style('display', 'none');
            });
    })
    .catch(error => console.error('Error loading data:', error))
}

window.addEventListener('load', init);
