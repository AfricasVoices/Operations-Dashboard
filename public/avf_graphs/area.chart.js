import { GraphLayout } from "./graph.layout.js";

export class AreaChart extends GraphLayout {
    
    constructor(opts) {
        // load in arguments from config object
        super(opts.element)
        this.data = opts.data;
        this.id = "id";
        this.color = "red";
        this.title = "Area Chart";
        this.xAxisLabel = "X Axis";
        this.yAxisLabel = "Y Axis";

        this.draw()
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    setXAxisLabel(xAxis) {
        this.xAxisLabel = xAxis;
        return this;
    }

    setYAxisLabel(yAxis) {
        this.yAxisLabel = yAxis;
        return this;
    }

    setId(id) {
        this.id = id;
        return this;
    }

    setColor(color) {
        this.color = color;
        return this;
    }

    draw() {
        let vis = this;
        vis.layout()
        // create the other stuff
        vis.createScales();
        vis.addAxes();
        vis.addArea();
        vis.addLabels()
    }

    createScales() {
        let vis = this
        // calculate max and min for data
        const xExtent = d3.extent(vis.data, d => new Date(d.date));
        const yExtent = d3.extent(vis.data, d => +d.value);

        // force zero baseline if all data points are positive
        if (yExtent[0] > 0) { yExtent[0] = 0; };

        vis.xScale = d3.scaleTime()
            .range([1, vis.width])
            .domain(xExtent);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .domain(yExtent);
    }

    addAxes() {
        // create and append axis elements
        // this is all pretty straightforward D3 stuff
        const xAxis = d3.axisBottom(this.xScale)

        const yAxis = d3.axisLeft(this.yScale)
            // .scale(this.yScale)
            // .tickFormat(d3.format("d"));

        this.xAxis = this.plot.append("g")
            .attr("class", `${this.id}XAxis`)
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxis);

        // Rotate axis ticks
        this.plot.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        this.plot.append("g")
            .attr("class", `${this.id}YAxis`)
            .call(yAxis)

        this.addGridlines()
    }

    addGridlines() {
        // Add the Y gridlines
        this.plot.append("g")			
        .attr("class", `${this.id}Grid`)
        .call(d3.axisLeft(this.yScale)
            .tickSize(-this.width)
            .tickFormat("")
        )

        // Add the X gridlines
        this.plot.append("g")
        .attr("class", `${this.id}XGrid`)		
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3.axisBottom(this.xScale)
            .tickSize(-this.height)
            .tickFormat("")
        )
    } 

    prepareTooltip() {
        // Prep the tooltip bits, initial display is hidden
        this.tooltip = this.plot.append("g")
            .attr("class", `${this.id}Tooltip`)
            .style("opacity", 1.0)
            .style("display", "none");

        this.tooltip.append("rect")
            .attr("width", 150)
            .attr("height", 20)
            .attr("fill", "white")
            .style("opacity", 1.0);

        this.tooltip.append("text")
            .attr("x", 75)
            .attr("dy", "1.2em")
            .style("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");
    }

    addArea() {
        // Add a clipPath: everything out of this area won't be drawn.
        var clip = this.plot.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", this.width )
            .attr("height", this.height )
            .attr("x", 0)
            .attr("y", 0);

        // Create the area variable: where both the area and the brush take place
        this.area = this.plot.append('g').attr("clip-path", "url(#clip)")

        // Add brushing
        this.brush = d3.brushX()                   // Add the brush feature using the d3.brush function
            .extent( [ [0,0], [this.width, this.height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", this.updateChart.bind(this))

        this.areaGenerator = d3.area()
            .x(d => this.xScale(new Date(d.date)))
            .y0(this.yScale(0))
            .y1(d => this.yScale(d.value))

        // Add the brushing
        this.area.append("g").attr("class", `${this.id}Brush`).call(this.brush);

        this.area.append("path")
            .datum(this.data)
            .classed('area',true)
            .attr("fill", this.color)
            .attr("fill-opacity", .6)
            .attr("stroke", this.color)
            .attr("stroke-width", 0.1)
            .attr("d", this.areaGenerator)
            .on("mouseover", () => {
                this.tooltip.style("display", null);
            })
            .on("mouseout", () => {
                this.tooltip.style("display", "none");
            })
            .on("mousemove", (d, i, n) => {
                var xPosition = d3.mouse(n[i])[0] - 15;//x position of tooltip
                var yPosition = d3.mouse(n[i])[1] - 25;//y position of tooltip
                this.tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");//placing the tooltip
                var x0 = this.xScale.invert(d3.mouse(n[i])[0]);//this will give the x for the mouse position on x
                var y0 = this.yScale.invert(d3.mouse(n[i])[1]);//this will give the y for the mouse position on y
                this.tooltip.select("text").text(`${d3.timeFormat('%Y-%m-%d')(x0)} Used: ${+Math.round(y0)} %`);//show the text after formatting the date
            });;

            this.prepareTooltip();
    }

    updateChart() {
        // A function that set idleTimeOut to null
        var idleTimeout
        // A function that set idleTimeOut to null
        function idled() { idleTimeout = null; }
        // What are the selected boundaries?
        this.extent = d3.event.selection
  
        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!this.extent) {
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            this.xScale.domain([ 4,8])
        } else {
            this.xScale.domain([ this.xScale.invert(this.extent[0]), this.xScale.invert(this.extent[1]) ])
            this.area.select(`.${this.id}Brush`).call(this.brush.move, null) // This remove the grey brush area as soon as the selection has been done
        }
        this.zoomChart()

        // If user double click, reinitialize the chart
        this.plot.on("dblclick", () => {
            this.xScale.domain(d3.extent(this.data, function(d) { return new Date(d.date); }))
            this.zoomChart()
        });
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

}
