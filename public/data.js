class DataController {
    static updateData(response, input) {
        // Update data every time it changes in firestore
        response.docChanges().forEach(change => {

            const doc = { ...change.doc.data(), id: change.doc.id };

            switch (change.type) {
                case "added":
                    input.push(doc);
                    break;
                case "modified":
                    const index = input.findIndex(item => item.id == doc.id);
                    input[index] = doc;
                    break;
                case "removed":
                    input = input.filter(item => item.id !== doc.id);
                    break;
                default:
                    break;
            }
        });
    }

    static getProject(update) {
        let activeProjects = []
        mediadb.collection('active_projects').onSnapshot(res => {
            // Update data every time it changes in firestore
            DataController.updateData(res, activeProjects);
            update(activeProjects);
        });  
    }

    static getDocument(update) {
        mediadb.doc('metrics/coda').onSnapshot(res => {
            update(res.data());
        });
    }

    static getCollection(collection, update) {  
        let data = [];
        let offset = new Date();
        const timerange = 30 
        offset.setDate(offset.getDate() - timerange);
        let iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L");
        let offsetString = iso(offset)
        mediadb.collection(`/metrics/rapid_pro/${collection}/`).where("datetime", ">", offsetString).onSnapshot(res => {
            // Update data every time it changes in firestore
            DataController.updateData(res, data);
            update(data);
        });
    }
}