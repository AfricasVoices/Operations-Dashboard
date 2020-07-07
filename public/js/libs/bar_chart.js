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
}
