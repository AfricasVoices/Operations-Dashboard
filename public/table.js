class TableController {   
    static updateCodingProgressTable(k) {
        let data = k.data2,
        lastUpdate = k.lastUpdate; 
        document.getElementById("last-update").innerText = `Last updated: ${lastUpdate}`;
        transform("Done");  

        function transform(attrName) {
            d3.select("tbody").selectAll("tr").remove();
        
            // Header
            let th = d3.select("thead").selectAll("th")
                .data(TableController.jsonToArray(data[0]))
                .enter().append("th")
                .attr("class", "table-heading")
                .on("click", (d, i, n) => transform(d[0].toString()))
                .text(d => d[0]);
        
            // Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr")
                .sort((a, b) => a == null || b == null ? 0 : 
                    // d3.ascending(a[attrName], b[attrName]));
                    TableController.sortNumber(a[attrName], b[attrName]));
        
            // Cells
            let td = tr.selectAll("td")
                .data(d => TableController.jsonToArray(d))
                .enter().append("td")
                .on("click", (d, i, n) => transform(d[0].toString()))
            
            td.filter((d, i, n) => d[0] !== "Dataset" && i !== 0).text(d => d[1])

            td.filter((d, i, n) => d[0] === "Dataset" && i === 0)
                .append("a")
                .attr("href", d => `https://web-coda.firebaseapp.com/?dataset=${d[1]}`)
                .attr("target", "_blank")
                .text(d => d[1])

            td.filter((d, i, n) => d[0] === "Done" && i === 3)
                .each((d, i, n) => {
                    let parentNode = d3.select(n[i].parentNode)
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

    static stringCompare(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return a > b ? 1 : a == b ? 0 : -1;
    }
    
    static sortNumber(a,b) {
       return a-b || isNaN(a)-isNaN(b);
    } 

    static  jsonKeyValueToArray(k, v) {return [k, v];}

    static jsonToArray(json) {
        var ret = new Array();
        for (const key in json) {
            if (json.hasOwnProperty(key)) {
                ret.push(TableController.jsonKeyValueToArray(key, json[key]));
            }
        }
        return ret;
    };
}
