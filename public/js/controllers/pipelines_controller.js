export class PipelinesController {
    static updatePipelinePage() {
        PipelinesController.updateGraphs()
        PipelinesController.updatePipelineProgressTable();
    }

    static updateGraphs() {

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
