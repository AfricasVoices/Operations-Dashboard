// UI CONTROLLER
export class UIController {
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
            activeLinks: "a.active-link",
            systemsLinkSelector: ".systems-link"
        };
    }

    static addDropdownMenu(data) {
        const DOMstrings = UIController.getDOMstrings(),
            statusMenu = document.querySelector(DOMstrings.projectMenu);
        if (statusMenu) {
            while (statusMenu.firstChild) {
                statusMenu.removeChild(statusMenu.firstChild);
            }   
            let html = `<a id="project" class="dropdown-item">%project_name%</a>`;
            // Replace the placeholder text with some actual data
            data.forEach(obj => {
                let newHtml = html.replace("%project_name%", obj.project_name);
                statusMenu.insertAdjacentHTML("beforeend", newHtml);
            });
        }
    }

    static addCodingProgressSection() {
        let DOMstrings = UIController.getDOMstrings(),
            script = document.createElement('script');
        script.setAttribute('src','libs/scroll.js'); 
        document.head.appendChild(script);
        let html = `<div class="container container-fluid table-responsive">
                <table id='codingtable' class='table'>
                    <thead></thead>
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
                                        <td>Shows the percentage of ‘messages with a label’ that contain a checked “WS (Wrong Scheme)” label.</td>
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

    static addGraphs(title) {
        let DOMstrings = UIController.getDOMstrings(),
            script = document.createElement('script');
        script.setAttribute('src','libs/scroll.js');
        document.head.appendChild(script);
        let html = `<div class="container"> 
            <div class="d-md-flex justify-content-between p-1">
                <div>
                    <span class="txt-brown my-auto title"><b>%collection%</b></span>
                </div>
                <div class="d-md-flex">
                    <span class="align-content-end font-weight-bold mr-1 p-1">Timescale</span>
                    <input class="mr-2 btn btn-sm btn-brown form-control" type="button" id="buttonUpdateView10Minutes" value="10 minutes">
                    <input class="btn btn-sm btn-brown form-control" type="button" id="buttonUpdateViewOneDay" value="1 day">
                    <span class="align-content-end font-weight-bold ml-3 mr-1 p-1">TimeFrame</span>
                    <select class="btn-brown btn-sm form-control col-3" id="timeFrame">
                        <option value="default">Default</option>
                        <option value="1">48 Hours</option>
                        <option value="6">7 days</option>
                        <option value="13">14 days</option>
                        <option value="29">30 days</option>
                    </select> 
                </div>
                <div class="d-flex">
                    <span class="font-weight-bold txt-brown mr-1">Last Updated:</span>
                    <div class="font-weight-bold mb-0" id="lastUpdated"></div>
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
            <section>
                <div class="d-md-flex justify-content-start mt-4 mb-3">
                    <span class="font-weight-bold" type="text">Set the maximum number of failed messages you want to see</span> 
                    <div class="col-md-2"><input class="form-control form-control-sm" type="number" id="buttonYLimitFailed" step="50" min="10"></div>
                </div>
                <div class="card shadow total_failed_sms_graph my-4"></div> 
            </section>
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

    static addSystemsGraphs() {
        let DOMstrings = UIController.getDOMstrings(),
            html = `<div class="container"> 
            <section class="d-flex justify-content-end">
                <span class="font-weight-bold txt-brown mr-1">Last Updated:</span>
                <div class="font-weight-bold mb-0" id="lastUpdated"></div>
            </section>
            <section>
                <div class="card shadow disc-usage-chart my-1"></div>
            </section> 
            <section>
                <div class="card shadow memory-utilization-chart my-1"></div>
            </section> 
            <section>
                <div class="card shadow cpu-utilization-chart my-1"></div>
            </section> 
        </div> `;
        document
            .querySelector(DOMstrings.codingProgressContainer)
            .insertAdjacentHTML("beforeend", html);
    }
}