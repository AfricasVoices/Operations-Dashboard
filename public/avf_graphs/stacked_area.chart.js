import { GraphLayout } from "./graph.layout.js";

export class StackedAreaChart extends GraphLayout {

    constructor(opts) {
        super(opts.element)
        // load in arguments from config object
        this.data = opts.data;
        this.stackedData = opts.stackedData;
        this.color = opts.color;
        // this.keys = opts.keys; 
        // this.element = opts.element;
        // create the chart
        this.draw();
    }

    draw() {
        let vis = this;
        vis.layout()
        // create the other stuff
        vis.createScales();
        vis.addAxes();
        vis.addArea();
    }

    createScales() {
        let vis = this;
        // calculate max and min for data
        const xExtent = d3.extent(vis.data, d => d.year);
        const yExtent = [0, 200000];

        // force zero baseline if all data points are positive
        if (yExtent[0] > 0) { yExtent[0] = 0; };

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])
            .domain(xExtent);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .domain(yExtent);
    }

    addAxes() {
        // create and append axis elements
        // this is all pretty straightforward D3 stuff
        const xAxis = d3.axisBottom(this.xScale)
        const yAxis = d3.axisLeft(this.yScale).ticks(5)

        this.xAxis = this.plot.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxis);

        // Rotate axis ticks
        this.plot.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        this.plot.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        this.addGridlines()
    }

    addGridlines() {
        // Add the Y gridlines
        this.plot.append("g")			
        .attr("class", "memoryGrid")
        .call(d3.axisLeft(this.yScale)
            .tickSize(-this.width)
            .tickFormat("")
        )

        // Add the X gridlines
        this.plot.append("g")			
        .attr("class", "memoryXGrid")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3.axisBottom(this.xScale)
            .tickSize(-this.height)
            .tickFormat("")
        )
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
            .x(d => this.xScale(d.data.year))
            .y0(d => this.yScale(d[0]))
            .y1(d => this.yScale(d[1]))

        this.area
            .selectAll("mylayers")
            .data(this.stackedData)
            .enter()
            .append("path")
            .attr("fill-opacity", .3)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("class", d => "myArea " + d.key)
            .style("fill", d => this.color(d.key))
            .attr("d", this.areaGenerator)

        // Add the brushing
        this.area.append("g").attr("class", "brush").call(this.brush);
    }
    
    idleTimeout;
    // A function that set idleTimeOut to null
    idled = () => { this.idleTimeout = null; }

    updateChart() {
        // A function that set idleTimeOut to null
        // var idleTimeout
        // // A function that set idleTimeOut to null
        // function idled() { idleTimeout = null; }
        // What are the selected boundaries?
        this.extent = d3.event.selection
  
        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!this.extent) {
            if (!this.idleTimeout) return this.idleTimeout = setTimeout(this.idled, 350); // This allows to wait a little bit
            this.xScale.domain(d3.extent(this.data, d => d.year))
        } else {
            this.xScale.domain([ this.xScale.invert(this.extent[0]), this.xScale.invert(this.extent[1]) ])
            this.area.select(".brush").call(this.brush.move, null) // This remove the grey brush area as soon as the selection has been done
        }
  
        // Update axis and area position
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.xScale).ticks(5))
        this.area
            .selectAll("path")
            .transition().duration(1000)
            .attr("d", this.areaGenerator)

         // If user double click, reinitialize the chart
        //  this.area.on("dblclick", () => {
        //     this.xScale.domain(d3.extent(this.data, function(d) { return d.year }))
        //     this.xAxis.transition().call(d3.axisBottom(this.xScale))
        //     this.area
        //     .select('path')
        //     .transition()
        //     .attr("d", this.areaGenerator);
        // });
    }
}
