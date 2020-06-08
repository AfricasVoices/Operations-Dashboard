  
import { AreaChart } from "./avf_graphs/area.chart.js";

export class SystemGraphsController {
    static updateGraphs(data) {
        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

/*                         DISK UTILIZATION GRAPH
/*      ==================================================================
*/      let diskUsageChartData = JSON.parse(JSON.stringify(data));
        diskUsageChartData.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            d.value = +d.disk_usage.used;
        })

        const area3 = new AreaChart(
            {element: document.querySelector('.disc-usage-chart'), data: diskUsageChartData });
        area3
            .setId("disk")
            .setTitle("Disk Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("Disk Usage (GB)")
            .setColorScheme("#0E86D4")
            .setYLimit(diskUsageChartData[0].disk_usage.total)
            .setFeatureInAnalysis("system-metrics")
            .draw();

        let fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        // Update timestamp of update and reset formatting
        let lastUpdateTimeStamp = new Date(
            Math.max.apply(
                null,
                data.map(d => new Date(d.datetime))
            )
        );
        lastUpdateTimeStamp.setMinutes(lastUpdateTimeStamp.getMinutes());
        lastUpdateTimeStamp = new Date(lastUpdateTimeStamp);

        d3.select("#lastUpdated")
            .classed("text-stale-info", false)
            .text(fullDateFormat(lastUpdateTimeStamp));

        function setLastUpdatedAlert() {
            // Calculate time diff bw current and lastUpdateTimeStamp
            let currentTime = new Date(),
                difference_minutes = (currentTime.getTime() - lastUpdateTimeStamp.getTime()) / 60000;
            if (difference_minutes > 30) {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", true);
            } else {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", false);
            }
        }
        if (SystemGraphsController.lastUpdateTimer) {
            clearInterval(SystemGraphsController.lastUpdateTimer);
        }
        SystemGraphsController.lastUpdateTimer = setInterval(setLastUpdatedAlert, 1000);
    }

    static clearTimers() {
        if (SystemGraphsController.lastUpdateTimer) {
            clearInterval(SystemGraphsController.lastUpdateTimer);
            SystemGraphsController.lastUpdateTimer = null;
        }
    }
}
