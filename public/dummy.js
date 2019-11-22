// AUTH CONTROLLER
var authController = (function() {
    var isAuthenticated;

    return {
        //Authentication state listener
        initApp: function() {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    isAuthenticated = true;
                    console.log('Login Successful');
                    console.log("Attempting to bind: " + user.email)
                    console.log('Bind Successful');
                    return isAuthenticated;
                } else {
                    window.location.replace('auth.html')
                }
            });
        },

        //login function
        login: function() {
            // FirebaseUI config.
            var uiConfig = {
                signInSuccessUrl: "index.html",
                signInOptions: [
                    firebase.auth.GoogleAuthProvider.PROVIDER_ID
                ],     
            };
            // Initialize the FirebaseUI Widget using Firebase.
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            // The start method will wait until the DOM is loaded.
            ui.start('#firebaseui-auth-container', uiConfig);
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
    const progress_fs = firebase.firestore();
    const settings = {timestampsInSnapshots: true};
    progress_fs.settings(settings);
    var data = [];
    var offset = new Date()
    timerange = 30
    offset.setDate(offset.getDate() - timerange)
    var iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L");
    offsetString = iso(offset)
// ========================================================================================================== 
    // write function that accepts data 
    // format & return the data 
    data.forEach(function (d) {
        d.datetime = new Date(d.datetime);
        d.day = dayDateFormat(new Date(d.datetime))
        d.total_received = +d.total_received
        d.total_sent = +d.total_sent
        d.total_pending = +d.total_pending
        d.total_errored = +d.total_errored
        d.NC_received = +d.operators["NC"]["received"]
        d.telegram_received= +d.operators["telegram"]["received"]
        d.golis_received= +d.operators["golis"]["received"]
        d.hormud_received= +d.operators["hormud"]["received"]
        d.nationlink_received= +d.operators["nationlink"]["received"]
        d.somnet_received= +d.operators["somnet"]["received"]
        d.somtel_received= +d.operators["somtel"]["received"]
        d.telesom_received= +d.operators["telesom"]["received"]
        d.golis_sent= +d.operators["golis"]["sent"]
        d.hormud_sent= +d.operators["hormud"]["sent"]
        d.nationlink_sent= +d.operators["nationlink"]["sent"]
        d.somnet_sent= +d.operators["somnet"]["sent"]
        d.somtel_sent= +d.operators["somtel"]["sent"]
        d.telesom_sent= +d.operators["telesom"]["sent"]
        d.telegram_sent= +d.operators["telegram"]["sent"]
        d.NC_sent = +d.operators["NC"]["sent"]
        Object.keys(d.operators).sort().forEach(function(key) {
            if (!(key in operators)) {
                operators.add(key)
            };
        });
    });

    // Sort data by date
    data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
// ---------------------------------------------------
    var offsetWeek = new Date()
    offsetWeek.setDate(offsetWeek.getDate() - TIMEFRAME_WEEK)

    var offsetMonth = new Date()
    offsetMonth.setDate(offsetMonth.getDate() - TIMEFRAME_MONTH)
// -----------------------------------------------------
    // Set default y-axis limits
    dataFilteredWeek = data.filter(a => a.datetime > offsetWeek);
    dataFilteredMonth = data.filter(a => a.datetime > offsetMonth);
// =========================================================================================================
// for loop for both received and sent
    // Group either sent or received data by day
    var dailyTotal = d3.nest()
        .key(function(d) { return d.day; })
        .rollup(function(v, msg) { return {
            // msg is received or sent
            NC_received: d3.sum(v, function(d) {return d[`NC_${msg}`]}),
            telegram: d3.sum(v, function(d) {return d[`telegram_${msg}`]}),
            hormud: d3.sum(v, function(d) {return d[`hormud_${msg}`]}),
            nationlink: d3.sum(v, function(d) {return d[`nationlink_${msg}`]}),
            somnet: d3.sum(v, function(d) {return d[`somnet_${msg}`]}),
            somtel: d3.sum(v, function(d) {return d[`somtel_${msg}`]}),
            telesom: d3.sum(v, function(d) {return d[`telesom_${msg}`]}),
            golis: d3.sum(v, function(d) {return d[`golis_${msg}`]}),
            total: d3.sum(v, function(d) {return d[`total_${msg}`]}),
        };
         })
        .entries(dataFilteredMonth);

    // Flatten nested data for stacking
    for (var entry in dailyTotal) {
        var valueList = dailyTotal[entry].value
        for (var key in valueList) {
            dailyTotal[entry][key] = valueList[key]
        }
        // concat received or sent
        dailyTotal[entry]["day"] = dailyTotal[entry].key
        delete dailyTotal[entry]["value"]
        delete dailyTotal[entry]["key"]
    }

    // Create keys to stack by based on operator and direction
    receivedKeys = []
    sentKeys = []

    var receivedStr = ""
    var sentStr = ""

    operators = Array.from(operators)

    for (var i=0; i<operators.length; i++) {
        receivedStr = operators[i] + msg;
        receivedKeys.push(receivedStr)
        sentStr = operators[i] + "_sent"
        sentKeys.push(sentStr)
    }

    // Stack data by keys created above by either received or sent
    let stackDaily = d3.stack()
            .keys(receivedKeys)
    let DataStackedDaily = stackReceivedDaily(dailyTotal)
// =======================================================================================================
    return {
        getDocument: function(document) {
            mediadb.doc(`/metrics/${document}`).onSnapshot(res => {
                data = res.data(); 
                return data;
            })
        },

        getCollection: function(collection) {
            mediadb.collection(`/metrics/rapid_pro/${collection}`)
                .where("datetime", ">", offsetString)
            .onSnapshot(res => {
                console.log(res);
                // Update data every time it changes in firestore
                res.docChanges().forEach(change => {
                    const doc = { ...change.doc.data(), id: change.doc.id };
                    switch (change.type) {
                        case 'added':
                            data.push(doc);
                            break;
                        case 'modified':
                            const index = data.findIndex(item => item.id == doc.id);
                            data[index] = doc;
                            break;
                        case 'removed':
                            data = data.filter(item => item.id !== doc.id);
                            break;
                        default:
                            break;
                    }
                })
                console.log(data);
                return data;
            })
        },
    }    
})();

// GRAPH CONTROLLER
var graphController = (function() {
    const TIMEFRAME_WEEK = 7;
    const TIMEFRAME_MONTH = 30;
    var chartTimeUnit = "10min";
    var isYLimitReceivedManuallySet = false;
    var isYLimitSentManuallySet = false;

    function add_one_day_to_date(date) {
        var newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }
})();

// UI CONTROLLER
var UIController = (function() {

    return {
        update_progress_ui: function(data) {
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
                console.log(dataset_id, messages_count, messages_with_label,wrong_scheme_messages,not_coded_messages);
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
        }
    }
})();

// // GLOBAL APP CONTROLLER
var controller = (function(authCtrl, dataCtrl, graphCtrl, UICtrl) {
    window.onload = function () {
        authCtrl.initApp();
    };
    
    document.querySelector(".btn-brown").addEventListener('click', function() {
        authCtrl.logout()
        // should be in the UI controller
        // var newContent = 
    });

    // applies when the user has been logged out
    // document.querySelector("#firebaseui-auth-container").addEventListener('click', function() {
    //     authCtrl.login() 
    // })

    // Get the element, add a click listener...
    document.getElementById("coding-progress").addEventListener("click", function(e) {
        // e.target is the clicked element!
        // If it was a list item
        if(e.target && e.target.nodeName == "A") {
            // List item found!  Output the ID!
            console.log(e.target.innerHTML)
        }
    });

    // Get the element, add a click listener...
    document.getElementById("projects").addEventListener("click", function(e) {
        // e.target is the clicked element!
        // If it was a link
        if(e.target && e.target.nodeName == "A") {
            // e.target.matches("a.classA")
            // List item found!  Output the ID!
            // console.log("link", e.target.id.replace("project-", ""), " was clicked!");
            if(e.target.id == "project-imaqal") {
                console.log("IMAQAL")
                // Get the collection name  
                // When we will be fetching projects from the db 
                // the target id will be set to the collection name
                var collection = "IMAQAL" 
                // Add the collection name to the data controller
                // Display the graphs
            }
            if(e.target.id == "project-worldbank") {
                console.log("WORLDBANK")
                var collection = "WorldBank-PLR" 
            }
            
        }
    });    
    
})(authController, dataController, graphController, UIController);

// controller.init();