class DataController {
    static updateData(snapshot, data) {
        // Update data every time it changes in firestore
        snapshot.docChanges().forEach(change => {
            const doc = { ...change.doc.data(), id: change.doc.id };

            switch (change.type) {
                case "added":
                    data.push(doc);
                    break;
                case "modified":
                    const index = data.findIndex(item => item.id == doc.id);
                    data[index] = doc;
                    break;
                case "removed":
                    data = data.filter(item => item.id !== doc.id);
                    break;
                default:
                    break;
            }
        });
    }

    static watchActiveProjects(onChange) {
        let activeProjects = []
        mediadb.collection('active_projects').onSnapshot(res => {
            // Update data every time it changes in firestore
            DataController.updateData(res, activeProjects);
                onChange(activeProjects);
        });  
    }

    static watchCodingProgress(onChange, hasListener = true) {
        let unsubscribe = mediadb.doc('metrics/coda').onSnapshot(res => {
            onChange(res.data());
        });
        if (!hasListener) {
            unsubscribe()
        }
    }

    static watchProjectTrafficData(projectName, onChange, hasListener = true) {  
        let data = [];
        let offset = new Date();
        const TIMERANGE = 30 
        offset.setDate(offset.getDate() - TIMERANGE);
        let iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L");
        let offsetString = iso(offset)
        let projectCollection = projectName
        let unsubscribe = mediadb.collection(`/metrics/rapid_pro/${projectCollection}/`).where("datetime", ">", offsetString).onSnapshot(res => {
            // Update data every time it changes in firestore
            DataController.updateData(res, data);
            onChange(data);
        });
        if (!hasListener) {
            unsubscribe()
        }
    }
}
