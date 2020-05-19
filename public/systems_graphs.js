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

            let colors = ["#228B22", "#fbdb9c"]
            // color palette
            let color = d3.scaleOrdinal().domain(diskMetrics).range(colors);

            let stackDisk = d3.stack().keys(diskKeys),
                diskDataStacked = stackDisk(data);

            let svg = d3.select(".chart")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform", "translate(" + Margin.left + "," + Margin.top + ")");

            // Add X axis
            let x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.datetime))).range([0, Width]);
            let xAxis = svg.append("g")
                 .attr("transform", "translate(0," + Height + ")")
                 .call(d3.axisBottom(x).tickFormat(dayTimeFormat))
            
            // Rotate X axis ticks
            xAxis.selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label
            svg.append("text")
                .attr("text-anchor", "end")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (dd HH:mm)");
 
        }

        function plotMemoryMetrics(data) {}

        function plotCPUMetrics(data) {}

    }
}
