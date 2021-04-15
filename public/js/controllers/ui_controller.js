// UI CONTROLLER
export class UIController {
    static getDOMstrings() {
        return {
            projectMenu: "#traffic-menu",
            systemsMenu: "#systems-menu",
            codingProgressLinkSelector: "#coding-progress-link",
            trafficsLinkSelector: "#traffic-link",
            systemsLinkSelector: "#systems-link",
            logoutBtn: "#logout-btn",
            mainContainer: "#main-container",
            activeLinkClassName: "active-link",
            activeLinks: "a.active-link",
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
            data.forEach((obj) => {
                let newHtml = html.replace("%project_name%", obj.project_name);
                statusMenu.insertAdjacentHTML("beforeend", newHtml);
            });
        }
    }

    static resetUI() {
        const DOMstrings = UIController.getDOMstrings();
        UIController.statusBody = document.querySelector(DOMstrings.mainContainer);
        while (UIController.statusBody.firstChild) {
            UIController.statusBody.removeChild(UIController.statusBody.firstChild);
        }
    }

    static getScrollJsScript() {
        let scrollScript = document.createElement('script');
        scrollScript.setAttribute('src', 'js/libs/scroll.js');
        return scrollScript;
    }

    static addCodingProgressSection() {
        UIController.resetUI();
        document.head.appendChild(UIController.getScrollJsScript());
        let html = `<div class="container container-fluid table-responsive">
                <div class="d-flex justify-content-start m-1">
                    <div class="dropdown">
                        <button class="btn btn-brown shadow-none dropdown-toggle btn-sm mr-3" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            Filter by Columns
                        </button>
                        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                            <form>
                                <div class="form-check dropdown-item">
                                    <input id="unique-texts" class="form-check-input" type="checkbox">
                                    <label for="unique-texts" class="form-check-label">Unique Texts</label>
                                </div>
                                <div class="form-check dropdown-item">
                                    <input id="unique-texts-labels" class="form-check-input" type="checkbox">
                                    <label for="unique-texts-labels" class="form-check-label">Unique Texts with a label</label>
                                </div>
                                <div class="form-check dropdown-item">
                                    <input id="done" class="form-check-input" type="checkbox">
                                    <label for="done" class="form-check-label">Done</label>
                                </div>
                                <div class="form-check dropdown-item">
                                    <input id="wrong-scheme-messages" class="form-check-input" type="checkbox">
                                    <label for="wrong-scheme-messages" class="form-check-label">Wrong Scheme messages</label>
                                </div>
                                <div class="form-check dropdown-item">
                                    <input id="ws" class="form-check-input" type="checkbox">
                                    <label for="ws" class="form-check-label">WS %</label>
                                </div>
                                <div class="form-check dropdown-item">
                                    <input id="not-coded-messages" class="form-check-input" type="checkbox">
                                    <label for="not-coded-messages" class="form-check-label">Not Coded messages</label>
                                </div>
                                <div class="form-check dropdown-item">
                                    <input id="NC" class="form-check-input" type="checkbox">
                                    <label for="NC" class="form-check-label">NC %</label>
                                </div>
                            </form>
                        </div>
                    </div>
            
                    <select class="btn-brown form-control form-control-sm shadow-none col-2 ml-2" id="keyword"></select>
                    <div class="input-group col-3">
                        <input type="text" class="form-control form-control-sm shadow-none" id="input-keyword" value="" placeholder="Enter keyword...">
                        <div class="input-group-append">
                            <button class="btn btn-brown btn-sm form-control form-control-sm shadow-none" type="button" id="search">search</button>
                        </div>
                    </div>
                    <div><button class="btn btn-sm btn-brown shadow-none" id="reset">View All</button></div>
                </div>
            
                <table id='codingtable' class='table'>
                    <thead></thead>
                    <tbody id="coding-status-body"></tbody>
                </table>
                <div id="last-update">Last updated: </div>
                <div class="accordion" id="accordionExample">
                    <div class="card">
                        <div id="headingOne">
                            <h2 class="mb-0">
                                <button class="btn btn-brown shadow-none" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
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
        UIController.statusBody.insertAdjacentHTML("beforeend", html);
    }

    static addkeywordOptions(data) {
        const statusMenu = document.getElementById("keyword");
        if (statusMenu) {
            while (statusMenu.firstChild) {
                statusMenu.removeChild(statusMenu.firstChild);
            }
            let firstChildElement = `<option disabled selected>Filter By Active Projects</option>`
            let html = `<option>%project_name%</option>`;
            // Replace the placeholder text with some actual data
            data.forEach((obj) => {
                let newHtml = html.replace("%project_name%", obj.project_name);
                statusMenu.insertAdjacentHTML("beforeend", newHtml);
            });
            statusMenu.insertAdjacentHTML("afterbegin", firstChildElement);
        }
    }

    static addGraphs(title) {
        UIController.resetUI();
        document.head.appendChild(UIController.getScrollJsScript());
        let html = `<div class="container"> 
            <div class="d-md-flex justify-content-between p-1" style="border-botto:solid 1px lightgray">
                <div class="d-md-flex">
                    <span class="font-weight-bold txt-brown mr-1">Africas Talking Balance:</span>
                    <div class="font-weight-bold mb-0" id="lastUpdate">KES 15,159.60</div>
                </div>
                <div>
                    <span class="txt-brown my-auto title"><b>${title}</b></span>
                </div>
                <div class="d-flex">
                    <span class="font-weight-bold txt-brown mr-1">Last Updated:</span>
                    <div class="font-weight-bold mb-0" id="lastUpdated"></div>
                </div>
            </div> 
           
            <div class="d-md-flex" style="border-bott:solid 1px lightgray; padding-left:350px">
                <div class="d-md-flex p-" style="padding-right:20px">  
                    <div>
                        <select class="btn-brown btn-sm form-control shadow-none" id="timeFrame">
                            <option value="default">Set the Time Frame</option>
                            <option value="1">48 Hours</option>
                            <option value="6">7 days</option>
                            <option value="13">14 days</option>
                            <option value="29">30 days</option>
                        </select>
                    </div>
                </div> 
                
                <div class="d-md-flex">
                <div class="align-content-end font-weight-bold mr-1 p-1" style="border: solid 0.5px brown">TimeScale</div>
                    <input class="mr-2 btn btn-sm btn-brown form-control shadow-none" type="button" id="buttonUpdateView10Minutes" value="10 minutes">
                    <input class="btn btn-sm btn-brown form-control shadow-none" type="button" id="buttonUpdateViewOneDay" value="1 day">
                </div>
            </div>
                
            <div class="card shadow total_received_sms_graph my-1"></div>
            <div class="card shadow total_sent_sms_graph my-4"></div>
            <div class="card shadow total_failed_sms_graph my-4"></div> 
            
            <div class="accordion" id="accordionExample">
                <div id="headingOne">
                    <div class="btn-group mb-2">
                        <button class="btn btn-outline-custom shadow-none" type="button" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
                        Metrics
                        </button>
                        <button class="btn btn-outline-custom shadow-none" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                        Threats to Validity
                        </button>
                    </div>
                </div>
                <div id="collapseOne" class="collapse" aria-labelledby="headingOne" data-parent="#accordionExample">
                    <div class="card shadow">
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

                <div id="collapseTwo" class="collapse show" aria-labelledby="headingTwo" data-parent="#accordionExample">
                    <div class="border shadow">
                        <div class="input-group px-2 pt-2">
                            <div class="input-group-prepend">
                                <span class="input-group-text">Datetime Picker: </span>
                            </div>
                            <input type="text" class="form-control col-md-3 bg-light" id="datetime-picker">
                        </div>
                        <div class="row">
                            <div class="col">
                                <div class="card responsetext">
                                    <b>Message metrics</b>
                                    <div>Total Incoming Messages: <span id="total-received"></span></div>
                                    <div>Total Outgoing Messages: <span id="total-sent"></span></div>
                                </div>
                            </div>
                            <div class="col">
                                <div class="card responsetext">
                                    <b>Operator metrics</b>
                                    <table id="operator-metrics"></table>
                                </div>
                            </div>
                            <div class="col">
                                <div class="card responsetext">
                                    <b>Project Details</b>
                                    <div>Project Name: <span id="project-name"></span></div>
                                    <div>Africas Talking Units Balance: <span id="AT-units-bal"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div> `;
        // Insert the HTML into the DOM
        UIController.statusBody.insertAdjacentHTML("beforeend", html);
    }

    static addSystemsGraphs() {
        UIController.resetUI();
        let html = `<div class="container"> 
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
        UIController.statusBody.insertAdjacentHTML("beforeend", html);
    }

    static addPipelinesGraphs() {
        UIController.resetUI();
        let html = `<div class="container">
            <table class="table">
                <thead></thead>
                <tbody></tbody>
            </table>
            <section>
                <div class="card shadow line-chart my-1"></div>
            </section>
        </div> `;
        UIController.statusBody.insertAdjacentHTML("beforeend", html);
    }
}
