// GLOBAL APP CONTROLLER
class Controller {

    static setupEventListeners() {
        let DOM = UIController.getDOMstrings();
        document.querySelector(DOM.logoutBtn).addEventListener('click', Controller.ctrlLogoutDashboard);
        document.querySelector(DOM.codingProgressLink).addEventListener('click', Controller.ctrlDisplayCodingProgress);
        document.querySelector(DOM.projectMenu).addEventListener('click', Controller.ctrlDisplayProject);          
    };
    
    static ctrlLogoutDashboard() {
        AuthController.logout()
    };

    // Navigate to coding progress page
    static ctrlDisplayCodingProgress(e) {
        if(e.target && e.target.nodeName == "A") {
            window.location.reload();
        }
    };
    
    // Navigate to the selected project graphs
    static ctrlDisplayProject(e) {
        let collection, DOM = UIController.getDOMstrings();
        document.querySelector(DOM.codingProgressContainer).innerHTML = "";
        document.querySelector(DOM.graphContainer).innerHTML = "";
        if(e.target && e.target.nodeName == "A") {
            console.log(e.target.innerText)
            collection = e.target.innerText
        }
        // Add the graphs container to the UI
        UIController.addGraphs(collection);
        // Update and show the Graphs
        DataController.getCollection(collection, GraphController.update_graphs);
    };  

    static init() {
        console.log('Application has started.');
        // authorize user
        AuthController.get_user();
        // set up event listeners
        Controller.setupEventListeners();
        // Add the dropdown menu to the UI
        DataController.getProject(UIController.addDropdownMenu);
        // Add the coding progress section to the UI
        UIController.addCodingProgressSection();
        // Get data for coding progress table
        DataController.getDocument(UIController.update_progress_ui);
    } 
} 
// initialize firestore
const mediadb = firebase.firestore();
const settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
// initialize the app 
Controller.init();
