import { AreaChart } from "../libs/area_chart.js";

export class SystemsGraphsController {
    static updateGraphs(data) {
        if (Object.keys(data).length == 0) {
            import ('./ui_controller.js').then((module) => {
                module.UIController.showNoDataAlert("Miranda not in operation");
            });
            return false;
        }
        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // Draw disk utilization graph
        let diskUsageChartData = JSON.parse(JSON.stringify(data));
        diskUsageChartData.forEach((d) => {
            d.datetime = new Date(d.datetime);
            d.value = +d.disk_usage.used;
        });

        let diskUsageChartConfig = {
            appendGBToTooltipText: true,
            watchOutage: true,
            adjustSysMetricsGridlines: true,
            formatYAxisValuesAsGB: true,
            addMetricsLegend: true,
        };

        const diskUsageChart = new AreaChart({
            element: document.querySelector(".disc-usage-chart"),
            data: diskUsageChartData,
        });
        diskUsageChart
            .setId("disk")
            .setTitle("Disk Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("Disk Usage (GB)")
            .setColorScheme("#0E86D4")
            .setYLimit(diskUsageChartData[0].disk_usage.total)
            .setConfig(diskUsageChartConfig)
            .draw();

        // Draw memory utilization graph
        let memoryUsageChartData = JSON.parse(JSON.stringify(data));
        memoryUsageChartData.forEach((d) => {
            d.datetime = new Date(d.datetime);
            d.value = +d.memory_usage.used;
        });

        let memoryUsageChartConfig = {
            appendGBToTooltipText: true,
            watchOutage: true,
            adjustSysMetricsGridlines: true,
            formatYAxisValuesAsGB: true,
            addMetricsLegend: true,
        };

        const memoryUsageChart = new AreaChart({
            element: document.querySelector(".memory-utilization-chart"),
            data: memoryUsageChartData,
        });
        memoryUsageChart
            .setId("memory")
            .setTitle("Memory Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("Memoru Utilization (GB)")
            .setColorScheme("#000080")
            .setYLimit(memoryUsageChartData[0].memory_usage.total)
            .setConfig(memoryUsageChartConfig)
            .draw();

        // Draw cpu utilization graph
        let cpuUsageChartData = JSON.parse(JSON.stringify(data));
        cpuUsageChartData.forEach((d) => {
            d.datetime = new Date(d.datetime);
            d.value = +d.cpu_percent;
        });

        let cpuUsageChartConfig = {
            appendPercentageToTooltipText: true,
            watchOutage: true,
            adjustSysMetricsGridlines: true,
            addMetricsLegend: true,
        };

        const cpuUsageChart = new AreaChart({
            element: document.querySelector(".cpu-utilization-chart"),
            data: cpuUsageChartData,
        });
        cpuUsageChart
            .setId("cpu")
            .setTitle("CPU Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("CPU Utilization (%)")
            .setColorScheme("#0000CD")
            .setYLimit(100)
            .setConfig(cpuUsageChartConfig)
            .draw();

        let fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        // Update timestamp of update and reset formatting
        let lastUpdateTimeStamp = new Date(
            Math.max.apply(
                null,
                data.map((d) => new Date(d.datetime))
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
