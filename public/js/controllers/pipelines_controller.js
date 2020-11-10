export class PipelinesController {
    static updatePipelinePage(data) {
        PipelinesController.updateGraphs(data.pipelineMetrics)
        PipelinesController.updatePipelineProgressTable(data.pipelineProgressTableData);
    }

    static updateGraphs(data) {
        console.log(data);
        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // set the dimensions and margins of the graph
        const Margin = { top: 40, right: 100, bottom: 105, left: 70 },
            Width = 960 - Margin.right - Margin.left,
            Height = 500 - Margin.top - Margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(".line-chart").append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "-95 -40 1080 500")
            .attr("preserveAspectRatio", "xMinYMin")
            .append("g");
        
        // Add X axis
        let x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.timestamp)))
            .range([0, Width]);
        svg.append("g")
            .attr("transform", "translate(0," + Height + ")")
            .call(d3.axisBottom(x))

        // Y axis
        let y = d3.scaleBand()
            .range([ 0, Height ])
            .domain(data.map(function(d) { return d.project; }))
            .padding(1);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Create Line
        let line = d3.line()
            // .defined(function(d){
            //     return d.num >= 0 && d.num <= 100;
            // })
            .x(d => x(d.timestamp))
            .y(d => y(d.project));

        // Example Blue Lines
        // svg.append("path")
        //     .datum(data)
        //     .attr( 'fill', 'none' )
        //     .attr( 'stroke', 'blue' )
        //     .attr( 'stroke-width', 10 )
        //     .attr("d", line);
        const lines = svg.selectAll("lines")
            .data(data)
            .enter()
            .append("g");

            lines.append("path")
            // .attr("class", ids) 
            // .attr("d", function(d) { return line(d.values); });
    }

    static updatePipelineProgressTable(data) {
        let fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        transform();

        // Function used to generate coding progress table
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
                .enter().append("tr")

            // Table Cells
            let td = tr.selectAll("td")
                .data(d => PipelinesController.jsonToArray(d))
                .enter().append("td")

            // Select Dataset Column, create a link & append text to td
            td.filter((d, i) => d[0] === "Pipeline" || d[0] === "Period").text((d) => d[1]);

            // Filter Dataset column from columns & append text to td
            // td.filter((d, i) => d[0] !== "Pipeline" && d[0] !== "Period").text(d => fullDateFormat(d[1]));
            td.filter((d, i) => d[0] !== "Pipeline" && d[0] !== "Period").text(d => {
                if (d[1] != "-") {
                    return fullDateFormat(d[1])
                } else {
                    return d[1]
                }
            });
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
