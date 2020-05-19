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
        }, error => {
            if (error.code == "permission-denied") {
                firebase.auth().onAuthStateChanged(user => { 
                    if (user) {
                        // Error message - Alert Missing or insufficient permissions.
                        alert(`${error.message} 
                        \r Please login using your AVF email`) 
                        if (user.email.match(".*@africasvoices.org$")) {
                            alert(`${error.message} 
                            \r Please liaise with Africa's Voices Foundation (AVF) to activate your email`) 
                        }
                    }
                })
                window.location.replace("auth.html")
            } else {
                console.log(error);
            }     
        });
    }

    static watchCodingProgress(onChange) {
        return mediadb.doc("metrics/coda").onSnapshot(res => {
            let data = []
            let codingProgressData = res.data();
            for (let datasetID in codingProgressData["coding_progress"]) {
                let messagesCount = codingProgressData["coding_progress"][datasetID]["messages_count"],
                    messagesWithLabel = codingProgressData["coding_progress"][datasetID]["messages_with_label"],
                    wrongSchemeMessages =
                        codingProgressData["coding_progress"][datasetID]["wrong_scheme_messages"],
                    notCodedMessages = codingProgressData["coding_progress"][datasetID]["not_coded_messages"]
                let codingProgress = {}
                codingProgress["Dataset"] = datasetID
                codingProgress["Unique Texts"] = Number(messagesCount)
                codingProgress["Unique Texts with a label"] = Number(messagesWithLabel)
                codingProgress["Done"] =  Number(((100 * messagesWithLabel) / messagesCount).toFixed(2));
                codingProgress["Wrong Scheme messages"] = wrongSchemeMessages != null ? Number(wrongSchemeMessages) : "-";
                codingProgress["WS %"] = wrongSchemeMessages != null ? Number(((100 * wrongSchemeMessages) / messagesCount).toFixed(2)): "-";
                codingProgress["Not Coded messages"] = notCodedMessages != null ? Number(notCodedMessages) : "-";
                codingProgress["NC %"] = notCodedMessages != null ? Number(((100 * notCodedMessages) / messagesCount).toFixed(2)) : "-";
                data.push(codingProgress)
            }
            onChange({data, lastUpdate : codingProgressData["last_update"]});  
        }, error => console.log(error));    
    }

    static watchMNOColors() {
        return mediadb.doc("mno_properties/mno_colors").onSnapshot(res => {
            DataController.mno_colors = res.data();
        }, error => console.log(error));
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
            }, error => console.log(error));
    }

    static watchSystemsMetrics(onChange) {
        let systemMetrics = [];
        return mediadb.collection("pipeline_system_metrics").onSnapshot(res => {
            DataController.updateData(res, systemMetrics);
            // format the data
            systemMetrics.forEach(function(d) {
                d.datetime = new Date(d.datetime);
                Object.keys(d.disk_usage)
                    .sort()
                    .forEach(metric => {
                        d[`disk_${metric}`] = (+d.disk_usage[metric] / 1e9);
                    });
                Object.keys(d.memory_usage)
                    .sort()
                    .forEach(metric => {
                        d[`memory_${metric}`] = (+d.memory_usage[metric] / 1e9);
                    });
                d.unused_cpu_percent = (100 - +d.cpu_percent)
                d.total_ram = +d.memory_free + +d.memory_used;
            })
            // Sort data by date
            systemMetrics.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
            onChange(systemMetrics)
        })
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
