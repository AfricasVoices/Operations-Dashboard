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

    static watchMNOColors() {
        return mediadb.doc("mno_properties/mno_colors").onSnapshot(res => {
            DataController.mno_colors = res.data();
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
        DataController.watchMNOColors() 
        return mediadb
            .collection(`/metrics/rapid_pro/${projectCollection}/`)
            .where("datetime", ">", offsetString)
            .onSnapshot(res => {
                // Update data every time it changes in firestore
                DataController.updateData(res, data);
                onChange(data, projectName, DataController.mno_colors);
            });
    }

    static registerSnapshotListener(unsubscribeFunc) {
        if (unsubscribeFunc) {
            DataController.unsubscribeFunc = unsubscribeFunc;
            console.log(`subscribed to listener: ${unsubscribeFunc.toString()}`);
        } else {
            console.log("unable to subscribe to listener");
        }
    }

    static detachSnapshotListener() {
        if (DataController.unsubscribeFunc) {
            let unsubscribe = DataController.unsubscribeFunc;
            unsubscribe();
            console.log("unsubscribed from listener");
        } else {
            console.log("no listener subscribed");
        }
    }
}
