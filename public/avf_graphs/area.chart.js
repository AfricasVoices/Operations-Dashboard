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
}
