// UI CONTROLLER
export class UIController {
    static getDOMstrings() {
        return {
            codingProgressLinkSelector: "#coding-progress",
            mobileCodingProgressLinkSelector: "#mobile-coding-progress",
            trafficsLinkSelector: "#traffic-metrics",
            projectMenu: "#traffic-metrics-menu",
            mobileProjectMenu: "#mobile-traffic-metrics-menu",
            systemsLinkSelector: "#system-metrics",
            mobileSystemsLinkSelector: "#mobile-system-metrics",
            logoutBtns: ".logout",
            mainContainer: "#main",
            mobileNav: ".mobile-nav",
            backdrop: ".backdrop",
            toggleButton: ".toggle-button",
            closeButton: ".close-button",
            activeLinkClassName: "active",
            activeLinks: "a.active"
        };
    }

    static addDropdownMenu(data) {
        const DOMstrings = UIController.getDOMstrings();
        const statusMenu = document.querySelector(DOMstrings.projectMenu);
        const mobileStatusMenu = document.querySelector(DOMstrings.mobileProjectMenu);
        if (statusMenu) {
            while (statusMenu.firstChild) {
                statusMenu.removeChild(statusMenu.firstChild);
            }
            let html = `<li class="main-nav__dropdown-item"><a href="javascript:void(0);">%project_name%</a></li>`;
            // Replace the placeholder text with some actual data
            data.forEach((obj) => {
                let newHtml = html.replace("%project_name%", obj.project_name);
                statusMenu.insertAdjacentHTML("beforeend", newHtml);
            });
        }
        if (mobileStatusMenu) {
            while (mobileStatusMenu.firstChild) {
                mobileStatusMenu.removeChild(mobileStatusMenu.firstChild);
            }
            let html = `<option>%project_name%</option>`;
            // Replace the placeholder text with some actual data
            data.forEach((obj) => {
                let newHtml = html.replace("%project_name%", obj.project_name);
                mobileStatusMenu.insertAdjacentHTML("beforeend", newHtml);
            });
            mobileStatusMenu.insertAdjacentHTML("afterbegin", "<option selected disabled>SELECT TRAFFIC :</option>");
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
        let html = `<div>
                <div class="coding-progress-bar">
                    <ul class="coding-progress-bar__items">
                        <li class="coding-progress-bar__item filter-columns">
                            <a class="btn" href="#">Filter by Columns <i class="fas fa-caret-down"></i></a>
                            <ul class="coding-progress-bar__dropdown-menu">
                                <li class="coding-progress-bar__dropdown-item">
                                    <input id="unique-texts" class="coding-progress-bar__check-input" type="checkbox">
                                    <label for="unique-texts" class="coding-progress-bar__check-label">Unique Texts</label>
                                </li>
                                <li class="coding-progress-bar__dropdown-item">
                                    <input id="unique-texts-labels" class="coding-progress-bar__check-input" type="checkbox">
                                    <label for="unique-texts-labels" class="coding-progress-bar__check-label">Unique Texts with a label</label>
                                </li>
                                <li class="coding-progress-bar__dropdown-item">
                                    <input id="done" class="coding-progress-bar__check-input" type="checkbox">
                                    <label for="done" class="coding-progress-bar__check-label">Done</label>
                                </li>
                                <li class="coding-progress-bar__dropdown-item">
                                    <input id="wrong-scheme-messages" class="coding-progress-bar__check-input" type="checkbox">
                                    <label for="wrong-scheme-messages" class="coding-progress-bar__check-label">Wrong Scheme messages</label>
                                </li>
                                <li class="coding-progress-bar__dropdown-item">
                                    <input id="ws" class="coding-progress-bar__check-input" type="checkbox">
                                    <label for="ws" class="coding-progress-bar__check-label">WS %</label>
                                </li>
                                <li class="coding-progress-bar__dropdown-item">
                                    <input id="not-coded-messages" class="coding-progress-bar__check-input" type="checkbox">
                                    <label for="not-coded-messages" class="coding-progress-bar__check-label">Not Coded messages</label>
                                </li>
                                <li class="coding-progress-bar__dropdown-item">
                                    <input id="NC" class="coding-progress-bar__check-input" type="checkbox">
                                    <label for="NC" class="coding-progress-bar__check-label">NC %</label>
                                </li>
                            </ul>
                        </li>
                        <li class="coding-progress-bar__item">
                            <select id="keyword"></select>
                        </li>
                        <li class="coding-progress-bar__item">
                            <div class="coding-progress-bar__group">
                                <input class="coding-progress-bar__input" type="text" id="input-keyword" value="" placeholder="Enter keyword...">
                                <button class="coding-progress-bar__button" id="search"><i class="fas fa-search"></i></button>
                            </div>
                        <li>
                        <li class="coding-progress-bar__item">
                            <a class="btn" id="reset" href="#">View All</a>
                        </li>
                        <li class="coding-progress-bar__item coding-progress-bar__item--end">
                            <div class="coding-progress-bar__group">
                                <div class="coding-progress-bar__label">Last Updated:</div>
                                <div class="coding-progress-bar__text" id="last-update"></div>
                            </div>
                        <li>
                    </ul>
                </div>
            
                <div class="table-responsive">
                    <table id="codingtable" class="coding-progress-table">
                        <thead></thead>
                        <tbody></tbody>
                    </table>
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

        let toggleDropdownMenu = document.querySelector(".filter-columns"),
            dropdownMenu = document.querySelector(".coding-progress-bar__dropdown-menu");
        toggleDropdownMenu.addEventListener("click", function() {
            if (!dropdownMenu.style.display) {
                dropdownMenu.style.display = "block"
            } else if (dropdownMenu.style.display === "none") {
                dropdownMenu.style.display = "block";
            } else {
                dropdownMenu.style.display = "none";
            }
        });  
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
        let html = `<section> 
            <div class="traffic-metrics">
                <ul class="traffic-metrics__items">
                    <li class="traffic-metrics__item">
                        <b class="traffic-metrics__text">${title}</b>
                    </li>
                    <li class="traffic-metrics__item">
                        <div class="traffic-metrics__group">
                            <div class="traffic-metrics__label">Timescale:</div>
                            <input class="traffic-metrics__input" type="button" id="buttonUpdateView10Minutes" value="10 minutes">
                            <input class="traffic-metrics__input" type="button" id="buttonUpdateViewOneDay" value="1 day">
                        </div>
                    </li>
                    <li class="traffic-metrics__item">
                        <div class="traffic-metrics__group">
                            <div class="traffic-metrics__label">TimeFrame:</div>
                            <select class="traffic-metrics__select" id="timeFrame">
                                <option value="default">Default</option>
                                <option value="1">48 Hours</option>
                                <option value="6">7 days</option>
                                <option value="13">14 days</option>
                                <option value="29">30 days</option>
                            </select> 
                        </div>
                    </li>
                    <li class="traffic-metrics__item">
                        <div class="traffic-metrics__group">
                            <div class="traffic-metrics__label">Last Updated:</div>
                            <div class="traffic-metrics__text" id="lastUpdated"></div>
                        </div>
                    <li>
                </ul>
            </div> 

            <div class="traffic-metrics-charts">
                <div class="traffic-metrics-chart">
                    <div class="traffic-metrics-chart__ctrl">
                        <div class="traffic-metrics-chart__label" type="text">Set the maximum number of incoming messages you want to see</div> 
                        <input class="traffic-metrics-chart__input" type="number" id="buttonYLimitReceived" step="100" min="10">
                    </div>
                    <div class="total_received_sms_graph"></div>
                </div> 
                <div class="traffic-metrics-chart">
                    <div class="traffic-metrics-chart__ctrl">
                        <div class="traffic-metrics-chart__label" type="text">Set the maximum number of outgoing messages you want to see</div> 
                        <input class="traffic-metrics-chart__input" type="number" id="buttonYLimitSent" step="500" min="10">
                    </div>
                    <div class="total_sent_sms_graph"></div>
                </div> 
                <div class="traffic-metrics-chart">
                    <div class="traffic-metrics-chart__ctrl">
                        <div class="traffic-metrics-chart__label" type="text">Set the maximum number of failed messages you want to see</div> 
                        <input class="traffic-metrics-chart__input" type="number" id="buttonYLimitFailed" step="50" min="10">
                    </div>
                    <div class="total_failed_sms_graph"></div> 
                </div>
                <div class="card shadow total_failed_sms_graph my-4"></div> 
            </section>
            <div class="accordion" id="accordionExample">
                <div id="headingOne">
                    <h2 class="mb-2">
                        <button class="btn btn-brown shadow-none" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
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
        </div> `;
        // Insert the HTML into the DOM
        UIController.statusBody.insertAdjacentHTML("beforeend", html);
    }

    static addSystemsGraphs() {
        UIController.resetUI();
        let html = `<section> 
            <div class="system-metrics">
                <ul class="system-metrics__items">
                    <div class="system-metrics__group">
                        <div class="system-metrics__label">Last Updated:</div>
                        <div class="system-metrics__text" id="lastUpdated"></div>
                    </div>
                </ul>
            </div> 
            <div class="system-metrics__charts">
                <div class="disc-usage-chart"></div>
                <div class="memory-utilization-chart"></div>
                <div class="cpu-utilization-chart"></div> 
            </div>
        </section> `;
        UIController.statusBody.insertAdjacentHTML("beforeend", html);
    }
}
