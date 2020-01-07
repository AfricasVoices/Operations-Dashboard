// GLOBAL APP CONTROLLER
class Controller {
    static setupEventListeners() {
        let DOMstrings = UIController.getDOMstrings();
        document.querySelector(DOMstrings.logoutBtn).addEventListener('click', Controller.ctrlLogoutDashboard);
        document.querySelector(DOMstrings.codingProgressLinkSelector).addEventListener('click', Controller.navigateToCodingProgress);
        document.querySelector(DOMstrings.projectMenu).addEventListener('click', Controller.navigateToSelectedProject);          
    };

    static resetDashboard() {
        let DOMstrings = UIController.getDOMstrings();
        document.querySelector(DOMstrings.codingProgressContainer).innerHTML = "";
        document.querySelector(DOMstrings.graphContainer).innerHTML = "";
    }
    
    static ctrlLogoutDashboard() {
        AuthController.logout()
    };

    static navigateToCodingProgress(e) {
        Controller.resetDashboard()
        if(e.target && e.target.nodeName == "A") {
            // Add the coding progress section to the UI
            UIController.addCodingProgressSection();
            // Get data for coding progress table
            DataController.watchCodingProgress(UIController.update_progress_ui);
        }
    };
    
    static navigateToSelectedProject(e) {
        let collection;
        Controller.resetDashboard()
        if(e.target && e.target.nodeName == "A") {
            console.log(e.target.innerText)
            collection = e.target.innerText
        }
        // Add the graphs container to the UI
        UIController.addGraphs(collection);
        // Update and show the Graphs
        DataController.watchProjectData(collection, GraphController.update_graphs);
    };  

    static init() {
        console.log('Application has started.');
        // authorize user
        AuthController.getUser();
        // set up event listeners
        Controller.setupEventListeners();
        // Add the dropdown menu to the UI
        DataController.watchActiveProjects(UIController.addDropdownMenu);
        // Add the coding progress section to the UI
        UIController.addCodingProgressSection();
        // Get data for coding progress table
        DataController.watchCodingProgress(UIController.update_progress_ui);
    } 
} 
// initialize firestore
const mediadb = firebase.firestore();
const settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
// initialize the app 
Controller.init();
