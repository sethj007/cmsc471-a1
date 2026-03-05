// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const height = 600 - margin.top - margin.bottom;
const heatmapWidth = 750 - margin.left - margin.right;
const scatterWidth = 750 - margin.left - margin.right;

// global vars.
const statesOrder = ['ME','NH','VT','MA','RI','CT','NY','NJ','PA','DE','MD','VA','WV','NC','SC','GA','FL'];
let xScale, yScale, xScatter, yScatter, colorScale;
let allData = [];

// create heatmap SVG
const svg = d3.select('#heatmap')
    .append('svg')
    .attr('width', heatmapWidth + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// create scatterplot SVG
const svg2 = d3.select('#scplot')
    .append('svg')
    .attr('width', scatterWidth + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// setting axis scales
xScale = d3.scaleBand()
    .domain(d3.range(1, 21))
    .range([0, heatmapWidth])
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
    .attr('x', heatmapWidth/2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('East Coast Snow Depth by State and Week (2017)');

svg2.append('text')
    .attr('x', scatterWidth/2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('Avg. Temperature vs. Snow Depth - By State');

// heatmap
svg.append('text')
    .attr('x', heatmapWidth / 2)
    .attr('y', height + margin.bottom - 10)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('Week');

svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 20)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('State');

// scatterplot
svg2.append('text')
    .attr('x', scatterWidth / 2)
    .attr('y', height + margin.bottom - 10)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('Avg. Temperature (°F)');

svg2.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 20)
    .attr('text-anchor', 'middle')
    .attr('class', 'axis-label')
    .text('Snow Depth (in)');

// brushing 
const brush = d3.brushX()
    .extent([[0, 0], [heatmapWidth, height]])
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
        
        // setting scales that need data
        colorScale = d3.scaleSequential()
            .domain([0, p95])
            .interpolator(d3.interpolateBlues);

        xScatter = d3.scaleLinear()
            .domain(d3.extent(allData, d => d.tavg))
            .range([0, scatterWidth]);

        yScatter = d3.scaleLinear()
            .domain(d3.extent(allData, d => d.snwd))
            .range([height, 0]);

        svg2.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScatter));

        svg2.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScatter));
        
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

        const scatterData = stateAggregate(allData, 1, 5);
        console.log(scatterData); // verify it looks right -> it does
        
        // drawing scatterplot dots
        updateScatter(1, 20);

        // filled state dropdown
        d3.select('#stateFilter')
            .selectAll('option.state-option')
            .data(statesOrder)
            .enter()
            .append('option')
            .attr('class', 'state-option')
            .attr('value', d => d)
            .text(d => d);

        // event listener for when state is chosen from the dropdown
        d3.select('#stateFilter').on('change', function() {
            const selected = d3.select(this).property('value');
    
            if (selected === 'all') {
                svg.selectAll('.cell').style('opacity', 1);
                svg2.selectAll('.dot').attr('r', 6)
            } else {
                svg.selectAll('.cell')
                    .style('opacity', d => d.state === selected ? 1 : 0.15);
                svg2.selectAll('.dot')
                    .attr('r', d => d.state === selected ? 12 : 6);
            }
        });

    })
    .catch(error => console.error('Error loading data:', error))
}

// more brushing
function brushed(event) {
    const selection = event.selection; // gives [x0, x1] in px

    if (!selection) {
        svg.selectAll('.cell').style('opacity', 1);
        updateScatter(1, 20);
        return;
    }
    
    const [x0, x1] = selection;
    
    // convert pixels back to week numbers
    const weeks = xScale.domain().filter(week => {
        const pos = xScale(week);
        return pos >= x0 && pos <= x1;
    });

    // updating the scatterpot when brushed
    updateScatter(d3.min(weeks), d3.max(weeks));

    svg.selectAll('.cell')
        .style('stroke', d => weeks.includes(d.week) ? 'black' : 'none')
        .style('stroke-width', d => weeks.includes(d.week) ? '0.5px' : '0');
    
    console.log(weeks); // debug
}

// scatterplot data aggregation
// ex. arr structure thats returned: [{state: 'ME', tavg: 25.3, snwd: 12.1 ... }]
function stateAggregate(data, weekMin, weekMax) {
    const filtered = data.filter(d => d.week >= weekMin && d.week <= weekMax);
    const rolled = d3.rollup(filtered, v => ({
        tavg: d3.mean(v, d => d.tavg),
        snwd: d3.mean(v, d => d.snwd)
        }),
        d => d.state
    );

    return Array.from(rolled, ([state, values]) => ({ state, ...values }));
}

// updating scatterplot when brush selection changes
function updateScatter(weekMin, weekMax) {
    const scatterData = stateAggregate(allData, weekMin, weekMax);
    const selected = d3.select('#stateFilter').property('value');
    
    svg2.selectAll('.dot')
        .data(scatterData, d => d.state) // binds data to existing dots by state name
        .join('circle') // enter, update, exit for new dots
        .attr('class', 'dot')
        .attr('cx', d => xScatter(d.tavg))
        .attr('cy', d => yScatter(d.snwd))
        .attr('r', d => d.state === selected ? 12 : 6)
        .attr('fill', 'steelblue')
        .attr('opacity', 0.75);

    svg2.selectAll('.dot-label')
        .data(scatterData, d => d.state)
        .join('text')
        .attr('class', 'dot-label')
        .attr('x', d => xScatter(d.tavg) + 8)
        .attr('y', d => yScatter(d.snwd) + 4)
        .text(d => d.state)
        .style('font-size', '11px')
        .style('fill', '#333');
}

window.addEventListener('load', init);
