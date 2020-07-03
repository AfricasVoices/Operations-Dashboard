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
        this.addLegend();
    }

    setXAxisTickFormat(tickFormat) {
        this.tickFormat = tickFormat;
        return this;
    }

    setLegendLabel(legendLabel) {
        this.legendLabel = legendLabel;
        return this;
    }

    setGridLinesId(gridLinesId) {
        this.gridLinesId = gridLinesId;
        return this;
    }

    setBarsRightPadding(rightPadding = -2) {
        this.rightPadding = rightPadding;
        return this;
    }

    setFactorToShiftBarsToRight(shiftBarsToRight = 1) {
        this.shiftBarsToRight = shiftBarsToRight;
        return this;
    }

    setXLimitByAddingOneDayDate(xLimit) {
        this.xLimit = xLimit;
        return this;
    }

    createScales() {
        // Calculate max and min for data
        const xExtent = d3.extent(this.data, d => new Date(d.datetime));
        const yExtent = this.yLimit ? [0, this.yLimit] : d3.extent(this.data, d => +d.value);

        // Force zero baseline if all data points are positive
        if (yExtent[0] > 0) { yExtent[0] = 0; };

        if (this.xLimit) { xExtent[1] = this.xLimit; }

        this.xScale = d3.scaleTime()
            .range([1, this.width])
            .domain(xExtent);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        if (yExtent[1] > 0) { this.yScale.domain(yExtent) };
    }

    addAxes() {
        // create and append axis elements
        const xAxis = d3.axisBottom(this.xScale);
        if (this.tickFormat) { xAxis.tickFormat(this.tickFormat); }
        if (this.tickValuesForXAxis) { xAxis.tickValues(this.tickValuesForXAxis); }
        const yAxis = d3.axisLeft(this.yScale);

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

        this.addGridlines();
    }

    addGridlines() {
        // Add the Y gridlines
        this.plot.append("g")			
        .attr("id", this.gridLinesId)
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
            .attr("id", this.gridLinesId)
            .attr("transform", "translate(0," + this.height + ")")
            .call(xGridlinesAttr)
    }

    addBars() {
        // Values to adjust x and width attributes
        if (!this.rightPadding) { this.rightPadding = 0; }
        if (!this.shiftBarsToRight) { this.shiftBarsToRight = 0; }
        // Create bars
        this.plot
            .selectAll("rect")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("class", this.barChartId)
            /* Shift bars to the right 
                - prevents first bar of graph from overlapping y axis path */
            .attr("x", d => this.xScale(new Date(d.datetime)) + this.shiftBarsToRight)
            // .attr("x", d => this.xScale(new Date(d.datetime)))
            .attr("y", d => this.yScale(d.value))
            .attr("height", d => this.height - this.yScale(d.value))
            .attr("fill", this.color)
            /* Reduce the right padding of bars 
                - Accomodates the shift of the bars to the right so that they don't overlap */
            .attr("width", (this.width / Object.keys(this.data).length) + this.rightPadding);
            // .attr("width", (this.width / Object.keys(this.data).length));

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

    addLegend() {
        this.legendColor = d3.scaleOrdinal([this.color]).domain([this.legendLabel]);
        let legend = this.plot
            .append("g")
            .attr(
                "transform",
                `translate(${this.width - this.margin.right + 110},${this.margin.top - 30})`
            );
        let legendSettings = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(this.legendColor)
            .labels(["total failed"]);

        legend.call(legendSettings);
    }

}
