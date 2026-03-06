// set up dimens. and margins
const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const height = 600 - margin.top - margin.bottom;
const heatmapWidth = 750 - margin.left - margin.right;
const scatterWidth = 750 - margin.left - margin.right;

// global vars.
const statesOrder = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL'];
const t = 400; // ms delay for transitions
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

// titles
svg.append('text')
    .attr('x', heatmapWidth / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-title')
    .text('East Coast Snow Depth by State and Week (2017)');

svg2.append('text')
    .attr('x', scatterWidth / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-title')
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
                .on('mouseover', function (event, d) {
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
                .on('mouseout', function () {
                    tooltip.style('display', 'none');
                });
            // drawing the brush
            svg.append('g')
                .attr('class', 'brush')
                .call(brush);

            svg.on('dblclick', function () {
                const selectedState = d3.select('#stateFilter').property('value');
                svg.select('.brush').call(brush.move, null);
    
                if (selectedState === 'all') {
                    svg.selectAll('.cell').style('stroke', 'none').style('stroke-width', '0');
                } else {
                    svg.selectAll('.cell')
                    .style('stroke', 'none')
                        .style('stroke-width', '0')
                        .style('opacity', d => d.state === selectedState ? 1 : 0.05);
                    svg.selectAll('.cell')
                        .filter(d => d.state === selectedState)
                        .style('stroke', '#f0a500')
                        .style('stroke-width', '0.75px');
                }
            });

            // please let me see tooltips again...
            svg.select('.brush .overlay')
                .on('mousemove', function (event) {
                    const [mx, my] = d3.pointer(event);
                    const week = xScale.domain().find(w => {
                        const x = xScale(w);
                        return mx >= x && mx <= x + xScale.bandwidth();
                    });
                    const state = yScale.domain().find(s => {
                        const y = yScale(s);
                        return my >= y && my <= y + yScale.bandwidth();
                    });
                    if (week && state) {
                        const d = allData.find(r => r.week === week && r.state === state);
                        if (d) {
                            tooltip.style('display', 'block')
                                .html(`
                            <strong>${d.state}</strong> — Week ${d.week}<br/>
                            Snow Depth: ${d.snwd.toFixed(2)} in<br/>
                            Avg. Temp: ${d.tavg.toFixed(1)} °F<br/>
                            Snowfall: ${d.snwf.toFixed(2)} in
                        `)
                                .style('left', (event.pageX + 10) + 'px')
                                .style('top', (event.pageY - 28) + 'px');
                        }
                    }
                })
                .on('mouseleave', function () {
                    tooltip.style('display', 'none');
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
            d3.select('#stateFilter').on('change', function () {
                const selected = d3.select(this).property('value');

                if (selected === 'all') {
                    svg.selectAll('.cell')
                        .style('opacity', 1)
                        .style('stroke', 'none')
                        .style('stroke-width', '0');
                    svg2.selectAll('.dot')
                        .transition()
                        .duration(t)
                        .ease(d3.easeCubicOut)
                        .attr('r', 8);
                } else {
                    svg.selectAll('.cell')
                        .style('stroke', 'none')
                        .style('stroke-width', '0')
                        .style('opacity', d => d.state === selected ? 1 : 0.05);
                    svg.selectAll('.cell')
                        .filter(d => d.state === selected)
                        .style('stroke', '#f0a500')
                        .style('stroke-width', '0.75px');
                    svg2.selectAll('.dot')
                        .transition()
                        .duration(t)
                        .ease(d3.easeCubicOut)
                        .attr('r', d => d.state === selected ? 24 : 8);
                }
            });
        })
        .catch(error => console.error('Error loading data:', error))
}

// more brushing
function brushed(event) {
    const selection = event.selection; // gives [x0, x1] in px
    const selectedState = d3.select('#stateFilter').property('value');

    if (!selection) {
        const selectedState = d3.select('#stateFilter').property('value');
        if (selectedState === 'all') {
            svg.selectAll('.cell').style('opacity', 1).style('stroke', 'none').style('stroke-width', '0');
        } else {
            svg.selectAll('.cell')
                .style('stroke', 'none').style('stroke-width', '0')
                .style('opacity', d => d.state === selectedState ? 1 : 0.05);
            svg.selectAll('.cell')
                .filter(d => d.state === selectedState)
                .style('stroke', '#f0a500').style('stroke-width', '0.75px');
        }
        updateScatter(1, 20);
        return;
    }

    // convert pixels back to week numbers
    const [x0, x1] = selection;
    const weeks = xScale.domain().filter(week => {
        const pos = xScale(week);
        return pos >= x0 && pos <= x1;
    });

    // updating the scatterpot when brushed
    updateScatter(d3.min(weeks), d3.max(weeks));

    svg.selectAll('.cell')
        .style('stroke', d => {
            if (d.state === selectedState && selectedState !== 'all') return '#f0a500';
            if (weeks.includes(d.week)) return '#1a1a2e';
            return 'none';
        })
        .style('stroke-width', d => {
            if (d.state === selectedState && selectedState !== 'all') return '0.75px';
            if (weeks.includes(d.week)) return '0.5px';
            return '0';
        })
        .style('opacity', d => {
            if (selectedState === 'all') return 1;
            return d.state === selectedState ? 1 : 0.05;
        });

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
    const tempColorScale = d3.scaleSequential()
        .domain(d3.extent(scatterData, d => d.tavg).reverse())
        .interpolator(d3.interpolateRdYlBu); // warm to cold (red to blue)

    // freezing point line for visualization aid
    svg2.selectAll('.freeze-line').remove();
    svg2.append('line')
        .attr('class', 'freeze-line')
        .attr('x1', xScatter(32))
        .attr('x2', xScatter(32))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', '#5b9bd5')
        .style('stroke-width', '1.5px')
        .style('stroke-dasharray', '6,4')
        .style('opacity', 0.7);

    svg2.selectAll('.freeze-label').remove();
    svg2.append('text')
        .attr('class', 'freeze-label')
        .attr('x', xScatter(32) + 5)
        .attr('y', 14)
        .style('font-size', '10px')
        .style('fill', '#5b9bd5')
        .text('32°F — freezing');
    
    svg2.selectAll('.dot')
        .data(scatterData, d => d.state) // binds data to existing dots by state name
        .join('circle') // enter, update, exit for new dots
        .attr('class', 'dot')
        .on('mouseover', function(event, d) {
            tooltip.style('display', 'block')
            .html(`
                <strong>${d.state}</strong><br/>
                Avg. Temp: ${d.tavg.toFixed(1)} °F<br/>
                Snow Depth: ${d.snwd.toFixed(2)} in
            `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            tooltip.style('display', 'none');
        })
        .transition()
        .duration(t)
        .ease(d3.easeCubicOut)
        .attr('cx', d => xScatter(d.tavg))
        .attr('cy', d => yScatter(d.snwd))
        .attr('r', d => d.state === selected ? 24 : 8)
        .attr('fill', d => tempColorScale(d.tavg))
        .attr('opacity', 0.75)

    svg2.selectAll('.dot-label')
        .data(scatterData, d => d.state)
        .join('text')
        .attr('class', 'dot-label')
        .transition()
        .duration(t)
        .ease(d3.easeCubicOut)
        .attr('x', d => xScatter(d.tavg) + 8)
        .attr('y', d => yScatter(d.snwd) + 4)
        .text(d => d.state)
        .style('font-size', '11px')
        .style('fill', '#333');
}

window.addEventListener('load', init);
