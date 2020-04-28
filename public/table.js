class TableController {
    static updateCodingProgressTable(codaData) {
        let data = codaData.data,
            lastUpdate = codaData.lastUpdate; 
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