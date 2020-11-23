export class PipelinesController {
    static updatePipelinePage() {
        PipelinesController.updateGraphs()
        PipelinesController.updatePipelineProgressTable();
    }

    static updateGraphs() {

    }

    static updatePipelineProgressTable(data) {

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
