// GLOBAL APP CONTROLLER
class Controller {
    static setupEventListeners() {
        let DOMstrings = UIController.getDOMstrings();
        document
            .querySelector(DOMstrings.logoutBtn)
            .addEventListener("click", AuthController.logout);
        document
            .querySelector(DOMstrings.codingProgressLinkSelector)
            .addEventListener("click", Controller.navigateToCodingProgress);
        document
            .querySelector(DOMstrings.projectMenu)
            .addEventListener("click", Controller.navigateToSelectedProject);
    }

    static resetUI() {
        let DOMstrings = UIController.getDOMstrings();
        document.querySelector(DOMstrings.codingProgressContainer).innerHTML = "";
        document.querySelector(DOMstrings.graphContainer).innerHTML = "";
    }

    static displayCodingProgress() {
        // Add the coding progress section to the UI
        UIController.addCodingProgressSection();
        // Get data for coding progress table
        let unsubscribeFunc = DataController.watchCodingProgress(UIController.updateProgressUI);
        DataController.registerSnapshotListener(unsubscribeFunc);
    }

    static displaySelectedProject(project) {
        // Add the graphs container to the UI
        UIController.addGraphs(project);
        // Update and show the Graphs
        let unsubscribeFunc = DataController.watchProjectTrafficData(
            project,
            GraphController.updateGraphs
        );
        DataController.registerSnapshotListener(unsubscribeFunc);
    }

    static navigateToCodingProgress(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.resetUI();
            DataController.detachSnapshotListener();
            location.hash = "coding_progress";
            Controller.displayCodingProgress();
        }
    }

    static navigateToSelectedProject(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.resetUI();
            DataController.detachSnapshotListener();
            console.log(e.target.innerText);
            let project = e.target.innerText;
            location.hash = project;
            Controller.displaySelectedProject(project);
        }
    }

    static deepLinktoPage(activeProjectsData) {
        let activeProjects = [];
        activeProjectsData.forEach(project => {
            activeProjects.push(project.project_name);
        });
        if (activeProjects.includes(Controller.hash)) {
            let project = Controller.hash;
            Controller.displaySelectedProject(project);
        } else {
            history.replaceState(null, null, " ");
            Controller.displayCodingProgress();
        }
    }

    static init() {
        console.log("Application has started.");
        // Authorize user
        AuthController.getUser();
        // set up event listeners
        Controller.setupEventListeners();
        // Add the dropdown menu to the UI
        DataController.watchActiveProjects(UIController.addDropdownMenu);
        // Get hash value
        Controller.hash = window.location.hash.substring(1);
        // Navigate appropriately according to the hash value
        if (Controller.hash) {
            if (Controller.hash == "coding_progress") {
                Controller.displayCodingProgress();
            }
            DataController.watchActiveProjects(Controller.deepLinktoPage);
        } else {
            Controller.displayCodingProgress();
        }
    }
}

// Initialize the application
const mediadb = firebase.firestore(),
    settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
Controller.init();
