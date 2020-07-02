import { GraphLayout } from "./graph_layout.js";

export class BarChart extends GraphLayout {
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
        const xExtent = d3.range(this.data.length);
        const yExtent = [0, d3.max( this.data, function(d){ return d.pigeons + d.doves + d.eagles;})];

        // force zero baseline if all data points are positive
        if (yExtent[0] > 0) { yExtent[0] = 0; };

        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .paddingInner(0.05)
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
        // Groups
        let groups = this.plot.selectAll(".layers")
            .attr("class", "layers")
            .data( this.stackedData )
            .enter()
            .append( 'g' )
            .style( 'fill', ( d, i ) => this.color( i ));

        // Rectangles
        groups.selectAll( 'rect' )
            .data( d => d)
            .enter()
            .append("rect")
            .attr("x", (d, i) =>  this.xScale(i))
            .attr("y", d => this.yScale(d[1]))
            .attr("height", d => this.yScale(d[0]) - this.yScale(d[1]))
            .attr("width", this.xScale.bandwidth());
    }

}
