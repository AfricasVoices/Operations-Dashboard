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
        let clip = this.plot.append("defs").append("svg:clipPath")
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
                let xPosition = d3.mouse(n[i])[0] - 15;//x position of tooltip
                let yPosition = d3.mouse(n[i])[1] - 25;//y position of tooltip
                this.tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");//placing the tooltip
                let x0 = this.xScale.invert(d3.mouse(n[i])[0]);//n[i] will give the x for the mouse position on x
                let y0 = this.yScale.invert(d3.mouse(n[i])[1]);//n[i] will give the y for the mouse position on y
                this.tooltip.select("text").text(`${d3.timeFormat('%Y-%m-%d')(x0)} Used: ${+Math.round(y0)} %`);//show the text after formatting the date
            });;

        this.prepareTooltip();
    }
}
