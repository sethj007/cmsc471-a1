// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// global vars.
const statesOrder = ['ME','NH','VT','MA','RI','CT','NY','NJ','PA','DE','MD','VA','WV','NC','SC','GA','FL'];
let xScale, yScale, colorScale;
let allData = [];

// create SVG
const svg = d3.select('#heatmap')
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
    .text('East Coast Snow Depth by State and Week (2017)');

// brushing 
const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on('brush end', brushed);

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
        // drawing the brush
        svg.append('g')
            .attr('class', 'brush')
            .call(brush);

        svg.on('dblclick', function() {
            svg.select('.brush').call(brush.move, null);
            svg.selectAll('.cell').style('stroke', 'none').style('stroke-width', '0');
        });
    })
    .catch(error => console.error('Error loading data:', error))
}

// more brushing
function brushed(event) {
    const selection = event.selection; // gives [x0, x1] in px

    if (!selection) {
        svg.selectAll('.cell').style('opacity', 1);
        return;
    }
    
    const [x0, x1] = selection;
    
    // convert pixels back to week numbers
    const weeks = xScale.domain().filter(week => {
        const pos = xScale(week);
        return pos >= x0 && pos <= x1;
    });

    svg.selectAll('.cell')
        .style('stroke', d => weeks.includes(d.week) ? 'black' : 'none')
        .style('stroke-width', d => weeks.includes(d.week) ? '0.5px' : '0');
    
    console.log(weeks); // debug
}

window.addEventListener('load', init);
