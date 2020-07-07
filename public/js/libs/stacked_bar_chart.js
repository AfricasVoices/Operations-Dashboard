import { GraphLayout } from "./graph_layout.js";

export class StackedBarChart extends GraphLayout {

    constructor(opts) {
        // Load in arguments from config object
        super(opts.element)
        this.data = opts.data;
        this.receivedKeys = opts.receivedKeys;
        this.legendLabel = opts.legendLabel;
        this.stackedData = opts.stackedData;
        this.id = "id";
        this.title = "Bar Chart";
        this.xAxisLabel = "X Axis";
        this.yAxisLabel = "Y Axis";
        this.config = {
            // Failed Messages Graph Configuration
            setFailedMsgGraphTooltipText: false
        }

        // this.draw()
    }

    draw() {
        this.layout();
        this.createScales();
        this.addAxes();
        this.addLabels();
        this.addLegend();
        this.addStackedBars();
    }

    // setStackedData(stackedData) {
    //     this.stackedData = stackedData;
    //     return this;
    // }

    // setKeys(receivedKeys) {
    //     this.receivedKeys = receivedKeys;
    //     return this;
    // }

    setXAxisTickFormat(tickFormat) {
        this.tickFormat = tickFormat;
        return this;
    }

    // setLegendLabel(legendLabel) {
    //     this.legendLabel = legendLabel;
    //     return this;
    // }

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

    addStackedBars() {
        // Values to adjust x and width attributes
        if (!this.rightPadding) { this.rightPadding = 0; }
        if (!this.shiftBarsToRight) { this.shiftBarsToRight = 0; }
        // Create Stacked bars
        this.receivedLayer = this.plot
            .selectAll("#receivedStack")
            .data(this.stackedData)
            .enter()
            .append("g")
            .attr("id", "receivedStack")
            .attr("class", (d, i) => this.receivedKeys[i])
            .style("fill", (d, i) => this.color(i));

        this.receivedLayer
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            /* Shift bars to the right 
                - prevents first bar of graph from overlapping y axis path */
            .attr("x", d => this.xScale(new Date(d.data.day)) + this.shiftBarsToRight)
            .attr("y", d => this.yScale(d[1]))
            .attr(
                "height",
                d => this.yScale(d[0]) - this.yScale(d[1])
            )
            /* Reduce the right padding of bars 
                - Accomodates the shift of the bars to the right so that they don't overlap */
            .attr("width", (this.width / Object.keys(this.data).length) + this.rightPadding);
       

        this.addTooltip();
    }

    addTooltip() {
        // Add tooltip for the total failed sms graph
        let tip;
        this.receivedLayer
            .selectAll("rect")
            .on("mouseover", (d, i, n) => {
                // Get key of stacked data from the selection
                let operatorNameWithMessageDirection = d3.select(n[i].parentNode).datum().key,
                    // Get operator name from the key
                    operatorName = operatorNameWithMessageDirection.replace('_received',''),
                    // Get color of hovered rect
                    operatorColor = d3.select(n[i]).style("fill");
                tip = d3.tip()
                    .attr("class", "tooltip")
                    .attr("id", "tooltip")
                    .html(d => { 
                        let receivedMessages = d.data[operatorNameWithMessageDirection],
                            totalReceivedMessages = d.data.total_received,
                            // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
                            tooltipContent = `<div>${receivedMessages} 
                            (${Math.round((receivedMessages/totalReceivedMessages)*100)}%)
                            ${operatorName.charAt(0).toUpperCase() + operatorName.slice(1)} 
                            Message${receivedMessages !== 1 ? 's': ''} </div>`;
                        return tooltipContent;
                })
                this.plot.call(tip)
                tip.show(d, n[i]).style("color", operatorColor)
            })
            .on("mouseout", (d, i, n) => {
                tip.hide(d, n[i])
            })
    }

    addLegend() {
        // d3.selectAll(".legend").remove();
        // this.legendColor = d3.scaleOrdinal([this.color]).domain([this.legendLabel]);
        let legend = this.plot
            .append("g")
            .attr("class", "legend")
            .attr(
                "transform",
                `translate(${this.width - this.margin.right + 110},${this.margin.top - 30})`
            );
        let legendSettings = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(this.color)
            .labels(this.legendLabel);

        legend.call(legendSettings);
    }

}
