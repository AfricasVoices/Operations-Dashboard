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
                
            let yLimit = data[0].disk_usage.total
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

            // Get time when the system stopped & when it was restarted
            let stop = [], start = [], currentTime = new Date();
            data.forEach((d, i, n)=> {
                if (i == (n.length-1)) {
                    let difference_minutes = (currentTime.getTime() - d.datetime.getTime()) / 60000;
                    if (difference_minutes > 30) {
                        d.disk_usage.used = 0;
                        stop.push(d.datetime)
                    }
                } else if (i>0) {
                    let difference_minutes = (d.datetime.getTime() - n[i-1].datetime.getTime()) / 60000;
                    if (difference_minutes > 30) {
                        n[i-1].disk_usage.used = 0;
                        d.disk_usage.used = 0;
                        stop.push(n[i-1].datetime)
                        start.push(d.datetime)
                    } 
                }
            })
            
            // Add a clipPath: everything out of this area won't be drawn.
            svg.append("defs").append("svg:clipPath")
                .attr("id", "clip-lines")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 1)
                .attr("y", 0);

            let outageLines = svg.append('g')
                .attr("clip-path", "url(#clip-lines)")

            // Add the outage gridlines
            outageLines.append("g")			
                .attr("class", "stopDiskGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                .tickValues(stop)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            outageLines.append("g")			
                .attr("class", "startDiskGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                .tickValues(start)
                    .tickSize(-Height)
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
                .y1(d => y(d.disk_usage.used));

           // This will select the closest date on the x axiswhen a user hover over the chart
            let bisectDate = d3.bisector(function(d) {return d.datetime;}).left;
        
            function drawFocus() {    
                // Create focus object
                let focus = svg.append("g")
                    .attr("class", "focus")
    
                // Append circle on the line path
                focus.append("circle")
                    .attr("r", 3.5)
    
                // Add background rectangle behind the text tooltip
                focus.append("rect")
                    .attr("x", -30)
                    .attr("y", "-32px")
                    .attr("rx", 6)
                    .attr("ry", 6)
                    .attr("width", 220)
                    .attr("height", 20);
    
                // Add text annotation for tooltip
                focus.append("text")
                    .attr("x", -20)
                    .attr("dy", "-18px")
                    .attr("font-size", "12px")
                    .style("fill", "#0E86D4");
    
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

                // Select the rect and style it
                d3.selectAll(".focus rect")
                    .style("fill", "whitesmoke")
                    .style("opacity", 0)
    
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
    
                    // Position the text
                    focus.select("text")
                        .text(`${d3.timeFormat("%Y-%m-%d (%H:%M)")(d.datetime)} 
                            Used: ${d3.formatPrefix(".2", d.disk_usage.used)(d.disk_usage.used).replace("G", "GB")}`)
                        .transition() // slowly fade in the tooltip
                            .duration(100)
                            .style("opacity", 1);
    
                    // Show the circle on the path
                    focus.selectAll(".focus circle")
                        .style("opacity", 1)

                    // Show the rect on the path
                    d3.selectAll(".focus rect")
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
                d3.selectAll(".stopDiskGrid").remove();
                d3.selectAll(".startDiskGrid").remove();

                svg.append("g")			
                    .attr("class", "diskXGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .tickSize(-Height)
                        .tickFormat("")
                    )

                // Add the outage gridlines
                outageLines.append("g")			
                    .attr("class", "stopDiskGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                    .tickValues(stop)
                        .tickSize(-Height)
                        .tickFormat("")
                    )
                    .attr("opacity", 0)	
                    .transition().duration(1000).delay(400)
                    .attr("opacity", 1)

                outageLines.append("g")			
                    .attr("class", "startDiskGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                    .tickValues(start)
                        .tickSize(-Height)
                        .tickFormat("")
                    )
                    .attr("opacity", 0)	
                    .transition().duration(1000).delay(400)
                    .attr("opacity", 1)
            }

            // Disk usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Disk Usage");

            let keys = ["stop", "start"]
            let color = d3.scaleOrdinal().domain(keys).range(["red", "green"]);

            // Add one dot in the legend for each name.
            svg.selectAll("myrect")
                .data(keys)
                .enter()
                .append("rect")
                    .attr("x", Width + 10)
                    .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                    .attr("width", 30)
                    .attr("height", 3)
                    .style("fill", d => color(d))

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(keys)
                .enter()
                .append("text")
                    .attr("x", Width + 45)
                    .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                    .style("fill", d => color(d))
                    .text(d => d)
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
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

            // Get time when the system stopped & when it was restarted
            let stop = [], start = [], currentTime = new Date();
            data.forEach((d, i, n)=> {
                if (i == (n.length-1)) {
                    let difference_minutes = (currentTime.getTime() - d.datetime.getTime()) / 60000;
                    if (difference_minutes > 30) {
                        d.memory_usage.used = 0;
                        stop.push(d.datetime)
                    }
                } else if (i>0) {
                    let difference_minutes = (d.datetime.getTime() - n[i-1].datetime.getTime()) / 60000;
                    if (difference_minutes > 30) {
                        n[i-1].memory_usage.used = 0;
                        d.memory_usage.used = 0;
                        stop.push(n[i-1].datetime)
                        start.push(d.datetime)
                    } 
                }
            })

            // Add a clipPath: everything out of this area won't be drawn.
            svg.append("defs").append("svg:clipPath")
                .attr("id", "clip-lines")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 1)
                .attr("y", 0);

            let outageLines = svg.append('g')
                .attr("clip-path", "url(#clip-lines)")

            // Add the outage gridlines
            outageLines.append("g")			
                .attr("class", "stopMemoryGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                .tickValues(stop)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            outageLines.append("g")			
                .attr("class", "startMemoryGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                .tickValues(start)
                    .tickSize(-Height)
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
    
                // Append circle on the line path
                focus.append("circle")
                    .attr("r", 3.5)
    
                // Add background rectangle behind the text tooltip
                focus.append("rect")
                    .attr("x", -30)
                    .attr("y", "-32px")
                    .attr("rx", 6)
                    .attr("ry", 6)
                    .attr("width", 210)
                    .attr("height", 20);

                // Add text annotation for tooltip
                focus.append("text")
                    .attr("x", -20)
                    .attr("dy", "-18px")
                    .attr("font-size", "12px")
                    .style("fill", "#A0522D");
    
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

                // Select the rect and style it
                d3.selectAll(".focus2 rect")
                    .style("fill", "whitesmoke")
                    .style("opacity", 0)
    
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
    
                    // Position the text
                    focus.select("text")
                        .text(`${d3.timeFormat("%Y-%m-%d (%H:%M)")(d.datetime)} 
                            Used: ${d3.formatPrefix(".2", d.memory_usage.used)(d.memory_usage.used).replace("G", "GB")}`)
                        .transition() // slowly fade in the tooltip
                            .duration(100)
                            .style("opacity", 1);
    
                    // Show the circle on the path
                    focus.selectAll(".focus2 circle")
                        .style("opacity", 1)

                    // Show the rect on the path
                    d3.selectAll(".focus2 rect")
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
                d3.selectAll(".stopMemoryGrid").remove();
                d3.selectAll(".startMemoryGrid").remove();

                svg.append("g")			
                    .attr("class", "memoryXGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .tickSize(-Height)
                        .tickFormat("")
                    ) 

                // Add the outage gridlines
                outageLines.append("g")			
                    .attr("class", "stopMemoryGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                    .tickValues(stop)
                        .tickSize(-Height)
                        .tickFormat("")
                    )
                    .attr("opacity", 0)	
                    .transition().duration(1000).delay(400)
                    .attr("opacity", 1)

                outageLines.append("g")			
                    .attr("class", "startMemoryGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                    .tickValues(start)
                        .tickSize(-Height)
                        .tickFormat("")
                    )
                    .attr("opacity", 0)	
                    .transition().duration(1000).delay(400)
                    .attr("opacity", 1)
            }

            // Memory usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Memory Utilization");

            let keys = ["stop", "start"]
            let color = d3.scaleOrdinal().domain(keys).range(["red", "green"]);

            // Add one dot in the legend for each name.
            svg.selectAll("myrect")
                .data(keys)
                .enter()
                .append("rect")
                    .attr("x", Width + 10)
                    .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                    .attr("width", 30)
                    .attr("height", 3)
                    .style("fill", d => color(d))

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(keys)
                .enter()
                .append("text")
                    .attr("x", Width + 45)
                    .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                    .style("fill", d => color(d))
                    .text(d => d)
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
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

            // Get time when the system stopped & when it was restarted
            let stop = [], start = [], currentTime = new Date();
            data.forEach((d, i, n)=> {
                if (i == (n.length-1)) {
                    let difference_minutes = (currentTime.getTime() - d.datetime.getTime()) / 60000;
                    if (difference_minutes > 30) {
                        d.cpu_percent = 0;
                        stop.push(d.datetime)
                    }
                } else if (i>0) {
                    let difference_minutes = (d.datetime.getTime() - n[i-1].datetime.getTime()) / 60000;
                    if (difference_minutes > 30) {
                        n[i-1].cpu_percent = 0;
                        d.cpu_percent = 0;
                        stop.push(n[i-1].datetime)
                        start.push(d.datetime)
                    } 
                }
            })

            // Add a clipPath: everything out of this area won't be drawn.
            svg.append("defs").append("svg:clipPath")
                .attr("id", "clip-lines")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 1)
                .attr("y", 0);

            let outageLines = svg.append('g')
                .attr("clip-path", "url(#clip-lines)")

            // Add the outage gridlines
            outageLines.append("g")			
                .attr("class", "stopCpuGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                .tickValues(stop)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            outageLines.append("g")			
                .attr("class", "startCpuGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                .tickValues(start)
                    .tickSize(-Height)
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
    
                // Append circle on the line path
                focus.append("circle")
                    .attr("r", 3.5)
    
                // Add background rectangle behind the text tooltip
                focus.append("rect")
                    .attr("x", -30)
                    .attr("y", "-32px")
                    .attr("rx", 6)
                    .attr("ry", 6)
                    .attr("width", 200)
                    .attr("height", 20);
    
                // Add text annotation for tooltip
                focus.append("text")
                    .attr("x", -20)
                    .attr("dy", "-18px")
                    .attr("font-size", "12px")
                    .style("fill", "#00008B");
    
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

                // Select the rect and style it
                d3.selectAll(".focus3 rect")
                    .style("fill", "whitesmoke")
                    .style("opacity", 0)
    
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
    
                    // Position the text
                    focus.select("text")
                        .text(`${d3.timeFormat("%Y-%m-%d (%H:%M)")(d.datetime)} Used: ${d.cpu_percent} %`)
                        .transition() // slowly fade in the tooltip
                            .duration(100)
                            .style("opacity", 1);
    
                    // Show the circle on the path
                    focus.selectAll(".focus3 circle")
                        .style("opacity", 1)

                    // Show the rect on the path
                    d3.selectAll(".focus3 rect")
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
                d3.selectAll(".stopCpuGrid").remove();
                d3.selectAll(".startCpuGrid").remove();

                svg.append("g")			
                    .attr("class", "cpuXGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .tickSize(-Height)
                        .tickFormat("")
                    ) 

                // Add the outage gridlines
                outageLines.append("g")			
                    .attr("class", "stopCpuGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                    .tickValues(stop)
                        .tickSize(-Height)
                        .tickFormat("")
                    )
                    .attr("opacity", 0)	
                    .transition().duration(1000).delay(400)
                    .attr("opacity", 1)

                outageLines.append("g")			
                    .attr("class", "startCpuGrid")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                    .tickValues(start)
                        .tickSize(-Height)
                        .tickFormat("")
                    )
                    .attr("opacity", 0)	
                    .transition().duration(1000).delay(400)
                    .attr("opacity", 1)
            }

            // CPU usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("CPU Utilization");

            let keys = ["stop", "start"]
            let color = d3.scaleOrdinal().domain(keys).range(["red", "green"]);

            // Add one dot in the legend for each name.
            svg.selectAll("myrect")
                .data(keys)
                .enter()
                .append("rect")
                    .attr("x", Width + 10)
                    .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                    .attr("width", 30)
                    .attr("height", 3)
                    .style("fill", d => color(d))

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(keys)
                .enter()
                .append("text")
                    .attr("x", Width + 45)
                    .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                    .style("fill", d => color(d))
                    .text(d => d)
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
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
                difference_minutes = (currentTime.getTime() - lastUpdateTimeStamp.getTime()) / 60000;
            if (difference_minutes > 30) {
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
