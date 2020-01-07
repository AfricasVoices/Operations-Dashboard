// GLOBAL APP CONTROLLER
class Controller {
    static setupEventListeners() {
        let DOMstrings = UIController.getDOMstrings();
        document.querySelector(DOMstrings.logoutBtn).addEventListener('click', AuthController.logout);
        document.querySelector(DOMstrings.codingProgressLinkSelector).addEventListener('click', Controller.navigateToCodingProgress);
        document.querySelector(DOMstrings.projectMenu).addEventListener('click', Controller.navigateToSelectedProject);          
    };

    static resetUI() {
        let DOMstrings = UIController.getDOMstrings();
        document.querySelector(DOMstrings.codingProgressContainer).innerHTML = "";
        document.querySelector(DOMstrings.graphContainer).innerHTML = "";
    }

    static navigateToCodingProgress(e) {
        if(e.target && e.target.nodeName == "A") {
            Controller.resetUI()
            // Add the coding progress section to the UI
            UIController.addCodingProgressSection();
            // Get data for coding progress table
            DataController.watchCodingProgress(UIController.update_progress_ui);
        }
    };
    
    static navigateToSelectedProject(e) {
        if(e.target && e.target.nodeName == "A") {
            Controller.resetUI()
            console.log(e.target.innerText)
            let project = e.target.innerText
             // Add the graphs container to the UI
            UIController.addGraphs(project);
            // Update and show the Graphs
            DataController.watchProjectTrafficData(project, GraphController.update_graphs);
        }
    };  

    static init() {
        console.log('Application has started.');
        // Authorize user
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

// Initialize the application
const mediadb = firebase.firestore();
Controller.init();
