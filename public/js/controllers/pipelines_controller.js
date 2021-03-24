export class PipelinesController {
    static updatePipelinePage(pipelineMetrics) {
        // Group pipeline metrics by pipeline name
        let metricsByPipeline = d3.group(pipelineMetrics, (d) => d.pipeline_name);

        // Generate data for pipeline progress table
        let pipelineProgressTableData = [];
        for (let [key, value] of metricsByPipeline.entries()) {
            let pipelineProgress = {};
            pipelineProgress["Pipeline"] = key;
            // Sort pipeline metrics in a descending order
            value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            pipelineProgress["Last Start Time"] = value.find(
                (d) => d.event == "PipelineRunStart"
            ).timestamp;

            // Group pipeline metrics by run id
            let metricsByRunId = d3.group(value, (d) => d.run_id);

            pipelineProgress["Last Successful Run"] = "-";
            for (let value of metricsByRunId.values()) {
                let eventsInOneRun = value.map((d) => d.event);
                if (eventsInOneRun.includes("PipelineRunEnd")) {
                    pipelineProgress["Last Successful Run"] = value.find(
                        (d) => d.event == "PipelineRunEnd"
                    ).timestamp;
                    break;
                }
            }
            pipelineProgressTableData.push(pipelineProgress);
        }
        PipelinesController.updatePipelineProgressTable(pipelineProgressTableData);
        // TODO: Update pipeline monitoring graphs.
    }

    static updateGraphs() {
        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // Set the dimensions and margins of the graph
        const Margin = { top: 40, right: 100, bottom: 105, left: 70 },
            Width = 960 - Margin.right - Margin.left,
            Height = 500 - Margin.top - Margin.bottom;

        // Append the svg object to the body of the page
        const svg = d3.select(".line-chart").append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "-95 -40 1080 500")
            .attr("preserveAspectRatio", "xMinYMin")
            .append("g");

        // Add X axis
        const x = d3.scaleTime().range([0, Width]);
    }

    static updatePipelineProgressTable(data) {
        transform();

        // Function used to generate pipeline progress table
        function transform() {
            d3.select("tbody").selectAll("tr").remove();
            d3.select("thead").selectAll("tr").remove();

            // Table Header
            d3.select("thead").append('tr')
                .attr("class", "table-heading")
                .selectAll("th")
                .data(PipelinesController.jsonToArray(data[0]))
                .enter()
                .append("th")
                .text((d) => d[0]);
            
            // Table Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr");
            
            // Table Cells
            let td = tr.selectAll("td")
                .data(d => PipelinesController.jsonToArray(d))
                .enter().append("td");
            
            td.filter((d, i) => d[0] === "Pipeline").text((d) => d[1]);

            let fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
            td.filter((d, i) => d[0] !== "Pipeline").text(d => {
                if (d[1] !== "-") d[1] = fullDateFormat(d[1]);
                return d[1];
            }).style("text-align", "center");
        }

    }

    static jsonKeyValueToArray(k, v) {
        return [k, v];
    }

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