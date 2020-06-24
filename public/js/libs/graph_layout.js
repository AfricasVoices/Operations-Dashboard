export class GraphLayout {
    constructor(element) {
        this.element = element;
    }

    layout() {
        // Define width, height and margin
        this.margin = {
            top: 40,
            right: 100,
            bottom: 105,
            left: 70
        };
        this.width = 960 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;

        // Set up parent element and SVG
        this.element.innerHTML = '';
        const svg = d3.select(this.element).append('svg');
        svg.attr('width',  this.width + this.margin.left + this.margin.right + 120);
        svg.attr('height', this.height +  this.margin.top + this.margin.bottom);

        // We'll actually be appending to a <g> element
        this.plot = svg.append('g')
            .attr('transform',`translate(${this.margin.left},${this.margin.top})`);
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
}
