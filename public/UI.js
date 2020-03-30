// UI CONTROLLER
class UIController {
    static getDOMstrings() {
        return {
            projectMenu: ".project-menu",
            codingProgressLinkSelector: ".coding-progress-link",
            codingProgressContainer: ".coding-progress-container",
            trafficsLinkSelector: ".traffics-link",
            graphContainer: ".graph-container",
            logoutBtn: ".logout-btn",
            dropdownItem: ".dropdown-item",
            activeLinkClassName: "active-link",
            activeLinks: "a.active-link"
        };
    }

    static addDropdownMenu(data) {
        let DOMstrings = UIController.getDOMstrings(),
            html = `<a id="project" class="dropdown-item">%project_name%</a>`;
        // Replace the placeholder text with some actual data
        data.forEach(obj => {
            let newHtml = html.replace("%project_name%", obj.project_name);
            document.querySelector(DOMstrings.projectMenu).insertAdjacentHTML("beforeend", newHtml);
        });
    }

    static addCodingProgressSection() {
        let DOMstrings = UIController.getDOMstrings(),
            script = document.createElement('script');
        script.setAttribute('src','scroll.js');
        document.head.appendChild(script);
        let html = `<div class="container container-fluid table-responsive">
                <table id='codingtable' class='table'>
                    <thead>
                        <tr class="table-heading">
                            <th scope="col">Dataset</th>
                            <th scope="col">Unique Texts</th>
                            <th scope="col">Unique Texts with a label</th>
                            <th scope="col">Done</th>
                            <th scope="col">Wrong Scheme messages</th>
                            <th scope="col">WS %</th>
                            <th scope="col">Not Coded messages</th>
                            <th scope="col">NC %</th>
                        </tr>
                    </thead>
                    <tbody id="coding-status-body"></tbody>
                </table>
                <div id="last-update">Last updated: </div>
                <div class="accordion" id="accordionExample">
                    <div class="card">
                        <div id="headingOne">
                            <h2 class="mb-0">
                                <button class="btn btn-brown" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                Message Coding Table Header Definitions
                                </button>
                            </h2>
                        </div>
                        <div id="collapseOne" class="collapse" aria-labelledby="headingOne" data-parent="#accordionExample">
                        <div class="card-body">
                            <table class="table table-bordered table-hover shadow">
                                <thead>
                                    <tr class="table-heading">
                                        <th scope="col">Table Headers</th>
                                        <th scope="col">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th scope="row">Dataset</th>
                                        <td>The collection of messages for a given radio episode or survey</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Unique Texts</th>
                                        <td>Shows the total number of unique texts in the dataset. Note that to reduce labelling load, Coda only displays each unique message text once, so this is not the total number of messages received.</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Unique Texts with a label</th>
                                        <td>Shows the number of unique texts which contain a checked (i.e. manually verified) label in at least one code scheme</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Done</th>
                                        <td>Shows the % of labeled unique texts over total unique texts.</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Wrong Scheme messages</th>
                                        <td>Shows the number of ‘messages with a label’ that contain a checked “WS (Wrong Scheme)” label.</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">WS %</th>
                                        <td>Percentage of Wrong Scheme messages</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Not Coded messages</th>
                                        <td>Shows the number of messages with a label’ that contain a checked “NC (Not Coded)” label.</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">NC %</th>
                                        <td>Shows the percentage of 'messages with a label’ that contain a checked “NC (Not Coded)” label.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div> `;
        // Insert the HTML into the DOM
        document
            .querySelector(DOMstrings.codingProgressContainer)
            .insertAdjacentHTML("beforeend", html);
    }

    static updateProgressUI(data) {
        console.log("update_ui: " + JSON.stringify(data));
        let statusBody = document.getElementById("coding-status-body");
        if (statusBody) {
            while (statusBody.firstChild) {
                statusBody.removeChild(statusBody.firstChild);
            }
            let lastUpdate = data["last_update"];
            document.getElementById("last-update").innerText = `Last updated: ${lastUpdate}`;
            for (let datasetID in data["coding_progress"]) {
                let messagesCount = data["coding_progress"][datasetID]["messages_count"],
                    messagesWithLabel = data["coding_progress"][datasetID]["messages_with_label"],
                    wrongSchemeMessages =
                        data["coding_progress"][datasetID]["wrong_scheme_messages"],
                    notCodedMessages = data["coding_progress"][datasetID]["not_coded_messages"],
                    datasetLink = document.createElement("a");
                datasetLink.setAttribute(
                    "href",
                    `https://web-coda.firebaseapp.com/?dataset=${datasetID}`
                );
                datasetLink.setAttribute("target", "_blank");
                datasetLink.innerText = datasetID;
                let rw = statusBody.insertRow();
                rw.insertCell().appendChild(datasetLink);
                rw.insertCell().innerText = messagesCount;
                rw.insertCell().innerText = messagesWithLabel;
                rw.insertCell().innerText =
                    ((100 * messagesWithLabel) / messagesCount).toFixed(2) + "%";
                rw.insertCell().innerText = wrongSchemeMessages != null ? wrongSchemeMessages : "-";
                rw.insertCell().innerText =
                    wrongSchemeMessages != null
                        ? ((100 * wrongSchemeMessages) / messagesCount).toFixed(2) + "%"
                        : "-";
                rw.insertCell().innerText = notCodedMessages != null ? notCodedMessages : "-";
                rw.insertCell().innerText =
                    notCodedMessages != null
                        ? ((100 * notCodedMessages) / messagesCount).toFixed(2) + "%"
                        : "-";
                console.log(
                    datasetID,
                    messagesCount,
                    messagesWithLabel,
                    wrongSchemeMessages,
                    notCodedMessages
                );
                //Table sorting using tablesorter plugin based on fraction of message labelling complete
                $("#codingtable").tablesorter({
                    //sorting on page load, column four in descending order i.e from least coded to most coded.
                    sortList: [[3, 0]]
                });
                //Trigger sorting on table data update
                $("#codingtable")
                    .tablesorter()
                    .trigger("update");
                //Formating rows based on cell value
                $("#codingtable td:nth-child(4)").each(function() {
                    let Done = $(this).text();
                    //Style the entire row conditionally based on the cell value
                    if (parseFloat(Done) === 0) {
                        $(this)
                            .parent()
                            .addClass("coding-notstarted");
                    } else if (parseFloat(Done) > 0 && parseFloat(Done) <= 25) {
                        $(this)
                            .parent()
                            .addClass("coding-below25");
                    } else if (parseFloat(Done) > 25 && parseFloat(Done) <= 50) {
                        $(this)
                            .parent()
                            .addClass("coding-above25");
                    } else if (parseFloat(Done) > 50 && parseFloat(Done) <= 75) {
                        $(this)
                            .parent()
                            .addClass("coding-above50");
                    } else if (parseFloat(Done) > 75 && parseFloat(Done) < 100) {
                        $(this)
                            .parent()
                            .addClass("coding-above75");
                    } else {
                        $(this)
                            .parent()
                            .addClass("coding-complete");
                    }
                });
            }
        }
    }

    static addGraphs(title) {
        let DOMstrings = UIController.getDOMstrings(),
            script = document.createElement('script');
        script.setAttribute('src','scroll.js');
        document.head.appendChild(script);
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
            <div class="accordion" id="accordionExample">
                <div id="headingOne">
                    <h2 class="mb-2">
                        <button class="btn btn-brown" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                        Threats to Validity
                        </button>
                    </h2>
                </div>
                <div id="collapseOne" class="collapse" aria-labelledby="headingOne" data-parent="#accordionExample">
                    <div class="card">
                        <p class="h5 text-center card-title text-uppercase"><u>Threats to Validity</u></p>
                        <div class="card-text">
                            <p><strong>The outbound and failed messages graphs may show underestimates when TextIt is under outbound load</strong><br>
                            This is has two causes:
                            <ol>
                                <li>TextIt has to rate-limit outbound messages to avoid problems with the MNOs being unable to handle a large number of requests over a short period.</li>
                                <li>We can only query messages in TextIt by created_on date, not modified_on date.</li>
                            </ol>
                            Combined, this means it’s too expensive for us to get the status of all the queued messages, because we’d have to pull 10s of thousands of messages from the past few hours every 10 minutes, which TextIt can’t deliver. As a result, TextIt will only show the first few minutes of a burst. We mitigate this by running an expensive recount of the previous day nightly, so that previous days should always be unaffected by this issue.</p>
                            
                            <p><strong>There is a lag between when a message is sent/received by TextIt and when it shows up on the dashboards, typically by up to 10-15 minutes.</strong><br>
                            This is because messages are counted in 10 minute blocks, and at the end of each 10 minute block only.</p>
                        
                            <p><strong>Total failures are reported based only on the response received by the aggregator. </strong><br>
                            Therefore the failures graph may underestimate if the aggregator reports a success but the MNO fails to deliver the message to the receipient, or show an overestimate if the aggregator delivers messages but fails to respond with a success status. Vice versa for total outbound messages.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div> `,
            // Insert the HTML into the DOM
            newHtml = html.replace("%collection%", title);
        document
            .querySelector(DOMstrings.codingProgressContainer)
            .insertAdjacentHTML("beforeend", newHtml);
    }
}
