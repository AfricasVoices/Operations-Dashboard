import { mediadb } from "./app_controller.js";

export class DataController {
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

    static watchPipelineMetrics(onChange) {
        const TIMERANGE = 30;
        let offset = new Date();
        offset.setDate(offset.getDate() - TIMERANGE);
        let pipelineMetrics = [],
            iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L"),
            offsetString = iso(offset);
        return mediadb.collection("Pipeline")
            // .where("datetime", ">", offsetString)
            .onSnapshot(res => {
                // Update data every time it changes in firestore
                DataController.updateData(res, pipelineMetrics);
                // format the data
                pipelineMetrics.forEach(function(d) {
                    d.timestamp = new Date(d.timestamp);
                });
            // Sort data by date
            pipelineMetrics.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            // Group pipeline metrics by project
            let metricsByProject = d3.group(pipelineMetrics, d => d.project);
            // Generate data for pipeline progress table
            let pipelineProgressTableData = [];
            for (let [key, value] of metricsByProject.entries()) {
                // Sort pipeline metrics in a descending order
                value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                // Find object with current start time
                const objectCurrentStartTime = value.find(obj => obj.event == "PipelineStart");
                // Find object with last successful run timestamp
                const objectLastSuccessfulRun = value.find(obj => obj.event == "PipelineCompletedSuccessfully");
                // Remove current start time from pipeline metrics
                const filteredValue = value.filter(obj => obj !== objectCurrentStartTime);
                // Find object with last start time
                const objectLastStartTime = filteredValue.find(obj => obj.event == "PipelineStart");
                let lastStartTime = objectLastStartTime != null ? new Date(objectLastStartTime.timestamp) : "-",
                    lastSuccessfulRun =  objectLastSuccessfulRun != null ? new Date(objectLastSuccessfulRun.timestamp) : "-",
                    currentStartTime = objectCurrentStartTime != null ? new Date(objectCurrentStartTime.timestamp) : "-",
                    period;
                if (lastSuccessfulRun > lastStartTime) {
                    period = DataController.formattedTimeDifference(lastSuccessfulRun, lastStartTime)
                } else {
                    period = "-"
                }
                let pipelineProgress = {};
                pipelineProgress["Pipeline"] = key;
                pipelineProgress["Last Successful Run"] = lastSuccessfulRun;
                pipelineProgress["Period"] = period;
                pipelineProgress["Previous Start Time"] = lastStartTime;
                pipelineProgress["Current Start Time"] = currentStartTime;
                pipelineProgressTableData.push(pipelineProgress)
            }
            onChange({pipelineMetrics, pipelineProgressTableData})
        }, error => console.log(error));
    }

    static formattedTimeDifference(startDate, endDate) {
        // Get total seconds between the times
        let delta = Math.abs(endDate - startDate) / 1000;
        // Calculate (and subtract) whole days
        let days = Math.floor(delta / 86400);
        delta -= days * 86400;
        // Calculate (and subtract) whole hours
        let hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        // Calculate (and subtract) whole minutes
        let minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        // What's left is seconds
        let seconds = delta % 60;
        days = days.toString().padStart(2, "0");
        hours = hours.toString().padStart(2, "0");
        minutes = minutes.toString().padStart(2, "0");
        seconds = seconds.toString().padStart(2, "0");
        let period = `${days}:${hours}:${minutes}`
        return period
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
                // format the data
                let dayDateFormat = d3.timeFormat("%Y-%m-%d"),
                operators = new Set();
                data.forEach(d => {
                    d.datetime = new Date(d.datetime);
                    d.day = dayDateFormat(new Date(d.datetime));
                    d.total_received = +d.total_received;
                    d.total_sent = +d.total_sent;
                    d.total_pending = +d.total_pending;
                    d.total_errored = +d.total_errored;
                    Object.keys(d.operators)
                        .sort()
                        .forEach(operator => {
                            if (!(operator in operators)) {
                                operators.add(operator);
                                d[`${operator}_received`] = +d.operators[operator]["received"];
                                d[`${operator}_sent`] = +d.operators[operator]["sent"];
                            }
                        });
                });
                // Sort data by date
                data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
                onChange(data, projectName, operators, DataController.mno_colors);
            }, error => console.log(error));
    }

    static watchSystemsMetrics(onChange) {
        const TIMERANGE = 30;
        let offset = new Date();
        offset.setDate(offset.getDate() - TIMERANGE);
        let systemMetrics = [],
            iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L"),
            offsetString = iso(offset);
        return mediadb
            .collection("pipeline_system_metrics")
            .where("datetime", ">", offsetString)
            .onSnapshot(res => {
                // Update data every time it changes in firestore
                DataController.updateData(res, systemMetrics);
                // format the data
                systemMetrics.forEach(function(d) {
                    d.datetime = new Date(d.datetime);
            }, error => console.log(error));
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

// static watchpipelineProgress2(onChange) {
//     return mediadb.doc("metrics/pipelines").onSnapshot(res => {
//         let data = []
//         let pipelineProgressData = res.data();
//         for (let pipelineID in pipelineProgressData["pipelines_progress"]) {
//             let lastStartTime = new Date(pipelineProgressData["pipelines_progress"][pipelineID]["last_start_time"]),
//                 lastSuccessfulRun = new Date(pipelineProgressData["pipelines_progress"][pipelineID]["last_successful_run"]),
//                 currentStartTime = new Date(pipelineProgressData["pipelines_progress"][pipelineID]["current_start_time"]);
//             let pipelineProgress = {}
//             pipelineProgress["Pipeline"] = pipelineID
//             pipelineProgress["Last Start Time"] = lastStartTime;
//             pipelineProgress["Last Successful Run"] = lastSuccessfulRun;
//             pipelineProgress["Period"] = timeDifference(lastSuccessfulRun, lastStartTime);
//             pipelineProgress["Current Start Time"] = currentStartTime;
//             data.push(pipelineProgress)
//         }
//         onChange({data, lastUpdate : pipelineProgressData["last_update"]}); 
//     }, error => console.log(error));    
// }
// static watchpipelineProgress(onChange) {
//     return mediadb.doc("metrics/pipelines").onSnapshot(res => {
//         let data = res.data();
//         // Format pipeline metrics data to display on table
//         let metricsByProject = d3.group(data, d => d.project);
//         let pipelineProgressTableData = []
//         for (let [key, value] of metricsByProject.entries()) {
//             // console.log([key, value])
//             value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
//             const currentObj = value.find(el => el.event == "PipelineStart");
//             const currentObj2 = value.find(el => el.event == "PipelineCompletedSuccessfully");
//             const newArr = value.filter(val => val !== currentObj);
//             const currentObj3 = newArr.find(el => el.event == "PipelineStart");
//             let lastStartTime = currentObj != null ? new Date(currentObj.timestamp) : "-",
//                 lastSuccessfulRun =  currentObj2 != null ? new Date(currentObj2.timestamp) : "-",
//                 currentStartTime = currentObj3 != null ? new Date(currentObj3.timestamp) : "-",
//                 period;
//             if (lastSuccessfulRun > lastStartTime) {
//                 period = formattedTimeDifference(lastSuccessfulRun, lastStartTime)
//             } else {
//                 period = "-"
//             }
//             let pipelineProgress = {};
//             pipelineProgress["Pipeline"] = key;
//             pipelineProgress["Last Start Time"] = lastStartTime;
//             pipelineProgress["Last Successful Run"] = lastSuccessfulRun;
//             pipelineProgress["Period"] = period;
//             pipelineProgress["Current Start Time"] = currentStartTime;
//             pipelineProgressTableData.push(pipelineProgress)
//         }
//         console.log(data)
//         onChange({data, pipelineProgressTableData}); 
//     }, error => console.log(error));    
// }
