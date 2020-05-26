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
}
