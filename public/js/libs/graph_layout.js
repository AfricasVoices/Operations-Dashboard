export class GraphLayout {
    constructor(element) {
        this.element = element;
    }

    layout() {
        // Define width, height and margin
        this.margin = { top: 40, right: 100, bottom: 105, left: 70 };
        this.width = 960 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;

        // Set up parent element and SVG
        this.element.innerHTML = "";
        let svgWidth = this.width + this.margin.left + this.margin.right + 120;
        let svgHeight = this.height + this.margin.top + this.margin.bottom;
        const svg = d3.select(this.element).append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .attr("preserveAspectRatio", "xMinYMin")
            .append("g");

        // We'll actually be appending to a <g> element
        this.plot = svg
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
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

    setColorScheme(color) {
        this.color = color;
        return this;
    }

    setYLimit(yLimit) {
        this.yLimit = yLimit;
        return this;
    }

    setConfig(config) {
        this.config = config;
        return this;
    }

    setTickValuesForXAxis(tickValuesForXAxis) {
        this.tickValuesForXAxis = tickValuesForXAxis;
        return this;
    }
}
