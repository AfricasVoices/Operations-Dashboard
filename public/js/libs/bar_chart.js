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
}
