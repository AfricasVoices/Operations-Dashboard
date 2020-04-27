class TableController {
    static stringCompare(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return a > b ? 1 : a == b ? 0 : -1;
    }

    static sortNumber(a, b) {
        return a - b;
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
    
    static updateCodingProgressTable(codaData) {
        let data = []
        // Object.keys(d.codaData.coding_progress)
        //         .sort()
        //         .forEach(operator => {
        //             if (!(operator in operators)) {
        //                 operators.add(operator);
        //                 d[`${operator}_received`] = +d.operators[operator]["received"];
        //                 d[`${operator}_sent`] = +d.operators[operator]["sent"];
        //             }
        //         });

        for (const i in codaData.coding_progress) {
            // console.log({...codaData.coding_progress[i], age:22, name: "Daniel" })
            const { messages_count : here } = codaData.coding_progress[i]
            console.log(here)
            // console.log()
            data.push({...codaData.coding_progress[i]})
        }

        // var newObject= [{
        //     'DateTimeTaken': addObjectResponse.DateTimeTaken,
        //     'Weight': addObjectResponse.Weight,
        //     'Height': addObjectResponse.Height,
        //     'SPO2': addObjectResponse.SPO2 
        // }];
        
        transform("messages_count");  

        function transform(attrName) {
            d3.select("tbody").selectAll("tr").remove();
        
            // Header
            let th = d3.select("thead").selectAll("th")
                .data(TableController.jsonToArray(data[0]))
                .enter().append("th")
                .on("click", (d, i, n) => transform(d[0].toString()))
                .text(d => d[0]);
        
            // Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr")
                .sort((a, b) => a == null || b == null ? 0 : 
                    TableController.sortNumber(a[attrName], b[attrName]));
        
            // Cells
            let td = tr.selectAll("td")
                .data(d => TableController.jsonToArray(d))
                .enter().append("td")
                .on("click", (d, i, n) => transform(d[0].toString()))
                .text(d => d[1]);
        };  
    }
}
