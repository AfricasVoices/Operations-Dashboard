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
        let activeProjects = [];
        mediadb.collection("active_projects").onSnapshot(res => {
            // Update data every time it changes in firestore
            DataController.updateData(res, activeProjects);
            onChange(activeProjects);
        });
    }

    static watchCodingProgress(onChange) {
        return mediadb.doc("metrics/coda").onSnapshot(res => {
            onChange(res.data());
        });
    }

    static watchProjectTrafficData(projectName, onChange) {
        const TIMERANGE = 30;
        let offset = new Date();
        offset.setDate(offset.getDate() - TIMERANGE);
        let data = [],
            iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L"),
            offsetString = iso(offset),
            projectCollection = projectName;
        return mediadb
            .collection(`/metrics/rapid_pro/${projectCollection}/`)
            .where("datetime", ">", offsetString)
            .onSnapshot(res => {
                // Update data every time it changes in firestore
                DataController.updateData(res, data);
                onChange(data);
            });
    }

    static registerSnapshotListener(snapshot) {
        if (snapshot) {
            DataController.snapshot = snapshot;
            console.log(`subscribed to snapshot: ${snapshot.toString()}`);
        } else {
            console.log("unable to subscribe to snapshot");
        }
    }

    static detachSnapshotListener() {
        if (DataController.snapshot) {
            let unsubscribe = DataController.snapshot;
            unsubscribe();
            console.log("unsubscribed from snapshot");
        } else {
            console.log("no snapshot subscribed");
        }
    }
}
