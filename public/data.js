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
            let arr = []
            let data = res.data();
            for (let datasetID in data["coding_progress"]) {
                let messagesCount = data["coding_progress"][datasetID]["messages_count"],
                    messagesWithLabel = data["coding_progress"][datasetID]["messages_with_label"],
                    wrongSchemeMessages =
                        data["coding_progress"][datasetID]["wrong_scheme_messages"],
                    notCodedMessages = data["coding_progress"][datasetID]["not_coded_messages"]
                let db = {}
                db["Dataset"] = datasetID
                db["Unique Texts"] = messagesCount
                db["Unique Texts with a label"] = messagesWithLabel 
                db["Done"] =  ((100 * messagesWithLabel) / messagesCount).toFixed(2);
                db["Wrong Scheme messages"] = wrongSchemeMessages != null ? wrongSchemeMessages : "-";
                db["WS %"] = wrongSchemeMessages != null ? ((100 * wrongSchemeMessages) / messagesCount).toFixed(2): "-";
                db["Not Coded messages"] = notCodedMessages != null ? notCodedMessages : "-";
                db["NC %"] = notCodedMessages != null ? ((100 * notCodedMessages) / messagesCount).toFixed(2) : "-";
                arr.push(db)
            }

            onChange({data2: arr, lastUpdate : data["last_update"]});  
            // onChange(res.data());
        });
    }

    static watchMNOColors() {
        return mediadb.doc("mno_properties/mno_colors").onSnapshot(res => {
            DataController.mno_colors = res.data();
        });
    }

    static watchProjectTrafficData(projectName, onChange) {
        const TIMERANGE = 31;
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
