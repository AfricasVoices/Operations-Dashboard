class TableController {
    static updateCodingProgressTable(codaData) {
        let data = codaData.data,
            lastUpdate = codaData.lastUpdate; 

        // Set last updated timestamp in UI
        document.getElementById("last-update").innerText = `Last updated: ${lastUpdate}`;

        // Save sorting state
        let sortInfo = { column: "", order: "" };

        // Invoke `transform` function with column to be sorted on page load
        transform("Done");
        
        // Function used to generate coding progress table
        function transform(column) {
            // Toggle sorting state
            if (sortInfo.order === "descending" && column === sortInfo.column)
                sortInfo.order = "ascending";
            else { sortInfo.order = "descending"; sortInfo.column = column }

            d3.select("tbody").selectAll("tr").remove();

            // Table Header
            let th = d3.select("thead").selectAll("th")
                .data(TableController.jsonToArray(data[0]))
                .enter().append("th")
                .attr("class", "table-heading")
                .on("click", (d, i, n) => transform(d[0]))
                .text(d => d[0])

            // Table Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr")
                .sort((a, b, order = sortInfo.order) => 
                    a == null || b == null ? 0 : column == "Dataset" ? 
                        TableController.stringCompare(a[column], b[column], order) :
                        TableController.sortNumber(a[column], b[column], order)
                );

            // Table Cells
            let td = tr.selectAll("td")
                .data(d => TableController.jsonToArray(d))
                .enter().append("td")
                .on("click", (d, i, n) => transform(d[0]))
        };
    };

    static stringCompare(a, b, order) {
        if (order === "descending") 
            return a.localeCompare(b, 'en', { sensitivity: 'base' });
        return b.localeCompare(a, 'en', { sensitivity: 'base' });
    };

    static sortNumber(a,b, order) {
        if (order === "descending") 
            return a-b || isNaN(a)-isNaN(b);
        return b-a || isNaN(b)-isNaN(a);
    } 

    static jsonKeyValueToArray(k, v) {return [k, v];}

    static jsonToArray(json) {
        var arr = [];
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                arr.push(TableController.jsonKeyValueToArray(key, json[key]));
            }
        }
        return arr;
    };
}