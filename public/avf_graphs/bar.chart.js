import { GraphLayout } from "./graph.layout.js";

export class BarChart extends GraphLayout {

    constructor(opts) {
        super(opts.element)
        // load in arguments from config object
        this.data = opts.data;
        // create the chart
        this.draw();
    }

    draw() {

    }

    createScales() {

    }

    addAxes() {

    }

    addGridlines() {

    }

    addArea() {

    }

    updateChart() {
        
    }

}
