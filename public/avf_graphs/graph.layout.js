export class GraphLayout {
    constructor(el) {
        this.element = el;
    }

    layout() {
        let vis = this;
        // define width, height and margin
        vis.margin = {
            top: 40,
            right: 100,
            bottom: 105,
            left: 70
        };
        vis.width = 960 - vis.margin.left - vis.margin.right;
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

        // set up parent element and SVG
        vis.element.innerHTML = '';
        const svg = d3.select(vis.element).append('svg');
        svg.attr('width',  vis.width + vis.margin.left + vis.margin.right);
        svg.attr('height', vis.height +  vis.margin.top + vis.margin.bottom);

        // we'll actually be appending to a <g> element
        vis.plot = svg.append('g')
            .attr('transform',`translate(${vis.margin.left},${vis.margin.top})`);
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
}
