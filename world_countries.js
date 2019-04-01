/**
 * copied from the following resources:
 * http://bl.ocks.org/micahstubbs/281d7b7a7e39a9b59cf80f1b8bd41a72
 * http://bl.ocks.org/msbarry/9911363
 * http://bl.ocks.org/weiglemc/6185069
 *
 **/

const margin = {top: 0, right: 0, bottom: 0, left: 0};
const width = 960 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

//Global Arrays to hold current user selection for map and scatter plot
let scatterPlotSelection = [];
let mapSelection = [];

const color = d3.scaleThreshold()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ])
    .range(['rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)',
        'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,81,156)', 'rgb(8,48,107)', 'rgb(3,19,43)']);

const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const map = svg
    .append('g')
    .attr('class', 'map');

const scatterplot = svg
    .append('g')
    .attr('class', 'scatterplot')
    .attr("transform", "translate(100,500)");

const projection = d3.geoMercator()
    .scale(130)
    .translate( [width / 2, height / 1.5/2]);

const path = d3.geoPath().projection(projection);

queue()
    .defer(d3.json, 'world_countries.json')
    .defer(d3.tsv, 'world_population.tsv')
    .defer(d3.csv, 'who.csv')
    .await(ready);

function ready(error, data, population, who) {
    const fertilityById = {};

    population.forEach(d =>
    {
        var res = who.find(e =>
        {
            return e.Country == d.name;
        });
        if(typeof res !== 'undefined') {
            res.id = d.id;
        }
    });

    who.forEach(d => { fertilityById[d.id] = +d['Total fertility rate (per woman)']; });
    data.features.forEach(d => { d.population = fertilityById[d.id] });

    //******
    //uncomment the click handler to allow clicking of map elements
    //******
    svg.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(data.features)
        .enter().append('path')
        .attr("class", d => { return "COUNTRY-CODE-"+d.id;} )
        .attr('d', path)
        .style('fill', 'white')
        .style('stroke', 'black')
        .style('opacity', 0.8)
        .style('stroke-width', 0.3)
        .on('mouseover',function(d){})
        // .on("click", function(d) {
        //     mapSelectionFilter(d);
        // })
        .on('mouseout', function(d){});

    svg.append('path')
        .datum(topojson.mesh(data.features, (a, b) => a.id !== b.id))
        .attr('class', 'names')
        .attr('d', path);

    // setup x
    var xValue = function(d) { return d["Life expectancy at birth (years) female"];}, // data -> value
        xScale = d3.scaleLinear().range([0, height/2-100]), // value -> display
        xMap = function(d) { return xScale(xValue(d));}, // data -> display
        xAxis = d3.axisBottom().scale(xScale);

    // setup y
    var yValue = function(d) { return d["Life expectancy at birth (years) male"];}, // data -> value
        yScale = d3.scaleLinear().range([height/2-100, 0]), // value -> display
        yMap = function(d) { return yScale(yValue(d));}, // data -> display
        yAxis = d3.axisLeft().scale(yScale);

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([35, 90]);
    yScale.domain([35, 90]);

    // x-axis
    scatterplot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height/2-100) + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Calories");

    // y-axis
    scatterplot.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Protein (g)");

    // draw dots
    scatterplot.selectAll(".dot")
        .data(who)
        .enter().append("circle")
        .attr("class", d => { return "dot COUNTRY-"+d.Country; } )
        .attr("r", 3.5)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return color(fertilityById[d.id]);})
        // .style("fill", "white")
        // .style("stroke", "black")
        .on("mouseover", function(d) {})
        .on("click", function(d) {
            selectionFilter(d);
        })
        .on("mouseout", function(d) {});

    // draw legend
    var legend = scatterplot.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(-300," + i * 20 + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    // draw legend text
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d;})
};

function selectionFilter(dataPoint){
    console.log(" Country just clicked on Scatter Plot");
    for(let i = 0; i<scatterPlotSelection.length; i++){
        // console.log(scatterPlotSelection[i] + " country just clicked");
        // console.log(dataPoint+ " selectID");
        if(scatterPlotSelection[i] === dataPoint){
            scatterPlotSelection.splice(i, 1);
            let className = `.COUNTRY-CODE-${dataPoint.id}`;
            svg.select(className)
                .style("fill", "white");
            console.log(scatterPlotSelection, " current scatter selection after click");
            return
        }
    }
    scatterPlotSelection.push(dataPoint);
    console.log(scatterPlotSelection, " current scatter selection after click");

    let className = `.COUNTRY-CODE-${dataPoint.id}`;
    svg.select(className)
        .style("fill", "blue");
}
//*****
//Uncomment all of below to allow map element selection **Must also uncomment addition of click handler in map code above**
//*****
// function mapSelectionFilter(dataPoint){
//     console.log("Country just clicked on Map");
//     console.log(dataPoint.properties);
//     for(let i = 0; i<mapSelection.length; i++){
//         // console.log(scatterPlotSelection[i] + " country just clicked");
//         // console.log(dataPoint+ " selectID");
//         if(mapSelection[i] === dataPoint){
//             mapSelection.splice(i, 1);
//             let className = `.COUNTRY-${dataPoint.properties.name}`;
//             svg.select(className)
//                 .style("fill", "white");
//             console.log(mapSelection, " current map selection after click");
//             return
//         }
//     }
//     mapSelection.push(dataPoint);
//     console.log(mapSelection, " current map selection after click");
//
//     let className = `.COUNTRY-${dataPoint.properties.name}`;
//     svg.select(className)
//         .style("fill", "blue");
// }
