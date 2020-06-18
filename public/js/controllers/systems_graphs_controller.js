import { AreaChart } from "../libs/area_chart.js";

export class SystemsGraphsController {
    static updateGraphs(data) {
        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // Draw disk utilization graph
        let diskUsageChartData = JSON.parse(JSON.stringify(data));
        diskUsageChartData.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            d.value = +d.disk_usage.used;
        })

        const diskUsageChart = new AreaChart(
            {element: document.querySelector('.disc-usage-chart'), data: diskUsageChartData });
        diskUsageChart
            .setId("disk")
            .setTitle("Disk Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("Disk Usage (GB)")
            .setColorScheme("#0E86D4")
            .setYLimit(diskUsageChartData[0].disk_usage.total)
            .setFeatureInAnalysis("system-metrics")
            .draw();

        // Draw memory utilization graph  
        let memoryUsageChartData = JSON.parse(JSON.stringify(data));
        memoryUsageChartData.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            d.value = +d.memory_usage.used;
        })

        const area2 = new AreaChart(
            {element: document.querySelector('.memory-utilization-chart'), data: memoryUsageChartData });
        area2
            .setId("memory")
            .setTitle("Memory Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("Memoru Utilization (GB)")
            .setColorScheme("#000080")
            .setYLimit(memoryUsageChartData[0].memory_usage.total)
            .setFeatureInAnalysis("system-metrics")
            .draw();

        // Draw cpu utilization graph 
        let cpuUsageChartData = JSON.parse(JSON.stringify(data));
        cpuUsageChartData.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            d.value = +d.cpu_percent;
        })

        const area = new AreaChart(
            {element: document.querySelector('.cpu-utilization-chart'), data: cpuUsageChartData });
        area
            .setId("cpu")
            .setTitle("CPU Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("CPU Utilization (%)")
            .setColorScheme("#0000CD")
            .setYLimit(100)
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
        if (SystemsGraphsController.lastUpdateTimer) {
            clearInterval(SystemsGraphsController.lastUpdateTimer);
        }
        SystemsGraphsController.lastUpdateTimer = setInterval(setLastUpdatedAlert, 1000);
    }

    static clearTimers() {
        if (SystemsGraphsController.lastUpdateTimer) {
            clearInterval(SystemsGraphsController.lastUpdateTimer);
            SystemsGraphsController.lastUpdateTimer = null;
        }
    }
}
