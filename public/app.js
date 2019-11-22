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
        
})();

// GRAPH CONTROLLER
var graphController = (function() {

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