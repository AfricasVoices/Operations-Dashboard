class SystemGraphsController {
    static updateGraphs2(data) {

        let dayTimeFormat = d3.timeFormat("%a %d (%H:%M)");

        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // format the data
        data.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            Object.keys(d.disk_usage)
                .sort()
                .forEach(metric => {
                    d[`disk_${metric}`] = (+d.disk_usage[metric] / 1e9);
                });
            Object.keys(d.memory_usage)
                .sort()
                .forEach(metric => {
                    d[`memory_${metric}`] = (+d.memory_usage[metric] / 1e9);
                });
            d.unused_cpu_percent = (100 - +d.cpu_percent)
            d.total_ram = +d.memory_free + +d.memory_used;
        })

        console.log(data)

        // Sort data by date
        data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        // set the dimensions and margins of the graph
        const Margin = {top: 40, right: 100, bottom: 105, left: 70},
            Width = 960 - Margin.left - Margin.right,
            Height = 500 - Margin.top - Margin.bottom;

        plotDiskMetrics(data);
        plotMemoryMetrics(data);
        plotCPUMetrics(data);
    
        function plotDiskMetrics(data) {
            let diskMetrics = ["used", "free"]
            // Create keys to stack
            let diskKeys = [],
            diskStr = ""

            for (let i = 0; i < diskMetrics.length; i++) {
                diskStr =  "disk_" + diskMetrics[i];
                diskKeys.push(diskStr);
            }

            let colors = ["#228B22", "#fbdb9c"]
            // color palette
            let color = d3.scaleOrdinal().domain(diskMetrics).range(colors);
            let stackDisk = d3.stack().keys(diskKeys),
                diskDataStacked = stackDisk(data);
            
            let svg = d3.select(".chart")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform", "translate(" + Margin.left + "," + Margin.top + ")");

            // Add X axis
            let x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.datetime))).range([0, Width]);
            let xAxis = svg.append("g")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x).tickFormat(dayTimeFormat))

            // Rotate axis labels
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label:
            svg.append("text")
                .attr("class", "")
                .attr("text-anchor", "end")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (dd HH:mm)");

            // Add Y axis label:
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - Margin.left)
                .attr("x", 0 - Height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("GB")

            let yLimit = data[0].disk_total
            // Add Y axis
            let y = d3.scaleLinear()
                .domain([0, yLimit])
                .range([ Height, 0 ]);
                svg.append("g")
                .call(d3.axisLeft(y).ticks(5))

            // Add a clipPath: everything out of this area won't be drawn.
            let clip = svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 0)
                .attr("y", 0);

            // Add brushing
            let brush = d3.brushX()                 // Add the brush feature using the d3.brush function
                .extent( [ [0,0], [Width, Height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

            // Create the scatter variable: where both the circles and the brush take place
            let areaChart = svg.append('g')
                .attr("clip-path", "url(#clip)")

            // Area generator
            let area = d3.area().x(d => x(d.data.datetime))
                        .y0(d => y(d[0]))
                        .y1(d => y(d[1]))

            // Show the areas
            areaChart
                .selectAll("mylayers")
                .data(diskDataStacked)
                .enter()
                .append("path")
                    .attr("class", d => "diskArea " + d.key)
                    .style("fill", d => color(d.key))
                    .attr("d", area)

            // Add the brushing
            areaChart
                .append("g")
                .attr("class", "brush")
                .call(brush);

            let idleTimeout
            function idled() { idleTimeout = null; }

            // A function that update the chart for given boundaries
            function updateChart() {

                let extent = d3.event.selection

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if(!extent){
                    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                    x.domain(d3.extent(data, d => d.datetime))
                }else{
                    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis and area position
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(dayTimeFormat))
                xAxis.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");

                areaChart
                    .selectAll("path")
                    .transition().duration(1000)
                    .attr("d", area)
            }

            // What to do when one group is hovered
            let highlight = function(d){
                console.log(d)
                // reduce opacity of all groups
                d3.selectAll(".diskArea").style("opacity", .1)
                // expect the one that is hovered
                d3.select("."+d).style("opacity", 1)
            }

            // And when it is not hovered anymore
            let noHighlight = function(d){
                d3.selectAll(".diskArea").style("opacity", 1)
            }

            // Add one dot in the legend for each name.
            let size = 20
            svg.selectAll("myrect")
                .data(diskKeys)
                .enter()
                .append("rect")
                    .attr("x", Width + 10)
                    .attr("y", (d,i) => 10 + i*(size+5)) // 10 is where the first dot appears. 25 is the distance between dots
                    .attr("width", size)
                    .attr("height", size)
                    .style("fill", d => color(d))
                    .on("mouseover", highlight)
                    .on("mouseleave", noHighlight)

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(diskMetrics)
                .enter()
                .append("text")
                    .attr("x", Width + 10 + size*1.2)
                    .attr("y", (d,i) => 10 + i*(size+5) + (size/2)) // 10 is where the first dot appears. 25 is the distance between dots
                    .style("fill", d => color(d))
                    .text(d => d)
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
                    .on("mouseover", highlight)
                    .on("mouseleave", noHighlight)

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
            let memoryMetrics = ["used", "free"]
            // Create keys to stack
            let memoryKeys = [],
            memoryStr = ""

            for (let i = 0; i < memoryMetrics.length; i++) {
                memoryStr =  "memory_" + memoryMetrics[i];
                memoryKeys.push(memoryStr);
            }
            
            let colors = ["#4B0082", "#fbdb9c"]
            // color palette
            let color = d3.scaleOrdinal()
                .domain(memoryMetrics)
                .range(colors);
            let stackMemory = d3.stack().keys(memoryKeys),
                memoryDataStacked = stackMemory(data);

            let svg = d3.select(".chart2")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + Margin.left + "," + Margin.top + ")");

            // Add X axis
            let x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.datetime))).range([0, Width]);
            let xAxis = svg.append("g")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x).tickFormat(dayTimeFormat))

            // Rotate axis labels
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label:
            svg.append("text")
                .attr("text-anchor", "end")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (dd HH:mm)");

            // Add Y axis label:
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - Margin.left)
                .attr("x", 0 - Height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("GB")

            let yLimit = d3.max(data, d => d.total_ram)
            // Add Y axis
            let y = d3.scaleLinear()
                .domain([0, yLimit])
                .range([ Height, 0 ]);
            svg.append("g").call(d3.axisLeft(y).ticks(5))

            // Add a clipPath: everything out of this area won't be drawn.
            let clip = svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 0)
                .attr("y", 0);

            // Add brushing
            let brush = d3.brushX()                 // Add the brush feature using the d3.brush function
                .extent( [ [0,0], [Width, Height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

            // Create the scatter variable: where both the circles and the brush take place
            let areaChart = svg.append('g')
                .attr("clip-path", "url(#clip)")

            // Area generator
            let area = d3.area().x(d => x(d.data.datetime))
                .y0(d => y(d[0]))
                .y1(d => y(d[1]))

            // Show the areas
            areaChart
                .selectAll("mylayers")
                .data(memoryDataStacked)
                .enter()
                .append("path")
                    .attr("class", d => "memoryArea " + d.key)
                    .style("fill", d => color(d.key))
                    .attr("d", area)

            // Add the brushing
            areaChart
                .append("g")
                .attr("class", "brush")
                .call(brush);

            let idleTimeout
            function idled() { idleTimeout = null; }

            // A function that update the chart for given boundaries
            function updateChart() {

                let extent = d3.event.selection

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if(!extent){
                    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                    x.domain(d3.extent(data, d => d.datetime))
                } else {
                    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis and area position
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(dayTimeFormat))
                xAxis.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");

                areaChart
                    .selectAll("path")
                    .transition().duration(1000)
                    .attr("d", area)
            }

            // What to do when one group is hovered
            let highlight = function(d){
                console.log(d)
                // reduce opacity of all groups
                d3.selectAll(".memoryArea").style("opacity", .1)
                // expect the one that is hovered
                d3.select("."+d).style("opacity", 1)
            }

            // And when it is not hovered anymore
            let noHighlight = function(d){
                d3.selectAll(".memoryArea").style("opacity", 1)
            }

            // Add one dot in the legend for each name.
            let size = 20
            svg.selectAll("myrect")
                .data(memoryKeys)
                .enter()
                .append("rect")
                    .attr("x", Width + 10)
                    .attr("y", (d,i) => 10 + i*(size+5)) // 10 is where the first dot appears. 25 is the distance between dots
                    .attr("width", size)
                    .attr("height", size)
                    .style("fill", d => color(d))
                    .on("mouseover", highlight)
                    .on("mouseleave", noHighlight)

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(memoryMetrics)
                .enter()
                .append("text")
                    .attr("x", Width + 10 + size*1.2)
                    .attr("y", (d,i) => 10 + i*(size+5) + (size/2)) // 10 is where the first dot appears. 25 is the distance between dots
                    .style("fill", d => color(d))
                    .text(d => d)
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
                    .on("mouseover", highlight)
                    .on("mouseleave", noHighlight)

            // Disk usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Memory Utilization");
        }

        function plotCPUMetrics(data) {
            let cpuMetrics = ["used", "free"],
                cpuKeys = ["cpu_percent", "unused_cpu_percent"];
            
            let colors = ["#0c2dde", "#fbdb9c"]
            // color palette
            let color = d3.scaleOrdinal()
                .domain(cpuMetrics)
                .range(colors);
            let stackCPU = d3.stack().keys(cpuKeys),
                cpuDataStacked = stackCPU(data);

            let svg = d3.select(".chart3")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + Margin.left + "," + Margin.top + ")");

            // Add X axis
            let x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.datetime))).range([0, Width]);
            let xAxis = svg.append("g")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x).tickFormat(dayTimeFormat))

            // Rotate axis labels
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label:
            svg.append("text")
                .attr("text-anchor", "end")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (dd HH:mm)");

            // Add Y axis label:
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - Margin.left)
                .attr("x", 0 - Height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("%")

            // Add Y axis
            let y = d3.scaleLinear()
                .domain([0, 100])
                .range([ Height, 0 ]);
            svg.append("g").call(d3.axisLeft(y).ticks(5))

            // Add a clipPath: everything out of this area won't be drawn.
            let clip = svg.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", Width )
                .attr("height", Height )
                .attr("x", 0)
                .attr("y", 0);

            // Add brushing
            let brush = d3.brushX()                 // Add the brush feature using the d3.brush function
                .extent( [ [0,0], [Width, Height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
                .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

            // Create the scatter variable: where both the circles and the brush take place
            let areaChart = svg.append('g')
                .attr("clip-path", "url(#clip)")

             // Area generator
            let area = d3.area().x(d => x(d.data.datetime))
                .y0(d => y(d[0]))
                .y1(d => y(d[1]))

            // Show the areas
            areaChart
                .selectAll("mylayers")
                .data(cpuDataStacked)
                .enter()
                .append("path")
                    .attr("class", d => "cpuArea " + d.key)
                    .style("fill", d => color(d.key))
                    .attr("d", area)

            // Add the brushing
            areaChart
                .append("g")
                .attr("class", "brush")
                .call(brush);

            let idleTimeout
            function idled() { idleTimeout = null; }

            // A function that update the chart for given boundaries
            function updateChart() {

                let extent = d3.event.selection

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if(!extent){
                    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                    x.domain(d3.extent(data, d => d.datetime))
                } else {
                    x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                    areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis and area position
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(dayTimeFormat))
                xAxis.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");
                    
                areaChart
                    .selectAll("path")
                    .transition().duration(1000)
                    .attr("d", area)
            }

            // What to do when one group is hovered
            let highlight = function(d){
                console.log(d)
                // reduce opacity of all groups
                d3.selectAll(".cpuArea").style("opacity", .1)
                // expect the one that is hovered
                d3.select("."+d).style("opacity", 1)
            }

            // And when it is not hovered anymore
            let noHighlight = function(d){
                d3.selectAll(".cpuArea").style("opacity", 1)
            }

            // Add one dot in the legend for each name.
            let size = 20
            svg.selectAll("myrect")
                .data(cpuKeys)
                .enter()
                .append("rect")
                    .attr("x", Width + 10)
                    .attr("y", (d,i) => 10 + i*(size+5)) // 10 is where the first dot appears. 25 is the distance between dots
                    .attr("width", size)
                    .attr("height", size)
                    .style("fill", d => color(d))
                    .on("mouseover", highlight)
                    .on("mouseleave", noHighlight)

            // Add one dot in the legend for each name.
            svg.selectAll("mylabels")
                .data(cpuMetrics)
                .enter()
                .append("text")
                    .attr("x", Width + 10 + size*1.2)
                    .attr("y", (d,i) => 10 + i*(size+5) + (size/2)) // 10 is where the first dot appears. 25 is the distance between dots
                    .style("fill", d => color(d))
                    .text(d => d)
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")
                    .on("mouseover", highlight)
                    .on("mouseleave", noHighlight)

            // Disk usage graph title
            svg.append("text")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("CPU Utilization");
        }
    }
}
