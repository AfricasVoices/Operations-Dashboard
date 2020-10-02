import { GraphLayout } from "./graph_layout.js";

export class BarChart extends GraphLayout {
    constructor(opts) {
        // Load in arguments from config object
        super(opts.element);
        this.data = opts.data;
        this.id = "id";
        this.color = "red";
        this.title = "Bar Chart";
        this.xAxisLabel = "X Axis";
        this.yAxisLabel = "Y Axis";
        this.config = {
            // Failed Messages Graph Configuration
            setFailedMsgGraphTooltipText: false,
        };

        this.draw();
    }

    draw() {
        this.layout();
        this.createScales();
        this.addGridlines();
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
        const xExtent = d3.extent(this.data, (d) => new Date(d.datetime));
        if (this.xLimit) { xExtent[1] = this.xLimit; }
        const yExtent = this.yLimit ? [0, this.yLimit] : d3.extent(this.data, (d) => +d.value);

        // Force zero baseline if all data points are positive
        if (yExtent[0] > 0) yExtent[0] = 0;

        this.xScale = d3.scaleTime().range([1, this.width]).domain(xExtent);
        this.yScale = d3.scaleLinear().range([this.height, 0]);

        // Set y axis domain if y extent is above zero
        if (yExtent[1] > 0) this.yScale.domain(yExtent);
    }

    addAxes() {
        // create and append axis elements
        const xAxis = d3.axisBottom(this.xScale);
        if (this.tickFormat) xAxis.tickFormat(this.tickFormat);
        if (this.tickValuesForXAxis) xAxis.tickValues(this.tickValuesForXAxis);
        this.xAxis = this.plot
            .append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxis);
        // Rotate axis ticks
        this.plot
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        const yAxis = d3.axisLeft(this.yScale);
        this.plot.append("g").attr("class", "y axis").call(yAxis);
    }

    addGridlines() {
        // Add the Y gridlines
        this.plot
            .append("g")
            .attr("id", this.gridLinesId)
            .call(d3.axisLeft(this.yScale).tickSize(-this.width).tickFormat(""));

        let xGridlinesAttributes = d3.axisBottom(this.xScale).tickSize(-this.height).tickFormat("");
        if (this.tickValuesForXAxis) {
            xGridlinesAttributes = d3
                .axisBottom(this.xScale)
                .tickValues(this.tickValuesForXAxis)
                .tickSize(-this.height)
                .tickFormat("");
        }

        // Add the X gridlines
        this.plot
            .append("g")
            .attr("id", this.gridLinesId)
            .attr("transform", "translate(0," + this.height + ")")
            .call(xGridlinesAttributes);
    }

    addBars() {
        // Values to adjust x and width attributes
        if (!this.rightPadding) this.rightPadding = 0;
        if (!this.shiftBarsToRight) this.shiftBarsToRight = 0;

        // Create bars
        this.plot
            .selectAll("rect")
            .data(this.data)
            .enter()
            .append("rect")
            .attr("class", this.barChartId)
            /* Shift bars to the right 
                - prevents first bar of graph from overlapping y axis path */
            .attr("x", (d) => this.xScale(new Date(d.datetime)) + this.shiftBarsToRight)
            .attr("y", (d) => this.yScale(d.value))
            .attr("height", (d) => this.height - this.yScale(d.value))
            .attr("fill", this.color)
            /* Reduce the right padding of bars 
                - Accomodates the shift of the bars to the right so that they don't overlap */
            .attr("width", this.width / Object.keys(this.data).length + this.rightPadding);

        this.addTooltip();
    }

    setFailedMsgGraphTooltipText(d) {
        let totalFiledMessages = d.value,
            // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
            tooltipContent = `<div>${totalFiledMessages} Failed
            Message${totalFiledMessages !== 1 ? "s" : ""} </div>`;
        return tooltipContent;
    }

    addTooltip() {
        // Add tooltip for the total failed sms graph
        const tip = d3
            .select("body")
            .append("div")
            .attr("class", "card")
            .style("padding", "4px") // Add some padding so the tooltip content doesn't touch the border of the tooltip
            .style("position", "absolute") // Absolutely position the tooltip to the body. Later we'll use transform to adjust the position of the tooltip
            .style("left", 0)
            .style("top", 0)
            .style("background", "whitesmoke")
            .style("border-radius", "8px")
            .style("visibility", "hidden");
        this.plot
            .selectAll("rect")
            .on("mouseover", (event, d) => {
                let barColor = d3.select(event.currentTarget).style("fill");
                let tooltipContent = d.value;
                if (this.config.setFailedMsgGraphTooltipText) {
                    tooltipContent = this.setFailedMsgGraphTooltipText(d);
                }
                tip.html(tooltipContent)
                    .style("color", barColor)
                    .style("font-size", "12px")
                    .style("font-weight", "600")
                    .style("font-family", "'Montserrat', sans-serif")
                    .style("box-shadow", `2px 2px 4px -1px ${barColor}`)
                    .style("visibility", "visible");
                d3.select(event.currentTarget).transition().duration(10).attr("opacity", 0.8);
            })
            .on("mouseout", (event, d) => {
                tip.style("visibility", "hidden");
                d3.select(event.currentTarget).transition().duration(10).attr("opacity", 1);
            })
            .on("mousemove", (event, d) => {
                tip.style("transform", `translate(${event.pageX}px, ${event.pageY - 40}px)`); // We can calculate the mouse's position relative the whole page by using event.pageX and event.pageY.
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
            .labels([this.legendLabel]);

        legend.call(legendSettings);
    }
}
