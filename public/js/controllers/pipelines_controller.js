export class PipelinesController {
    static updatePipelinePage() {
        PipelinesController.updateGraphs()
        PipelinesController.updatePipelineProgressTable();
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
