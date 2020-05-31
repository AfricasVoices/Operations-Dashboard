class SystemGraphsController {
    static updateGraphs(data) {

        let dayTimeFormat = d3.timeFormat("%a %d (%H:%M)");

        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // Set the dimensions and margins of the graphs
        const Margin = {top: 40, right: 100, bottom: 105, left: 70},
            Width = 960 - Margin.left - Margin.right,
            Height = 500 - Margin.top - Margin.bottom;

        plotDiskMetrics(data);
        plotMemoryMetrics(data);
        plotCPUMetrics(data);

        function plotDiskMetrics(data) {
            // Append svg to element with class chart
            let svg = d3.select(".disc-usage-chart")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform", "translate(" + Margin.left + "," + Margin.top + ")");

            // Add X axis
            let x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.datetime))).range([1, Width]);
            let xAxis = svg.append("g")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(dayTimeFormat));
            
            // Add the X gridlines
            svg.append("g")			
                .attr("class", "diskXGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickSize(-Height)
                    .tickFormat("")
                )
            
            // Rotate X axis ticks
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label
            svg.append("text")
                .attr("text-anchor", "end")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (dd:hh:m)");

            // Add Y axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - Margin.left)
                .attr("x", 0 - Height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Disc Usage (GB)");
                
            let yLimit = data[0].disk_total
            // Add Y axis
            let decimalFormatter = d3.format(".2s");
            let y = d3.scaleLinear()
                // Add 100 to yLimit to increase brushing area
                .domain([0, yLimit + 100])
                .range([ Height, 0 ]);
                svg.append("g")
                .call(d3.axisLeft(y).ticks(5).tickFormat((d) => decimalFormatter(d).replace('G', 'GB')))      

            // Add the Y gridlines
            svg.append("g")			
                .attr("class", "diskGrid")
                .call(d3.axisLeft(y)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add a clipPath: everything out of this area won't be drawn.
            let clip = svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 1)
                .attr("y", 0);

            // Create the scatter variable: where both the circles and the brush take place
            let areaChart = svg.append('g')
                .attr("clip-path", "url(#clip)")
            
            // Area generator
            let area = d3.area().x(d => x(d.datetime)).y0(y(0))
                .y1(d => y(d.disk_usage.used)).curve(d3.curveCardinal); // this smooths out the curves of the line

           // This will select the closest date on the x axiswhen a user hover over the chart
            let bisectDate = d3.bisector(function(d) {return d.datetime;}).left;
        
            function drawFocus() {    
                // Create focus object
                let focus = svg.append("g")
                    .attr("class", "focus")

                // Add an x-line to show where hovering
                focus.append("line")
                    .classed("x", true);

                // Add a y-line to show where hovering
                focus.append("line")
                    .classed("y", true);
    
                // Append circle on the line path
                focus.append("circle")
                    .attr("r", 7.5)
    
                // Add background rectangle behind the text tooltip
                focus.append("rect")
                    .attr("x", -30)
                    .attr("y", "-2em")
                    .attr("width", 200)
                    .attr("height", 20)
                    .style("fill", "white");
    
                // Add text annotation for tooltip
                focus.append("text")
                    .attr("x", -30)
                    .attr("dy", "-1em")
                    .style("fill", "black")
                    .style("font-family", "SuisseIntl");
    
                focus.append("div")
                    .attr("x", 10)
                    .attr("dy", ".35em")
                    .attr("class", "tooltip")
                    .style("opacity", 1)
    
                // Create an overlay path to draw the above objects on top of
                areaChart
                    .attr("class", "overlay")  
                    .on("mouseover", () => focus.style("display", null))
                    .on("mouseout", () => focus.style("display", "none"))
                    .on("mousemove", tipMove);

                // Make the overlay rectangle transparent,
                // So it only serves the purpose of detecting mouse events
                d3.select(".overlay")
                    .style("fill", "none")
                    .style("pointer-events", "all");
    
                // Select focus objects and set opacity
                d3.selectAll(".focus")
                    .style("opacity", 0.9);

                // Select the circle and style it
                d3.selectAll(".focus circle")
                    .style("fill", "#068ca0")
                    .style("opacity", 0)
    
                // select the hover lines and style them
                d3.selectAll(".focus line")
                    .style("fill", "none")
                    .style("stroke", "black")
                    .style("opacity", 0.4)
                    .style("stroke-width", "1px");
    
                // Function that adds tooltip on hover
                function tipMove() {
                    // Below code finds the date by bisecting and
                    // Stores the x and y coordinate as variables
                    let x0 = x.invert(d3.mouse(this)[0]);
                    let i = bisectDate(data, x0, 1);
                    let d0 = data[i - 1];
                    let d1 = data[i];
                    let d = x0 - d0.datetime > d1.datetime - x0 ? d1 : d0;
    
                    // Place the focus objects on the same path as the line
                    focus.attr("transform", `translate(${x(d.datetime)}, ${y(d.disk_usage.used)})`);
    
                    // Position the x line
                    focus.select("line.x")
                        .attr("x1", 0)
                        .attr("x2", -x(d.datetime))
                        .attr("y1", 0)
                        .attr("y2", 0)
                        .style("opacity", 0.1);

                    // Position the y line
                    focus.select("line.y")
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .attr("y1", 0)
                        .attr("y2", Height - y(d.disk_usage.used));
    
                    // Position the text
                    focus.select("text")
                        .text(`${d3.timeFormat("%Y-%m-%d (%H:%M)")(x0)} 
                            Used: ${d3.formatPrefix(".2", d.disk_usage.used)(d.disk_usage.used).replace("G", "GB")}`)
                        .transition() // slowly fade in the tooltip
                            .duration(100)
                            .style("opacity", 1);
    
                    // Show the circle on the path
                    focus.selectAll(".focus circle")
                        .style("opacity", 1)
    
                };
            }
            
            // Add the area
            areaChart.append("path")
                .datum(data)
                .attr("class", "diskArea")  // I add the class memoryArea to be able to modify it later on.
                .attr("fill", "#0E86D4")
                .attr("fill-opacity", .6)
                .attr("stroke", "#0E86D4")
                .attr("stroke-width", 0.2)
                .attr("d", area);

            // Add brushing
            let brush = d3.brushX()                 // Add the brush feature using the d3.brush function
                .extent( [ [0,0], [Width, Height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

            areaChart
                .append("g")
                .attr("class", "brush")
                .call(brush);

            drawFocus(); 

            // Will hold time set before subsequent brushing trigger `updateChart`
            let idleTimeout
            function resetIdleTimeout() { idleTimeout = null; }

            // A function that update the chart for given boundaries
            function updateChart() {
                let extent = d3.event.selection;

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if(!extent) {
                    if (!idleTimeout) return idleTimeout = setTimeout(resetIdleTimeout, 350); // This allows to wait a little bit
                    x.domain(d3.extent(data, d => d.datetime))
                } else {
                    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis and area position
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(dayTimeFormat));

                // Rotate X axis ticks
                xAxis.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");

                areaChart
                    .selectAll("path")
                    .transition().duration(1000)
                    .attr("d", area)

                d3.selectAll(".diskXGrid").remove();
                svg.append("g")			
                    .attr("class", "diskXGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .tickSize(-Height)
                        .tickFormat("")
                    )
            }

            // Disk usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Disk Usage");
        }

        function plotMemoryMetrics(data) {
            // Append svg to element with class chart2
            let svg = d3.select(".memory-utilization-chart")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + Margin.left + "," + Margin.top + ")");

            // Add X axis
            let x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.datetime))).range([1, Width]);
            let xAxis = svg.append("g")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(dayTimeFormat));

            // Add the X gridlines
            svg.append("g")			
                .attr("class", "memoryXGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Rotate axis ticks
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label
            svg.append("text")
                .attr("text-anchor", "end")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (dd:hh:m)");

            // Add Y axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - Margin.left)
                .attr("x", 0 - Height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Memory Utilization(GB)");

            let decimalFormatter = d3.format(".2s");
            let yLimit = data[0].memory_usage.total;
            // Add Y axis
            let y = d3.scaleLinear()
                .domain([0, yLimit])
                .range([ Height, 0 ]);
            svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => decimalFormatter(d).replace('G', 'GB')))

            // Add the Y gridlines
            svg.append("g")			
                .attr("class", "memoryGrid")
                .call(d3.axisLeft(y)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add a clipPath: everything out of this area won't be drawn.
            let clip = svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 1)
                .attr("y", 0);

            // Create the scatter variable: where both the circles and the brush take place
            let areaChart = svg.append('g')
                .attr("clip-path", "url(#clip)")

            // Create an area generator
            let area = d3.area().x(d => x(d.datetime)).y0(y(0)).y1(d => y(d.memory_usage.used))
            // .curve(d3.curveCardinal); // this smooths out the curves of the line

            // This will select the closest date on the x axiswhen a user hover over the chart
            let bisectDate = d3.bisector(function(d) {return d.datetime;}).left;

            function drawFocus() {  
                // Create focus object
                let focus = svg.append("g")
                    .attr("class", "focus2")

                // Add an x-line to show where hovering
                focus.append("line")
                    .classed("x", true);

                // Add a y-line to show where hovering
                focus.append("line")
                    .classed("y", true);
    
                // Append circle on the line path
                focus.append("circle")
                    .attr("r", 7.5)
    
                // Add background rectangle behind the text tooltip
                focus.append("rect")
                    .attr("x", -30)
                    .attr("y", "-2em")
                    .attr("width", 230)
                    .attr("height", 20)
                    .style("fill", "white");
    
                // Add text annotation for tooltip
                focus.append("text")
                    .attr("x", -30)
                    .attr("dy", "-1em")
                    .style("fill", "black")
                    .style("font-family", "SuisseIntl");
    
                focus.append("div")
                    .attr("x", 10)
                    .attr("dy", ".35em")
                    .attr("class", "tooltip")
                    .style("opacity", 1)
    
                // Create an overlay path to draw the above objects on top of
                areaChart
                    .attr("class", "overlay2")  
                    .on("mouseover", () => focus.style("display", null))
                    .on("mouseout", () => focus.style("display", "none"))
                    .on("mousemove", tipMove);

                // Make the overlay area transparent,
                // So it only serves the purpose of detecting mouse events
                d3.select(".overlay2")
                    .style("fill", "none")
                    .style("pointer-events", "all");
    
                // Select focus objects and set opacity
                d3.selectAll(".focus2")
                    .style("opacity", 0.9);

                // Select the circle and style it
                d3.selectAll(".focus2 circle")
                    .style("fill", "#A0522D")
                    .style("opacity", 0)
    
                // select the hover lines and style them
                d3.selectAll(".focus2 line")
                    .style("fill", "none")
                    .style("stroke", "black")
                    .style("opacity", 0.4)
                    .style("stroke-width", "1px");
    
                // Function that adds tooltip on hover
                function tipMove() {
                    // Below code finds the date by bisecting and
                    // Stores the x and y coordinate as variables
                    let x0 = x.invert(d3.mouse(this)[0]);
                    let i = bisectDate(data, x0, 1);
                    let d0 = data[i - 1];
                    let d1 = data[i];
                    let d = x0 - d0.datetime > d1.datetime - x0 ? d1 : d0;
    
                    // Place the focus objects on the same path as the line
                    focus.attr("transform", `translate(${x(d.datetime)}, ${y(d.memory_usage.used)})`);
    
                    // Position the x line
                    focus.select("line.x")
                        .attr("x1", 0)
                        .attr("x2", -x(d.datetime))
                        .attr("y1", 0)
                        .attr("y2", 0)
                        .style("opacity", 0.1);

                    // Position the y line
                    focus.select("line.y")
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .attr("y1", 0)
                        .attr("y2", Height - y(d.memory_usage.used));
    
                    // Position the text
                    focus.select("text")
                        .text(`${d3.timeFormat("%Y-%m-%d (%H:%M)")(x0)} 
                            Used: ${d3.formatPrefix(".2", d.memory_usage.used)(d.memory_usage.used).replace("G", "GB")}`)
                        .transition() // slowly fade in the tooltip
                            .duration(100)
                            .style("opacity", 1);
    
                    // Show the circle on the path
                    focus.selectAll(".focus2 circle")
                        .style("opacity", 1)
    
                };
            }

            // Add the area
            areaChart.append("path")
                .datum(data)
                .attr("class", "memoryArea")  // I add the class memoryArea to be able to modify it later on.
                .attr("fill", "#90413C")
                .attr("fill-opacity", .6)
                .attr("stroke", "#90413C")
                .attr("stroke-width", 0.2)
                .attr("d", area);

            // Add brushing
            let brush = d3.brushX()                 // Add the brush feature using the d3.brush function
                .extent( [ [0,0], [Width, Height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

            areaChart
                .append("g")
                .attr("class", "brush")
                .call(brush);

            drawFocus();

            // Will hold time set before subsequent brushing trigger `updateChart`
            let idleTimeout
            function resetIdleTimeout() { idleTimeout = null; }

            // A function that update the chart for given boundaries
            function updateChart() {
                let extent = d3.event.selection;

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if(!extent) {
                    if (!idleTimeout) return idleTimeout = setTimeout(resetIdleTimeout, 350); // This allows to wait a little bit
                    x.domain(d3.extent(data, d => d.datetime))
                } else {
                    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis and area position
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(dayTimeFormat));
                // Rotate X axis ticks
                xAxis.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");

                areaChart
                    .selectAll("path")
                    .transition().duration(1000)
                    .attr("d", area)

                d3.selectAll(".memoryXGrid").remove();
                svg.append("g")			
                    .attr("class", "memoryXGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .tickSize(-Height)
                        .tickFormat("")
                    ) 
            }

            // Memory usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Memory Utilization");
        }

        function plotCPUMetrics(data) {       
            // Append svg to element with class chart3     
            let svg = d3.select(".cpu-utilization-chart")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + Margin.left + "," + Margin.top + ")");

            // Add X axis
            let x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.datetime))).range([1, Width]);
            let xAxis = svg.append("g")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(dayTimeFormat));

            // Add the X gridlines
            svg.append("g")			
                .attr("class", "cpuXGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Rotate axis ticks
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label
            svg.append("text")
                .attr("text-anchor", "end")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (dd:hh:m)");

            // Add Y axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - Margin.left)
                .attr("x", 0 - Height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("CPU Utilization (%)")

            // Add Y axis
            let y = d3.scaleLinear()
                .domain([0, 100])
                .range([ Height, 0 ]);
            svg.append("g").call(d3.axisLeft(y).ticks(5))

            // Add the Y gridlines
            svg.append("g")			
                .attr("class", "cpuGrid")
                .call(d3.axisLeft(y)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add a clipPath: everything out of this area won't be drawn.
            let clip = svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 1)
                .attr("y", 0);

            // Create the scatter variable: where both the circles and the brush take place
            let areaChart = svg.append('g')
                .attr("clip-path", "url(#clip)")

            // Create an area generator
            let area = d3.area().x(d => x(d.datetime)).y0(y(0)).y1(d => y(d.cpu_percent))
            
            // This will select the closest date on the x axiswhen a user hover over the chart
            let bisectDate = d3.bisector(function(d) {return d.datetime;}).left;

            function drawFocus() {  
                // Create focus object
                let focus = svg.append("g")
                    .attr("class", "focus3")

                // Add an x-line to show where hovering
                focus.append("line")
                    .classed("x", true);

                // Add a y-line to show where hovering
                focus.append("line")
                    .classed("y", true);
    
                // Append circle on the line path
                focus.append("circle")
                    .attr("r", 7.5)
    
                // Add background rectangle behind the text tooltip
                focus.append("rect")
                    .attr("x", -30)
                    .attr("y", "-2em")
                    .attr("width", 230)
                    .attr("height", 20)
                    .style("fill", "white");
    
                // Add text annotation for tooltip
                focus.append("text")
                    .attr("x", -30)
                    .attr("dy", "-1em")
                    .style("fill", "black")
                    .style("font-family", "SuisseIntl");
    
                focus.append("div")
                    .attr("x", 10)
                    .attr("dy", ".35em")
                    .attr("class", "tooltip")
                    .style("opacity", 1)
    
                // Create an overlay path to draw the above objects on top of
                areaChart
                    .attr("class", "overlay3")  
                    .on("mouseover", () => focus.style("display", null))
                    .on("mouseout", () => focus.style("display", "none"))
                    .on("mousemove", tipMove);

                // Make the overlay area transparent,
                // So it only serves the purpose of detecting mouse events
                d3.select(".overlay3")
                    .style("fill", "none")
                    .style("pointer-events", "all");
    
                // Select focus objects and set opacity
                d3.selectAll(".focus3")
                    .style("opacity", 0.9);

                // Select the circle and style it
                d3.selectAll(".focus3 circle")
                    .style("fill", "#00008B")
                    .style("opacity", 0)
    
                // select the hover lines and style them
                d3.selectAll(".focus3 line")
                    .style("fill", "none")
                    .style("stroke", "black")
                    .style("opacity", 0.4)
                    .style("stroke-width", "1px");
    
                // Function that adds tooltip on hover
                function tipMove() {
                    // Below code finds the date by bisecting and
                    // Stores the x and y coordinate as variables
                    let x0 = x.invert(d3.mouse(this)[0]);
                    let i = bisectDate(data, x0, 1);
                    let d0 = data[i - 1];
                    let d1 = data[i];
                    let d = x0 - d0.datetime > d1.datetime - x0 ? d1 : d0;
    
                    // Place the focus objects on the same path as the line
                    focus.attr("transform", `translate(${x(d.datetime)}, ${y(d.cpu_percent)})`);
    
                    // Position the x line
                    focus.select("line.x")
                        .attr("x1", 0)
                        .attr("x2", -x(d.datetime))
                        .attr("y1", 0)
                        .attr("y2", 0)
                        .style("opacity", 0.1);

                    // Position the y line
                    focus.select("line.y")
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .attr("y1", 0)
                        .attr("y2", Height - y(d.cpu_percent));
    
                    // Position the text
                    focus.select("text")
                        .text(`${d3.timeFormat("%Y-%m-%d (%H:%M)")(x0)} 
                            Used: ${d3.formatPrefix(".2", d.cpu_percent)(d.cpu_percent)} %`)
                        .transition() // slowly fade in the tooltip
                            .duration(100)
                            .style("opacity", 1);
    
                    // Show the circle on the path
                    focus.selectAll(".focus3 circle")
                        .style("opacity", 1)
    
                };
            }

            // Add the area
            areaChart.append("path")
                .datum(data)
                .attr("class", "cpuArea")  // I add the class memoryArea to be able to modify it later on.
                .attr("fill", "#0000CD")
                .attr("fill-opacity", .6)
                .attr("stroke", "#0000CD")
                .attr("stroke-width", 0.1)
                .attr("d", area);

            // Add brushing
            let brush = d3.brushX()                 // Add the brush feature using the d3.brush function
                .extent( [ [0,0], [Width, Height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

            areaChart
                .append("g")
                .attr("class", "brush")
                .call(brush);

            drawFocus();

            // Will hold time set before subsequent brushing trigger `updateChart`
            let idleTimeout
            function resetIdleTimeout() { idleTimeout = null; }

            // A function that update the chart for given boundaries
            function updateChart() {
                let extent = d3.event.selection;

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if(!extent) {
                    if (!idleTimeout) return idleTimeout = setTimeout(resetIdleTimeout, 350); // This allows to wait a little bit
                    x.domain(d3.extent(data, d => d.datetime))
                } else {
                    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis and area position
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(dayTimeFormat));
                // Rotate X axis ticks
                xAxis.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");

                areaChart
                    .selectAll("path")
                    .transition().duration(1000)
                    .attr("d", area)

                d3.selectAll(".cpuXGrid").remove();
                svg.append("g")			
                    .attr("class", "cpuXGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .tickSize(-Height)
                        .tickFormat("")
                    ) 
            }

            // CPU usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("CPU Utilization");
        }

        let fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        // Update timestamp of update and reset formatting
        let lastUpdateTimeStamp = new Date(
            Math.max.apply(
                null,
                data.map(d => new Date(d.datetime))
            )
        );
        lastUpdateTimeStamp.setMinutes(lastUpdateTimeStamp.getMinutes());
        lastUpdateTimeStamp = new Date(lastUpdateTimeStamp);

        d3.select("#lastUpdated")
            .classed("text-stale-info", false)
            .text(fullDateFormat(lastUpdateTimeStamp));

        function setLastUpdatedAlert() {
            // Calculate time diff bw current and lastUpdateTimeStamp
            let currentTime = new Date(),
                difference_ms = (currentTime.getTime() - lastUpdateTimeStamp.getTime()) / 60000,
                difference_minutes = Math.floor(difference_ms % 60);
            if (difference_minutes > 10) {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", true);
            } else {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", false);
            }
        }
        if (SystemGraphsController.lastUpdateTimer) {
            clearInterval(SystemGraphsController.lastUpdateTimer);
        }
        SystemGraphsController.lastUpdateTimer = setInterval(setLastUpdatedAlert, 1000);
    }

    static clearTimers() {
        if (SystemGraphsController.lastUpdateTimer) {
            clearInterval(SystemGraphsController.lastUpdateTimer);
            SystemGraphsController.lastUpdateTimer = null;
        }
    }
}
