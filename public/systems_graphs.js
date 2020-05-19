class SystemGraphsController {
    static updateGraphs(data) {

        let dayTimeFormat = d3.timeFormat("%a %d (%H:%M)");

        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // Set the dimensions and margins of the graphs
        const Margin = {top: 40, right: 100, bottom: 105, left: 70},
            Width = 960 - Margin.left - Margin.right,
            Height = 500 - Margin.top - Margin.bottom;

        function plotDiskMetrics(data) {
            let diskMetrics = ["used", "free"]
            // Create keys to stack
            let diskKeys = [],
            diskStr = ""

            for (let i = 0; i < diskMetrics.length; i++) {
                diskStr =  "disk_" + diskMetrics[i];
                diskKeys.push(diskStr);
            }
        }

        function plotMemoryMetrics(data) {}

        function plotCPUMetrics(data) {}

    }
}
