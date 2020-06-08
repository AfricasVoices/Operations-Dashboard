import { GraphLayout } from "./graph.layout.js";

export class AreaChart extends GraphLayout {

    constructor(opts) {
        // Load in arguments from config object
        super(opts.element)
        this.data = opts.data;
        this.id = "id";
        this.color = "red";
        this.title = "Area Chart";
        this.xAxisLabel = "X Axis";
        this.yAxisLabel = "Y Axis";

        this.draw()
    }

    draw() {
        this.layout();
        this.createScales();
        this.addAxes();
        this.addArea();
        this.addLabels();
    }

    createScales() {
        // Calculate max and min for data
        const xExtent = d3.extent(this.data, d => new Date(d.date));
        const yExtent = d3.extent(this.data, d => +d.value);

        // Force zero baseline if all data points are positive
        if (yExtent[0] > 0) { yExtent[0] = 0; };

        this.xScale = d3.scaleTime()
            .range([1, this.width])
            .domain(xExtent);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0])
            .domain(yExtent);
    }

    addAxes() {
        // Create and append axis elements
        const xAxis = d3.axisBottom(this.xScale);
        const yAxis = d3.axisLeft(this.yScale);

        this.xAxis = this.plot.append("g")
            .attr("class", `${this.id}XAxis`)
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxis);

        // Rotate x axis ticks
        this.plot.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        this.plot.append("g")
            .attr("class", `${this.id}YAxis`)
            .call(yAxis)
    }

    addGridlines() {
        // Add the Y axis gridlines
        this.plot.append("g")			
            .attr("class", `${this.id}Grid`)
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.width)
                .tickFormat("")
            )

        // Add the X axis gridlines
        this.plot.append("g")
            .attr("class", `${this.id}XGrid`)		
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.xScale)
                .tickSize(-this.height)
                .tickFormat("")
            )
    }

    drawFocus() {    
        // Create focus object
        this.focus = this.plot.append("g")
            .attr("class", `${this.id}focus`)

        // Append circle on the line path
        this.focus.append("circle")
            .attr("r", 3.5)

        // Add background rectangle behind the text tooltip
        this.focus.append("rect")
            .attr("x", -30)
            .attr("y", "-32px")
            .attr("rx", 6)
            .attr("ry", 6)
            .attr("width", 220)
            .attr("height", 20);

        // Add text annotation for tooltip
        this.focus.append("text")
            .attr("x", -20)
            .attr("dy", "-18px")
            .attr("font-size", "12px")
            .style("fill", "#0E86D4");

        let vis = this;
        this.plot
            .on("mouseover", () => this.focus.style("display", null))
            .on("mouseout", () => this.focus.style("display", "none"))
            .on("mousemove", function() {
                vis.tipMove(this)
            });

        // Select focus objects and set opacity
        d3.selectAll(`.${this.id}focus`)
            .style("opacity", 0.9);

        // Select the circle and style it
        d3.selectAll(`.${this.id}focus circle`)
            .style("fill", this.color)
            .style("opacity", 0)

        // Select the rect and style it
        d3.selectAll(`.${this.id}focus rect`)
            .style("fill", "whitesmoke")
            .style("opacity", 0)

    }

    // Function that adds tooltip on hover
    tipMove(sel) {
        // Below code finds the date by bisecting and
        // Stores the x and y coordinate as variables
        let x0 = this.xScale.invert(d3.mouse(sel)[0]);
        // This will select the closest date on the x axiswhen a user hover over the chart
        let bisectDate = d3.bisector(function(d) {return d.datetime;}).left;
        let i = bisectDate(this.data, x0, 1);
        let d0 = this.data[i - 1];
        let d1 = this.data[i];
        let d = x0 - d0.datetime > d1.datetime - x0 ? d1 : d0;

        // Place the focus objects on the same path as the line
        this.focus.attr("transform", `translate(${this.xScale(d.datetime)}, ${this.yScale(d.value)})`); 

        let tooltipText = `${d3.timeFormat("%Y-%m-%d (%H:%M)")(d.datetime)} 
        Value: ${d3.formatPrefix(".2", d.value)(d.value)}`;

        if (this.feature == "system-metrics") {
            if (this.id == "disk" || this.id == "memory") {
                tooltipText = `${d3.timeFormat("%Y-%m-%d (%H:%M)")(d.datetime)} 
                        Used: ${d3.formatPrefix(".2", d.value)(d.value).replace("G", "GB")}`
            } 
            if (this.id == "cpu") {
                tooltipText = `${d3.timeFormat("%Y-%m-%d (%H:%M)")(d.datetime)} 
                        Used: ${d3.formatPrefix(".2", d.value)(d.value)}%`
            } 
        }

        // Position the text
        this.focus.select("text")
            .text(tooltipText)
            .transition() // slowly fade in the tooltip
                .duration(100)
                .style("opacity", 1);

        // Show the circle on the path
        this.focus.selectAll(`.${this.id}focus circle`)
            .style("opacity", 1)

        // Show the rect on the path
        d3.selectAll(`.${this.id}focus rect`)
            .style("opacity", 1)
    };

    addArea() {
        // Add a clipPath: everything out of this area won't be drawn.
        let clip = this.plot.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", this.width )
            .attr("height", this.height )
            .attr("x", 0)
            .attr("y", 0);

        // Create the area variable: where both the area and the brush take place
        this.area = this.plot.append('g').attr("clip-path", "url(#clip)")

        this.areaGenerator = d3.area()
            .x(d => this.xScale(new Date(d.date)))
            .y0(this.yScale(0))
            .y1(d => this.yScale(d.value))

        this.area.append("path")
            .datum(this.data)
            .classed('area',true)
            .attr("fill", this.color)
            .attr("fill-opacity", .6)
            .attr("stroke", this.color)
            .attr("stroke-width", 0.1)
            .attr("d", this.areaGenerator);

        // Enable brushing
        this.brush = d3.brushX()  // Add the brush feature using the d3.brush function
            .extent( [ [0,0], [this.width, this.height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", this.updateChart.bind(this))

        // Add the brushing
        this.area.append("g").attr("class", `${this.id}Brush`).call(this.brush);

        this.drawFocus();
    }
    
    // Will reset time set before subsequent brushing trigger `updateChart`
    resetIdleTimeout() { this.idleTimeout = null; }

    updateChart() {
        // What are the selected boundaries?
        this.extent = d3.event.selection
  
        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!this.extent) {
            if (!idleTimeout) return idleTimeout = setTimeout(
                this.resetIdleTimeout.bind(this), 350); // This allows to wait a little bit
                this.xScale.domain(d3.extent(this.data, d => d.datetime))
        } else {
            this.xScale.domain([ this.xScale.invert(this.extent[0]), this.xScale.invert(this.extent[1]) ])
            this.area.select(`.${this.id}Brush`).call(this.brush.move, null) // This remove the grey brush area as soon as the selection has been done
        }
        this.zoomChart()
    }

    zoomChart() {
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.xScale))
        // Rotate X axis ticks
        this.xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        this.area
            .select('.area')
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator)
        
        d3.selectAll(`.${this.id}XGrid`).remove();
        this.area.append("g")			
            .attr("class", `${this.id}XGrid`)
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.xScale)
                .tickSize(-this.height)
                .tickFormat("")
            ) 
    }

    addLabels() {
        // Graph title
        this.plot.append("text")
            .attr("x", this.width / 2)
            .attr("y", 0 - this.margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text(this.title);

        // Add X axis label
        this.plot.append("text")
            .attr("text-anchor", "end")
            .attr(
                "transform",
                "translate(" + this.width / 2 + " ," + (this.height + this.margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text(this.xAxisLabel);

        // Add Y axis label
        this.plot.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left)
            .attr("x", 0 - this.height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(this.yAxisLabel);
    }

    addMetricsLegend() {
        let keys = ["stop", "start"]
        let color = d3.scaleOrdinal().domain(keys).range(["red", "green"]);

        // Add one dot in the legend for each name.
        this.plot.selectAll("myrect")
            .data(keys)
            .enter()
            .append("rect")
                .attr("x", this.width + 10)
                .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                .attr("width", 30)
                .attr("height", 3)
                .style("fill", d => color(d))

        // Add one dot in the legend for each name.
        this.plot.selectAll("mylabels")
            .data(keys)
            .enter()
            .append("text")
                .attr("x", this.width + 45)
                .attr("y", (d,i) => 10 + i*25) // 10 is where the first dot appears. 25 is the distance between dots
                .style("fill", d => color(d))
                .text(d => d)
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
    }

    watchOutage() {
        // Get time when the system stopped & when it was restarted
        this.stop = [], this.start = []; let currentTime = new Date();
        this.data.forEach((d, i, n)=> {
            if (i == (n.length-1)) {
                let difference_minutes = (currentTime.getTime() - d.datetime.getTime()) / 60000;
                if (difference_minutes > 30) {
                    d.cpu_percent = 0;
                    d.value = 0;
                    this.stop.push(d.datetime)
                }
            } else if (i>0) {
                let difference_minutes = (d.datetime.getTime() - n[i-1].datetime.getTime()) / 60000;
                if (difference_minutes > 30) {
                    n[i-1].cpu_percent = 0;
                    d.cpu_percent = 0;
                    n[i-1].value = 0; d.value = 0;
                    this.stop.push(n[i-1].datetime)
                    this.start.push(d.datetime)
                } 
            }
        })
        
        // Add a clipPath: everything out of this area won't be drawn.
        this.plot.append("defs").append("svg:clipPath")
            .attr("id", "clip-lines")
            .append("svg:rect")
            .attr("width", this.width )
            .attr("height", this.height )
            .attr("x", 1)
            .attr("y", 0);

        this.outageLines = this.plot.append('g')
            .attr("clip-path", "url(#clip-lines)")

        // Add the outage gridlines
        this.outageLines.append("g")			
            .attr("class", `stop${this.id.charAt(0).toUpperCase()}${this.id.slice(1)}Grid`)
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.xScale)
            .tickValues(this.stop)
                .tickSize(-this.height)
                .tickFormat("")
            )

        this.outageLines.append("g")			
            .attr("class", `start${this.id.charAt(0).toUpperCase()}${this.id.slice(1)}Grid`)
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.xScale)
            .tickValues(this.start)
                .tickSize(-this.height)
                .tickFormat("")
            )
    }
}
