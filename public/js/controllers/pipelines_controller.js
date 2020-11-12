export class PipelinesController {
    static updatePipelinePage(data) {
        PipelinesController.updateGraphs(data.dt, data.pipelineMetrics)
        PipelinesController.updatePipelineProgressTable(data.pipelineProgressTableData);
    }

    static updateGraphs(data, metrics) {
        console.log(data)
        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // set the dimensions and margins of the graph
        const Margin = { top: 40, right: 100, bottom: 105, left: 70 },
            Width = 960 - Margin.right - Margin.left,
            Height = 500 - Margin.top - Margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(".line-chart").append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "-95 -40 1080 500")
            .attr("preserveAspectRatio", "xMinYMin")
            .append("g");
        
        // Add X axis
        let x = d3.scaleTime()
            .domain(d3.extent(metrics, d => d.timestamp))
            .range([0, Width]);
        let dayTimeFormat = d3.timeFormat("%a %d (%H:%M)");
        let xAxis = svg.append("g")
            .attr("transform", "translate(0," + Height + ")")
            .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(dayTimeFormat))
        // Rotate axis labels
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Y axis
        let y = d3.scaleBand()
            .range([ 0, Height ])
            .domain(data.map(d => d.project))
            .padding(1);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add a clipPath: everything out of this area won't be drawn.
        let clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", Width)
            .attr("height", Height )
            .attr("x", 0)
            .attr("y", 0);

        // Add brushing
        let brush = d3.brushX()                   
            .extent( [ [0,0], [Width, Height] ] )  
            .on("end", updateChart)               

        // Create the line variable: where both the line and the brush take place
        let plot = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Lines
        plot.selectAll("myline")
            .data(data)
            .enter()
            .append("line")
                .attr("class", "line")
                .attr("x1", d => x(d.value1))
                .attr("x2", d => {
                    if (d.running) {
                        return x(d.value1)
                    } else {
                        return x(d.value2);
                    }
                })
                .attr("y1", d => y(d.project))
                .attr("y2", d => y(d.project))
                .attr("stroke", d => {
                    if (d.failed) {
                        return "red";
                    } else if (d.success) {
                        return "green";
                    } else {
                        return "blue";
                    }
                })
                .attr("stroke-width", "2px");

        // Circles of variable 1
        plot.selectAll("mycircle")
            .data(data)
            .enter()
            .append("circle")
                .attr("class", "circle1")
                .attr("cx", d => x(d.value1))
                .attr("cy", d => y(d.project))
                .attr("r", "6")
                .style("fill", "#69b3a2");

        // Circles of variable 2
        plot.selectAll("mycircle")
            .data(data)
            .enter()
            .append("circle")
                .attr("class", "circle2")
                .attr("cx", d => {
                    if (d.running) {
                        return x(d.value1)
                    } else {
                        return x(d.value2);
                    }
                })
                .attr("cy", d => y(d.project))
                .attr("r", "6")
                .style("fill", "#4C4082");

        // Add the brushing
        plot.append("g")
            .attr("class", "brush")
            .call(brush);

        // A function that set idleTimeOut to null
        let idleTimeout
        function idled() { idleTimeout = null; }

        // A function that update the chart for given boundaries
        function updateChart(event) {
            
            let extent = event.selection

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                x.domain(d3.extent(metrics, d => d.timestamp));
            } else {
                x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
                plot.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and circle position
            xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(dayTimeFormat))
            // Rotate axis labels
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            plot.selectAll(".line")
                .transition()
                .duration(1000)
                .attr("x1", d => x(d.value1))
                .attr("x2", d => {
                    if (d.running) {
                        return x(d.value1)
                    } else {
                        return x(d.value2)
                    }
                })
                .attr("y1", d => y(d.project))
                .attr("y2", d => y(d.project))
                .attr("stroke", d => {
                    if (d.failed) {
                        return "red";
                    } else if (d.success) {
                        return "green";
                    } else {
                        return "blue";
                    }
                });

            plot.selectAll(".circle1")
                .transition().duration(1000)
                .attr("cx", d => x(d.value1))
                .attr("cy", d => y(d.project))

            plot.selectAll(".circle2")
                .attr("cx", d => {
                    if (d.running) {
                        return x(d.value1)
                    } else {
                        return x(d.value2);
                    }
                })
                .attr("cy", d => y(d.project))
        }
    }

    static updatePipelineProgressTable(data) {
        let fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        transform();

        // Function used to generate coding progress table
        function transform() {
            d3.select("tbody").selectAll("tr").remove();
            d3.select("thead").selectAll("tr").remove();

            // Table Header
            d3.select("thead").append('tr')
                .attr("class", "table-heading")
                .selectAll("th")
                .data(PipelinesController.jsonToArray(data[0]))
                .enter()
                .append("th")
                .text((d) => d[0]);

            // Table Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr")

            // Table Cells
            let td = tr.selectAll("td")
                .data(d => PipelinesController.jsonToArray(d))
                .enter().append("td")

            // Select Dataset Column, create a link & append text to td
            td.filter((d, i) => d[0] === "Pipeline" || d[0] === "Period").text((d) => d[1]);

            // Filter Dataset column from columns & append text to td
            // td.filter((d, i) => d[0] !== "Pipeline" && d[0] !== "Period").text(d => fullDateFormat(d[1]));
            td.filter((d, i) => d[0] !== "Pipeline" && d[0] !== "Period").text(d => {
                if (d[1] != "-") {
                    return fullDateFormat(d[1])
                } else {
                    return d[1]
                }
            });
        }
    }

    static jsonKeyValueToArray(k, v) {
        return [k, v];
    }

    static jsonToArray(json) {
        let arr = [];
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                arr.push(PipelinesController.jsonKeyValueToArray(key, json[key]));
            }
        }
        return arr;
    }
}
