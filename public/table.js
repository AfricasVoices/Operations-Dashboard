class TableController {   
    static updateCodingProgressTable(k) {
        let data = k.data2,
        lastUpdate = k.lastUpdate; 
        // Set last updated timestamp in UI
        document.getElementById("last-update").innerText = `Last updated: ${lastUpdate}`;

        // Initial sorting state
        let sortInfo = { key: "Done", order: "ascending" };

        // Invoke `transform` function with column to be sorted on page load
        transform("Done");  

        // Function used to generate coding progress table
        function transform(attrName) {
            // Toggle sorting state
            if (sortInfo.order === "descending" && attrName === sortInfo.key)
                sortInfo.order = "ascending";
            else { sortInfo.order = "descending"; sortInfo.key = attrName }

            d3.select("tbody").selectAll("tr").remove();
        
            // Table Header
            let th = d3.select("thead").selectAll("th")
                .data(TableController.jsonToArray(data[0]))
                .enter().append("th")
                .attr("class", "table-heading")
                .on("click", (d, i, n) => transform(d[0].toString()))
                .text(d => d[0])
                
            // Table Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr")
                .sort((a, b, order = sortInfo.order) => 
                    a == null || b == null ? 0 : attrName == "Dataset" ? 
                        TableController.stringCompare(a[attrName], b[attrName], order) :
                        TableController.sortNumber(a[attrName], b[attrName], order)
                );
                
            // Table Cells
            let td = tr.selectAll("td")
                .data(d => TableController.jsonToArray(d))
                .enter().append("td")
                .on("click", (d, i, n) => transform(d[0].toString()))
            
            // Filter Dataset column from columns & append text to td
            td.filter((d, i, n) => d[0] !== "Dataset" && i !== 0).text(d => d[1])

            // Select Dataset Column, create a link & append text to td
            td.filter((d, i, n) => d[0] === "Dataset" && i === 0)
                .append("a")
                .attr("href", d => `https://web-coda.firebaseapp.com/?dataset=${d[1]}`)
                .attr("target", "_blank")
                .text(d => d[1])

            // Filter table data with column "Done"
            td.filter((d, i, n) => d[0] === "Done" && i === 3)
                .each((d, i, n) => {
                    // Select Table Row
                    let parentNode = d3.select(n[i].parentNode)
                    // Select Table Data and access data bound to the node
                    let cellData = d3.select(n[i]).data()[0][1]
                    if (parseFloat(cellData) === 0) {
                        parentNode.attr('class', "coding-notstarted");
                    } else if (parseFloat(cellData) > 0 && parseFloat(cellData) <= 25) {
                        parentNode.attr('class', "coding-below25");
                    } else if (parseFloat(cellData) > 25 && parseFloat(cellData) <= 50) {
                        parentNode.attr('class', "coding-above25");
                    } else if (parseFloat(cellData) > 50 && parseFloat(cellData) <= 75) {
                        parentNode.attr('class', "coding-above50");   
                    } else if (parseFloat(cellData) > 75 && parseFloat(cellData) < 100) {
                        parentNode.attr('class', "coding-above75");  
                    } else {
                        parentNode.attr('class', "coding-complete");
                    }
                })
        };  
    }

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

    static  jsonKeyValueToArray(k, v) {return [k, v];}

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
