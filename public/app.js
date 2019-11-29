// AUTH CONTROLLER
var authController = (function() {
    return {
        //Authentication state listener
        initApp: function() {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    console.log('Login Successful');
                    console.log("Attempting to bind: " + user.email)
                    console.log('Bind Successful');
                    return user;
                } else {
                    window.location.replace('auth.html')
                }
            });
        },

        //logout function
        logout: function() {
            firebase.auth().signOut()
                .catch(function (err) {
                    console.log(err);
                })
        }
    };
})();

// DATA CONTROLLER
var dataController = (function() {
    var data = [];
    var gdata = [];
    var data2 = [];
    var offset = new Date()
    timerange = 30
    offset.setDate(offset.getDate() - timerange)
    var iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L");
    offsetString = iso(offset)

    var updateData = function(res) {
        // Update data every time it changes in firestore
        res.docChanges().forEach(change => {

            const doc = { ...change.doc.data(), id: change.doc.id };

            switch (change.type) {
                case 'added':
                    data2.push(doc);
                    break;
                case 'modified':
                    const index = data2.findIndex(item => item.id == doc.id);
                    data2[index] = doc;
                    break;
                case 'removed':
                    data2 = data2.filter(item => item.id !== doc.id);
                    break;
                default:
                    break;
            }
        });
        // console.log(data2)
    }
    
    return {
        resetData: function() {
            data = [];
            gdata = [];
            data2 = [];
            operators = new Set()
        }, 

        getProject: function(update) {
            mediadb.collection('active_projects').onSnapshot(res => {
                // console.log(res);
                // Update data every time it changes in firestore
                updateData(res)
                update(data2);
            });  
        },

        getDocument: function(update) {
            mediadb.doc('metrics/coda').onSnapshot(function(res) {
                update(res.data());
            });
        },

        getCollection: function(collection, update) {   
            mediadb.collection(`/metrics/rapid_pro/${collection}/`).where("datetime", ">", offsetString).onSnapshot(res => {
                // console.log(res)
                // Update data every time it changes in firestore
                res.docChanges().forEach(change => {

                    const doc = { ...change.doc.data(), id: change.doc.id };
        
                    switch (change.type) {
                        case 'added':
                            gdata.push(doc);
                            break;
                        case 'modified':
                            const index = gdata.findIndex(item => item.id == doc.id);
                            gdata[index] = doc;
                            break;
                        case 'removed':
                            gdata = gdata.filter(item => item.id !== doc.id);
                            break;
                        default:
                            break;
                    }
                });
                // console.log(gdata)
                update(gdata);
            });
        }
    };
})();

// UI CONTROLLER
var UIController = (function() {
    var DOMstrings = {
        projectMenu: '.select__project',
        codingProgressLink: '.codingprogress__link',
        codingProgressContainer: '.codingprogress__table',
        graphContainer: '.graph__list',
        logoutBtn: '.logout__btn',
    };

    return {

        getDOMstrings: function() {
            return DOMstrings;
        },

        addDropdownMenu: function(data) {
            var html, newHtml;
            html = `<a id="project" class="dropdown-item">%project_name%</a><div class="dropdown-divider"></div>`
            // Replace the placeholder text with some actual data
            data.forEach(function (obj) {
                newHtml = html.replace('%project_name%', obj.project_name);
                document.querySelector(".dropdown-menu").insertAdjacentHTML('beforeend', newHtml);
            });
            
        },

        addSection: function() {
            var html;
            html = `<div class="container container-fluid table-responsive">
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
            document.querySelector(".coding_progress").insertAdjacentHTML('beforeend', html);
        },

        update_progress_ui: function(data) {
            // console.log("update_ui: " + JSON.stringify(data));
            var status_body = document.getElementById('coding_status_body');
            while (status_body.firstChild) {
                // status_body.removeChild(status_body.firstChild);
            }
            last_update = data["last_update"]
            document.getElementById('last_update').innerText = "Last updated: " + last_update
            for (var dataset_id in data["coding_progress"]) {
                var messages_count = data["coding_progress"][dataset_id]["messages_count"]
                var messages_with_label = data["coding_progress"][dataset_id]["messages_with_label"]
                var wrong_scheme_messages = data['coding_progress'][dataset_id]['wrong_scheme_messages']
                var not_coded_messages = data['coding_progress'][dataset_id]['not_coded_messages']
                var dataset_link = document.createElement("a")
                    dataset_link.setAttribute("href", "https://web-coda.firebaseapp.com/?dataset="+dataset_id)
                    dataset_link.setAttribute('target', '_blank')
                    dataset_link.innerText = dataset_id
                rw = status_body.insertRow()
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
                    var Done = $(this).text();
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
        }, 

        addGraphs: function(title) {
            var html;
            html = `<div class="container"> 
                <div class="d-md-flex justify-content-between p-1">
                    <span class="txt-brown my-auto title"><b>%collection%</b></span>
                    <div>
                        <span class="align-content-end font-weight-bold">Timescale</span>
                        <input class="mr-2 btn btn-sm btn-brown" type="button" id="buttonUpdateView10Minutes" value="10 minutes">
                        <input class="btn btn-sm btn-brown" type="button" id="buttonUpdateViewOneDay" value="1 day"> 
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
            newHtml = html.replace('%collection%', title);
            document.querySelector(".coding_progress").insertAdjacentHTML('beforeend', newHtml);
        }
    }
})();

// GLOBAL APP CONTROLLER
var controller = (function(authCtrl, dataCtrl, graphCtrl, UICtrl) {

    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();
        document.querySelector(DOM.logoutBtn).addEventListener('click', ctrlLogoutDashboard);
        document.querySelector(DOM.codingProgressLink).addEventListener('click', ctrlDisplayCodingProgress);
        document.querySelector(DOM.projectMenu).addEventListener('click', ctrlDisplayProject);          
    };
    
    // Logout of the dashboard
    var ctrlLogoutDashboard = function() {
        authCtrl.logout()
    };

    var ctrlDisplayCodingProgress = function(e) {
        if(e.target && e.target.nodeName == "A") {
            window.location.reload();
        }
    };
    
    var ctrlDisplayProject = function(e) {
        var collection;
        var DOM = UICtrl.getDOMstrings();
        document.querySelector(DOM.codingProgressContainer).innerHTML = "";
        document.querySelector(DOM.graphContainer).innerHTML = "";
        if(e.target && e.target.nodeName == "A") {
            console.log(e.target.innerText)
            collection = e.target.innerText
        }
        dataCtrl.resetData()
        // Add the graphs container to the UI
        UICtrl.addGraphs(collection);
        // Update and show the Graphs
        dataCtrl.getCollection(collection, graphCtrl.update_graphs);
    };  

    return {
        init: function() {
            console.log('Application has started.');
            authCtrl.initApp();
            setupEventListeners();
            dataCtrl.getProject(UICtrl.addDropdownMenu);
            UICtrl.addSection();
            dataCtrl.getDocument(UICtrl.update_progress_ui);
        }
    };
    
})(authController, dataController, graphController, UIController);
const mediadb = firebase.firestore();
const settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
controller.init();
























