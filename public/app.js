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

    // Navigate to coding progress page
    var ctrlDisplayCodingProgress = function(e) {
        if(e.target && e.target.nodeName == "A") {
            window.location.reload();
        }
    };
    
    // Navigate to the selected project graphs
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
            // initialize the application
            authCtrl.initApp();
            // set up event listeners
            setupEventListeners();
            // Add the dropdown menu to the UI
            dataCtrl.getProject(UICtrl.addDropdownMenu);
            // Add the coding progress section to the UI
            UICtrl.addCodingProgressSection();
            // Get data for coding progress table
            dataCtrl.getDocument(UICtrl.update_progress_ui);
        }
    };
    
})(authController, dataController, graphController, UIController);
// initialize firestore
const mediadb = firebase.firestore();
const settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
// initialize the app 
controller.init();























