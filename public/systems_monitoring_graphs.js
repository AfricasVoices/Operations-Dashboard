import { AreaChart } from "./avf_graphs/area.chart.js";
// import { StackedAreaChart } from "./avf_graphs/stacked_area.chart.js";

export class SystemGraphsController {
    static updateGraphs(data) {
        
        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

/*                         C P U  UTILIZATION GRAPH  
/*      ==================================================================
*/      let data2 = JSON.parse(JSON.stringify(data));
        data2.forEach(function(d) {
            d.date = new Date(d.datetime);
            d.datetime = new Date(d.datetime);
            d.value = +d.cpu_percent;
        })

        const area = new AreaChart({element: document.querySelector('.chart3'), data: data2 });
        area
            .setId("cpu")
            .setTitle("CPU Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("CPU Utilization (%)")
            .setColorScheme("#0000CD")
            .setYLimit(100)
            .draw();

/*                         MEMORY  UTILIZATION GRAPH  
/*       ==================================================================
*/      let db = JSON.parse(JSON.stringify(data));
        db.forEach(function(d) {
            d.date = new Date(d.datetime);
            d.datetime = new Date(d.datetime);
            d.value = +d.memory_usage.used;
        })

        const area2 = new AreaChart({element: document.querySelector('.chart2'), data: db });
        area2
            .setId("memory")
            .setTitle("Memory Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("Memoru Utilization (%)")
            .setColorScheme("#000080")
            .setYLimit(db[0].memory_usage.total)
            .draw();

/*                         DISK UTILIZATION GRAPH
/*        ==================================================================
*/      let db2 = JSON.parse(JSON.stringify(data));
        db2.forEach(function(d) {
            d.date = new Date(d.datetime);
            d.datetime = new Date(d.datetime);
            d.value = +d.disk_usage.used;
        })

        const area3 = new AreaChart({element: document.querySelector('.chart'), data: db2 });
        area3
            .setId("disk")
            .setTitle("Disk Utilization")
            .setXAxisLabel("Date (dd:hh:m)")
            .setYAxisLabel("Disk Usage (GB)")
            .setColorScheme("#0E86D4")
            .setYLimit(db2[0].disk_usage.total)
            .draw();
// let db2 = JSON.parse(JSON.stringify(data));
//             db2.forEach(function(d) {
//                 d.date = new Date(d.datetime);
//             })

//             let diskMetrics = ["used", "free"]
//             // Create keys to stack
//             let diskKeys = [],
//             diskStr = ""

//             for (let i = 0; i < diskMetrics.length; i++) {
//                 diskStr =  "disk_" + diskMetrics[i];
//                 diskKeys.push(diskStr);
//             }

//             let keys = diskKeys;

//             let colorsScheme = ["#0E86D4", "#bdefbd"]
//             // color palette
//             let color = d3.scaleOrdinal().domain(keys).range(colorsScheme);

//             //stack the data
//             let stackDisk = d3.stack().keys(keys),
//                     stackedData = stackDisk(db2);

            // const stackedArea = new StackedAreaChart({ element: document.querySelector('.chart'), data: db2 });
            // stackedArea
            //     .setKeys(keys)
            //     .setStackedData(stackedData)
            //     .setId("disk")
            //     .setTitle("Disk Utilization")
            //     .setXAxisLabel("Date (dd:hh:m)")
            //     .setYAxisLabel("Disk Utilization (%)")
            //     .setColorScheme(color)
            //     .draw();
    }  
}
