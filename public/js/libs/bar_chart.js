import { GraphLayout } from "./graph_layout.js";

export class BarChart extends GraphLayout {

    constructor(opts) {
        // Load in arguments from config object
        super(opts.element)
        this.data = opts.data;
        this.id = "id";
        this.color = "red";
        this.title = "Bar Chart";
        this.xAxisLabel = "X Axis";
        this.yAxisLabel = "Y Axis";

        this.draw()
    }

    draw() {
        this.layout();
        this.createScales();
        this.addAxes();
        this.addBars();
        this.addLabels();
    }

    createScales() {
        // Calculate max and min for data
        const xExtent = d3.extent(this.data, d => new Date(d.datetime));
        const yExtent = this.yLimit ? [0, this.yLimit] : d3.extent(this.data, d => +d.value);

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

        let xGridlinesAttr;
        if (this.tickValuesForXAxis) {
            xGridlinesAttr = d3.axisBottom(this.xScale)
            .tickValues(this.tickValuesForXAxis)
            .tickSize(-this.height)
            .tickFormat("")
        } else {
            xGridlinesAttr = d3.axisBottom(this.xScale)
            .tickSize(-this.height)
            .tickFormat("")
        }

        // Add the X gridlines
        this.plot.append("g")			
            .attr("class", "memoryXGrid")
            .attr("transform", "translate(0," + this.height + ")")
            .call(xGridlinesAttr)
    }

    addBars() {
        // Values to adjust x and width attributes
        let rightPadding = -2, shiftBarsToRight = 1;
        // Create bars
        this.plot
            .selectAll("rect")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("id", "failedBarChart")
            /* Shift bars to the right 
                - prevents first bar of graph from overlapping y axis path */
            .attr("x", d => this.xScale(new Date(d.datetime)) + shiftBarsToRight)
            .attr("y", d => this.yScale(d.value))
            .attr("height", d => this.height - this.yScale(d.value))
            .attr("fill", "#ff0000")
            /* Reduce the right padding of bars 
                - Accomodates the shift of the bars to the right so that they don't overlap */
            // .attr("width", (this.width / Object.keys(this.data).length) + rightPadding);
            .attr("width", (this.width / Object.keys(this.data).length));

        this.addTooltip();
    }

    addTooltip() {
        // Add tooltip for the total failed sms graph
        let tip;
        this.plot
            .selectAll("rect")
            .on("mouseover", (d, i, n) => {
                let barColor = d3.select(n[i]).style("fill");
                tip = d3.tip()
                    .attr("class", "tooltip")
                    .attr("id", "tooltip")
                    .html(d => {
                        let totalFiledMessages = d.value,
                            // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
                            tooltipContent = `<div>${totalFiledMessages} Failed
                            Message${totalFiledMessages !== 1 ? 's': ''} </div>`;
                        return tooltipContent;
                    })
                this.plot.call(tip)
                tip.show(d, n[i]).style("color", barColor)
            })
            .on("mouseout", (d, i, n) => {
                tip.hide()
            })
    }

    // addLabels() {
    //     // Graph title
    //     this.plot.append("text")
    //         .attr("x", this.width / 2)
    //         .attr("y", 0 - this.margin.top / 2)
    //         .attr("text-anchor", "middle")
    //         .style("font-size", "20px")
    //         .style("text-decoration", "bold")
    //         .text(this.title);

    //     // Add X axis label
    //     this.plot.append("text")
    //         .attr("text-anchor", "end")
    //         .attr(
    //             "transform",
    //             "translate(" + this.width / 2 + " ," + (this.height + this.margin.top + 50) + ")"
    //         )
    //         .style("text-anchor", "middle")
    //         .text(this.xAxisLabel);

    //     // Add Y axis label
    //     this.plot.append("text")
    //         .attr("transform", "rotate(-90)")
    //         .attr("y", 0 - this.margin.left)
    //         .attr("x", 0 - this.height / 2)
    //         .attr("dy", "1em")
    //         .style("text-anchor", "middle")
    //         .text(this.yAxisLabel);
    // }

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

}
