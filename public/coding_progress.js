class CodingProgressTableController {
    static updateCodingProgressTable(codingProgressData) {
        let data = codingProgressData.data,
            lastUpdate = codingProgressData.lastUpdate; 

        // Set last updated timestamp in UI
        document.getElementById("last-update").innerText = `Last updated: ${lastUpdate}`;

        // Default sorting information
        if (!CodingProgressTableController.sortInfoArray)
            CodingProgressTableController.sortInfoArray = [{"column": "Done", "order": "ascending"}];

        // Latest sorting information
        let sortInfo = { ...CodingProgressTableController.sortInfoArray.slice(-1)[0] };

        // Invoke `transform` function with column to be sorted on page load
        transform(sortInfo.column);
        
        // Function used to generate coding progress table
        function transform(column, updatedSortInfo = "") {
            if (typeof updatedSortInfo === "object")
                sortInfo = updatedSortInfo;

            d3.select("tbody").selectAll("tr").remove();

            // Table Header
            d3.select("thead").selectAll("th")
                .data(CodingProgressTableController.jsonToArray(data[0]))
                .enter().append("th")
                .attr("class", "table-heading")
                .on("click", (d) => {
                    CodingProgressTableController.saveSortInfo(d[0])
                    let latestSortInfo = CodingProgressTableController.sortInfoArray.slice(-1)[0]
                    transform(d[0], latestSortInfo)
                })
                .text(d => d[0])

            // Table Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr")
                .sort((a, b, order = sortInfo.order) => a == null || b == null ? 0 : 
                    typeof a[column] === "string" && typeof b[column] === "string" ? 
                        CodingProgressTableController.stringCompare(a[column], b[column], order) :
                        CodingProgressTableController.sortNumber(a[column], b[column], order)
                );

            // Table Cells
            let td = tr.selectAll("td")
                .data(d => CodingProgressTableController.jsonToArray(d))
                .enter().append("td")
                .on("click", (d) => {
                    CodingProgressTableController.saveSortInfo(d[0])
                    let latestSortInfo = CodingProgressTableController.sortInfoArray.slice(-1)[0]
                    transform(d[0], latestSortInfo)
                });

            // Filter Dataset column from columns & append text to td
            td.filter((d, i) => d[0] !== "Dataset" && i !== 0)
            .attr('class', d => Number.isInteger(d[1]) ? "integer" : 
                Math.ceil(d[1]) === d[1] ? "float" : "dash")
            .text(d => Number.isNaN(d[1]) ? "-" : 
                    Number.isInteger(d[1]) ? ["Done", "WS %", "NC %"].includes(d[0]) ? `${d[1]}%` : d[1] :
                    ["Done", "WS %", "NC %"].includes(d[0]) ? `${d[1].toFixed(2)}%` : d[1].toFixed(2))

            // Select Dataset Column, create a link & append text to td
            td.filter((d, i) => d[0] === "Dataset" && i === 0)
                .append("a")
                .attr("href", d => `https://web-coda.firebaseapp.com/?dataset=${d[1]}`)
                .attr("target", "_blank")
                .text(d => d[1])

            // Filter table to remain with "Done" column
            td.filter((d, i) => d[0] === "Done" && i === 3)
            .each((d, i, n) => {
                // Select Table Row
                let parentNode = d3.select(n[i].parentNode)
                // Select Table Data and access data bound to the node
                let tableData = d3.select(n[i]).data()[0][1]
                if (parseFloat(tableData) === 0) {
                    parentNode.attr('class', "coding-notstarted");
                } else if (parseFloat(tableData) > 0 && parseFloat(tableData) <= 25) {
                    parentNode.attr('class', "coding-below25");
                } else if (parseFloat(tableData) > 25 && parseFloat(tableData) <= 50) {
                    parentNode.attr('class', "coding-above25");
                } else if (parseFloat(tableData) > 50 && parseFloat(tableData) <= 75) {
                    parentNode.attr('class', "coding-above50");   
                } else if (parseFloat(tableData) > 75 && parseFloat(tableData) < 100) {
                    parentNode.attr('class', "coding-above75");  
                } else {
                    parentNode.attr('class', "coding-complete");
                }
            })
        };
    };

    static saveSortInfo(column) {
        let sortInfo = {}, previousColumnSorted, previousSortOrder;
        sortInfo["column"] = column;
        previousColumnSorted = CodingProgressTableController.sortInfoArray.slice(-1)[0].column;
        previousSortOrder = CodingProgressTableController.sortInfoArray.slice(-1)[0].order;
        if (column == previousColumnSorted) {
            if (previousSortOrder == "ascending") {
                sortInfo["order"] = "descending"
            } else {
                sortInfo["order"] = "ascending"
            }
        } else {
            sortInfo["order"] = "ascending"
        }
        CodingProgressTableController.sortInfoArray.push(sortInfo);
    }

    static stringCompare(a, b, order) {
        if (order === "ascending") 
            return a.localeCompare(b, 'en', { sensitivity: 'base' });
        return b.localeCompare(a, 'en', { sensitivity: 'base' });
    };

    static sortNumber(a, b, order) {
        if (order === "ascending") 
            return a-b || isNaN(a)-isNaN(b);
        return b-a || isNaN(b)-isNaN(a);
    } 

    static jsonKeyValueToArray(k, v) {return [k, v];}

    static jsonToArray(json) {
        let arr = [];
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                arr.push(CodingProgressTableController.jsonKeyValueToArray(key, json[key]));
            }
        }
        return arr;
    };
}
