export class PipelinesController {
    static updatePipelinePage(pipelineMetrics) {
          if (Object.keys(pipelineMetrics).length == 0) {
            import ('./ui_controller.js').then((module) => {
                module.UIController.showNoDataAlert("No pipelines running");
            });
            return false;
        }
        // Group pipeline metrics by pipeline name
        let metricsByPipeline = d3.group(pipelineMetrics, (d) => d.pipeline_name);

        // Generate data for pipeline progress table
        let pipelineProgressTableData = [];
        for (const [key, value] of metricsByPipeline.entries()) {
            // Sort pipeline metrics in a descending order
            value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            let lastStartData = value.find((d) => d.event == "PipelineRunStart");
            // Group pipeline metrics by run id
            let metricsByRunId = d3.group(value, (d) => d.run_id);

            let lastSuccessfulRunData,
                pipelineRunStartEvents = 0;
            for (let value of metricsByRunId.values()) {
                let eventsInOneRun = value.map((d) => d.event);
                if (eventsInOneRun.includes("PipelineRunEnd")) {
                    lastSuccessfulRunData = value.find((d) => d.event == "PipelineRunEnd");
                    break;
                }
                if (eventsInOneRun.includes("PipelineRunStart")) {
                    pipelineRunStartEvents += 1;
                }
            }
            let pipelineRestarts = pipelineRunStartEvents - 1;

            let duration;
            if (lastSuccessfulRunData && lastStartData) {
                const hasRunSuccessfully = lastSuccessfulRunData.timestamp > lastStartData.timestamp,
                    hasSameRunId = lastSuccessfulRunData.run_id == lastStartData.run_id;
                if (hasRunSuccessfully && hasSameRunId) {
                    duration = lastSuccessfulRunData.timestamp - lastStartData.timestamp;
                }
            }

            let pipelineProgress = {};
            pipelineProgress["Pipeline"] = key;
            pipelineProgress["Last Start Time"] = !!lastStartData ? lastStartData.timestamp : "-";
            pipelineProgress["Last Successful Run"] = !!lastSuccessfulRunData ? lastSuccessfulRunData.timestamp : "-";
            pipelineProgress["Duration"] = !!duration ? duration : "-";
            pipelineProgress["Restarts"] = pipelineRestarts;
            pipelineProgressTableData.push(pipelineProgress);
        }
        PipelinesController.updatePipelineProgressTable(pipelineProgressTableData);
    }

    static updatePipelineProgressTable(data) {
        transform();

        // Function used to generate pipeline progress table
        function transform() {
            d3.select("tbody").selectAll("tr").remove();
            d3.select("thead").selectAll("tr").remove();

            // Table Header
            d3.select("thead")
                .append("tr")
                .attr("class", "table-heading")
                .selectAll("th")
                .data(PipelinesController.jsonToArray(data[0]))
                .enter()
                .append("th")
                .text((d) => d[0]);

            // Table Rows
            let tr = d3.select("tbody").selectAll("tr").data(data).enter().append("tr");

            // Table Cells
            let td = tr
                .selectAll("td")
                .data((d) => PipelinesController.jsonToArray(d))
                .enter()
                .append("td");

            td.filter((d, i) => d[0] === "Pipeline").text((d) => d[1]);

            const dateFormat = d3.timeFormat("%a %d %b  %I:%M %p");
            td.filter((d, i) => ["Last Start Time", "Last Successful Run"].includes(d[0])).text(d => {
                if (d[1] !== "-") {
                    return dateFormat(d[1]);
                }
                return d[1];
            }).style("text-align", "center");
          
            td.filter((d, i) => d[0] === "Restarts")
                .each((d, i, n) => {
                    // Select Table Row
                    let parentNode = d3.select(n[i].parentNode);
                    parentNode.style("font-size", 16);
                    // Select Table Data and access data bound to the node
                    let tableData = parseInt(d3.select(n[i]).data()[0][1]);
                    if (tableData === 0) {
                        parentNode.style("background-color", "#d6ffd9").style("line-height", 0.7);
                    } else if (tableData > 0) {
                        let opacity = tableData / 10;
                        opacity > 1 ? 1 : opacity;
                        parentNode.style("background-color", `rgb(255,0,0,${opacity})`).style("line-height", 0.8);
                    } else {
                        parentNode.style("line-height", 0.6);
                    }
                })
                .text((d) => (d[1] >= 0 ? d[1] : "-"))
                .style("text-align", "center");

            td.filter((d, i) => d[0] === "Duration")
                .text((d) => {
                    if (d[1] === "-") return d[1];
                    // Get total seconds
                    let seconds = d[1] / 1000;
                    // Calculate (and subtract) whole days
                    let days = Math.floor(seconds / 86400);
                    seconds -= days * 86400;
                    // Calculate (and subtract) whole hours
                    let hours = Math.floor(seconds / 3600) % 24;
                    seconds -= hours * 3600;
                    // Calculate (and subtract) whole minutes
                    let minutes = Math.floor(seconds / 60) % 60;
                    seconds -= minutes * 60;
                    // What's left is seconds
                    seconds = Math.floor(seconds % 60);
                    // Add leading zeroes to date
                    days = days.toString().padStart(2, "0");
                    hours = hours.toString().padStart(2, "0");
                    minutes = minutes.toString().padStart(2, "0");
                    seconds = seconds.toString().padStart(2, "0");
                    return `${days}:${hours}:${minutes}:${seconds}`;
                })
                .style("text-align", "center");
        }
    }

    static jsonKeyValueToArray = (k, v) => [k, v];

    static jsonToArray(json) {
        let arr = [];
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                arr.push(PipelinesController.jsonKeyValueToArray(key, json[key]));
            }
        }
        return arr;
    }
}
