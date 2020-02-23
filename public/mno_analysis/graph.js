// Set the dimensions and margins of the graph
const margin = { top: 20, right: 20, bottom: 30, left: 50 },
    graphWidth = 960 - margin.left - margin.right,
    graphHeight = 500 - margin.top - margin.bottom,
    // svg
    svg = d3
        .select("body")
        .append("svg")
        .attr("width", graphWidth + margin.left + margin.right)
        .attr("height", graphHeight + margin.top + margin.bottom),
    // graph
    graph = svg
        .append("g")
        .attr("width", graphWidth)
        .attr("Height", graphHeight)
        .attr("transform", `translate(${margin.left}, ${margin.top})`),
    // Scales
    x = d3.scaleTime().range([0, graphWidth]),
    y = d3.scaleLinear().range([graphHeight, 0]),
    // Axes groups
    xAxisGroup = graph
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + graphHeight + ")"),
    yAxisGroup = graph.append("g").attr("class", "y-axis"),
    line = d3
        .line()
        .x(function(d) {
            return x(new Date(d.NextMessageTimeTimestamp));
        })
        .y(function(d) {
            return y(d.DownTimeDurationSeconds);
        }),
    // d3 line path generator
    path = graph.append("path");

Promise.all([d3.json("down.json"), d3.json("msgs.json")])
    .then(function(data) {
        // files[0] will contain file1.json
        // files[1] will contain file2.json
        // sort data based on date objects
        data[0].sort(
            (a, b) => new Date(a.NextMessageTimeTimestamp) - new Date(b.NextMessageTimeTimestamp)
        );
        data[1].sort((a, b) => new Date(a.periodEnd) - new Date(b.periodEnd));
        // Set scale domains
        x.domain(d3.extent(data[0], d => new Date(d.NextMessageTimeTimestamp)));
        y.domain([0, d3.max(data[0], d => d.DownTimeDurationSeconds)]);

        // Update path data
        path.data([data[0]])
            .attr("fill", "none")
            .attr("stroke", "#00BFA5")
            .attr("stroke-width", 2)
            .attr("d", line);

        const circles = graph.selectAll("circle").data(data[0]);

        // Remove unwanted points
        // circles.exit().remove()
        // Update current points
        // circles
        //     .attr("cx", d => x(new Date(d.date)))
        //     .attr("cy", d => y(d.distance))

        // Add new points
        circles
            .enter()
            .append("circle")
            .attr("r", 4)
            .attr("cx", d => x(new Date(d.NextMessageTimeTimestamp)))
            .attr("cy", d => y(d.DownTimeDurationSeconds))
            .attr("fill", "#CCC");

        graph
            .selectAll("circle")
            .on("mouseover", (d, i, n) => {
                d3.select(n[i])
                    .transition()
                    .duration(100)
                    .attr("r", 8)
                    .attr("fill", "#FFF");
            })
            .on("mouseleave", (d, i, n) => {
                d3.select(n[i])
                    .transition()
                    .duration(100)
                    .attr("r", 4)
                    .attr("fill", "#CCC");
            });
        // Create axes
        const xAxis = d3
            .axisBottom(x)
            .ticks(4)
            .tickFormat(d3.timeFormat("%b %d"));
        const yAxis = d3.axisLeft(y).ticks(4);
        // .tickFormat(d => (d = "m"));

        // Call axes
        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        // Rotae axis text
        xAxisGroup
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .attr("text-anchor", end);
    })
    .catch(function(err) {
        // handle error here
    });
