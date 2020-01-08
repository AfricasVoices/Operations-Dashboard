// UI CONTROLLER
class UIController {
    static getDOMstrings() {
        return {
            projectMenu: '.project-menu',
            codingProgressLinkSelector: '.coding-progress-link',
            codingProgressContainer: '.coding-progress-container',
            graphContainer: '.graph-container',
            logoutBtn: '.logout-btn',
            dropdownItem: '.dropdown-item'
        };
    }

    static addDropdownMenu(data) {
        let DOMstrings = UIController.getDOMstrings();
        let html = `<a id="project" class="dropdown-item">%project_name%</a>`
        // Replace the placeholder text with some actual data
        data.forEach(obj => {
            let newHtml = html.replace('%project_name%', obj.project_name);
            document.querySelector(DOMstrings.projectMenu).insertAdjacentHTML('beforeend', newHtml);
        });  
    }

    static addCodingProgressSection() {
        let DOMstrings = UIController.getDOMstrings();
        let html = `<div class="container container-fluid table-responsive">
                <table id='codingtable' class='table'>
                    <thead>
                        <tr class="table-heading">
                            <th scope="col">Dataset</th>
                            <th scope="col">Messages</th>
                            <th scope="col">Messages with a label</th>
                            <th scope="col">Done</th>
                            <th scope="col">Wrong Scheme messages</th>
                            <th scope="col">WS %</th>
                            <th scope="col">Not Coded messages</th>
                            <th scope="col">NC %</th>
                        </tr>
                    </thead>
                    <tbody id="coding_status_body"></tbody>
                </table>
            <div id="last_update">Last updated: </div>
        </div> `
        // Insert the HTML into the DOM
        document.querySelector(DOMstrings.codingProgressContainer).insertAdjacentHTML('beforeend', html);
    }

    static updateProgressUI(data) {
        // console.log("update_ui: " + JSON.stringify(data));
        let status_body = document.getElementById('coding_status_body');
        if (status_body) {
            while (status_body.firstChild) {
                status_body.removeChild(status_body.firstChild);
            }
            let last_update = data["last_update"]
            document.getElementById('last_update').innerText = "Last updated: " + last_update
            for (let dataset_id in data["coding_progress"]) {
                let messages_count = data["coding_progress"][dataset_id]["messages_count"]
                let messages_with_label = data["coding_progress"][dataset_id]["messages_with_label"]
                let wrong_scheme_messages = data['coding_progress'][dataset_id]['wrong_scheme_messages']
                let not_coded_messages = data['coding_progress'][dataset_id]['not_coded_messages']
                let dataset_link = document.createElement("a")
                    dataset_link.setAttribute("href", `https://web-coda.firebaseapp.com/?dataset=${dataset_id}`)
                    dataset_link.setAttribute('target', '_blank')
                    dataset_link.innerText = dataset_id
                let rw = status_body.insertRow()
                rw.insertCell().appendChild(dataset_link)
                rw.insertCell().innerText = messages_count
                rw.insertCell().innerText = messages_with_label
                rw.insertCell().innerText = (100 * messages_with_label / messages_count).toFixed(2) + '%'
                rw.insertCell().innerText = wrong_scheme_messages != null ? wrong_scheme_messages : "-"
                rw.insertCell().innerText = wrong_scheme_messages != null ? (100 * wrong_scheme_messages / messages_count).toFixed(2) + '%' : "-"
                rw.insertCell().innerText = not_coded_messages != null ? not_coded_messages : "-"
                rw.insertCell().innerText = not_coded_messages != null ?(100 * not_coded_messages / messages_count).toFixed(2) + '%' : "-"
                // console.log(dataset_id, messages_count, messages_with_label,wrong_scheme_messages,not_coded_messages);
                //Table sorting using tablesorter plugin based on fraction of message labelling complete   
                $("#codingtable").tablesorter({
                    //sorting on page load, column four in descending order i.e from least coded to most coded.
                    sortList: [[3, 0]]
                });
                //Trigger sorting on table data update
                $('#codingtable').tablesorter().trigger('update');
                //Formating rows based on cell value
                $('#codingtable td:nth-child(4)').each(function () {
                    let Done = $(this).text();
                    //Style the entire row conditionally based on the cell value
                    if ((parseFloat(Done) === 0)) {
                        $(this).parent().addClass('coding-notstarted');
                    }
                    else if ((parseFloat(Done) > 0) && (parseFloat(Done) <= 25)) {
                        $(this).parent().addClass('coding-below25');
                    }
                    else if ((parseFloat(Done) > 25) && (parseFloat(Done) <= 50)) {
                        $(this).parent().addClass('coding-above25');
                    }
                    else if ((parseFloat(Done) > 50) && (parseFloat(Done) <= 75)) {
                        $(this).parent().addClass('coding-above50');
                    }
                    else if ((parseFloat(Done) > 75) && (parseFloat(Done) < 100)) {
                        $(this).parent().addClass('coding-above75');
                    }
                    else {
                        $(this).parent().addClass('coding-complete');
                    }
                });
            }
        }
    }

    static addGraphs(title) {
        let DOMstrings = UIController.getDOMstrings();
        let html = `<div class="container"> 
            <div class="d-md-flex justify-content-between p-1">
                <div>
                    <span class="txt-brown my-auto title"><b>%collection%</b></span>
                </div>
                <div>
                    <span class="align-content-end font-weight-bold">Timescale</span>
                    <input class="mr-2 btn btn-sm btn-brown" type="button" id="buttonUpdateView10Minutes" value="10 minutes">
                    <input class="btn btn-sm btn-brown" type="button" id="buttonUpdateViewOneDay" value="1 day"> 
                </div>
                <div class="d-flex">
                    <span class="font-weight-bold txt-brown mr-1">Last Updated:</span>
                    <div class="font-weight-bold" id="lastUpdated"></div>
                </div>
            </div> 
            <section>
                <div class="d-md-flex justify-content-start my-2">
                    <span class="font-weight-bold" type="text">Set the maximum number of incoming messages you want to see</span> 
                    <div class="col-md-2"><input class="form-control form-control-sm" type="number" id="buttonYLimitReceived" step="100" min="10"></div>
                </div>
                <div class="card shadow total_received_sms_graph"></div>
            </section> 
            <section>
                <div class="d-md-flex justify-content-start mt-4 mb-3">
                    <span class="font-weight-bold" type="text">Set the maximum number of outgoing messages you want to see</span> 
                    <div class="col-md-2"><input class="form-control form-control-sm" type="number" id="buttonYLimitSent" step="500" min="10"></div>
                </div>
                <div class="card shadow total_sent_sms_graph"></div>
            </section> 
            <div class="card shadow total_failed_sms_graph my-4"></div> 
        </div> `
        // Insert the HTML into the DOM
        let newHtml = html.replace('%collection%', title);
        document.querySelector(DOMstrings.codingProgressContainer).insertAdjacentHTML('beforeend', newHtml);
    }
}

