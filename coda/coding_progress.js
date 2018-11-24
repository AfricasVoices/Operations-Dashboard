const progress_fs = firebase.firestore();
const settings = {timestampsInSnapshots: true};
progress_fs.settings(settings);
progress_fs.doc('metrics/coda').onSnapshot(res => {
    update_progress_ui(res.data());
});

function update_progress_ui(data) {
    console.log("update_ui: " + JSON.stringify(data));
    var status_body = document.getElementById('coding_status_body');
    
    while (status_body.firstChild) {
        status_body.removeChild(status_body.firstChild);
    }

    last_update = data["last_update"]
    document.getElementById('last_update').innerText = "Last updated: " + last_update

    for (var dataset_id in data["coding_progress"]) {
        var messages_count = data["coding_progress"][dataset_id]["messages_count"]
        var messages_with_label = data["coding_progress"][dataset_id]["messages_with_label"]

        rw = status_body.insertRow()
        rw.insertCell().innerText = dataset_id
        rw.insertCell().innerText = messages_count
        rw.insertCell().innerText = messages_with_label
        rw.insertCell().innerText = (100 * messages_with_label / messages_count).toFixed(2) + "%"
        
        console.log(dataset_id, messages_count, messages_with_label);
      }
}