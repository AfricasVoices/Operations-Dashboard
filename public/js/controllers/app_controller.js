import { UIController } from "./ui_controller.js";
import { DataController } from "./data_controller.js";
import { AuthController } from "./auth_controller.js";
import { TrafficMetricsController } from "./traffic_metrics_controller.js";

// GLOBAL APP CONTROLLER
class Controller {
    static setupEventListeners() {
        Controller.DOMstrings = UIController.getDOMstrings();
        document
            .querySelector(Controller.DOMstrings.logoutBtn)
            .addEventListener("click", AuthController.logout);
        document
            .querySelector(Controller.DOMstrings.codingProgressLinkSelector)
            .addEventListener("click", Controller.navigateToCodingProgress);
        document
            .querySelector(Controller.DOMstrings.projectMenu)
            .addEventListener("click", Controller.navigateToSelectedProject);
        document
            .querySelector(Controller.DOMstrings.systemsMenu)
            .addEventListener("click", Controller.navigateToSelectedSystem);
    }

    static clearAllTimers() {
        import("./traffic_graphs_controller.js").then(module => {
            module.TrafficGraphsController.clearTimers();
        });
        import("./systems_graphs_controller.js").then(module => {
            module.SystemsGraphsController.clearTimers();
        });
    }

    static resetActiveLink() {
        let elements = document.querySelectorAll(Controller.DOMstrings.activeLinks);
        elements.forEach((element) => {
            element.classList.remove(Controller.DOMstrings.activeLinkClassName);
        });
    }

    static displayCodingProgress() {
        // Add the coding progress section to the UI
        UIController.addCodingProgressSection();
        DataController.watchActiveProjects(UIController.addkeywordOptions);
        Controller.resetActiveLink();
        document
            .querySelector(Controller.DOMstrings.codingProgressLinkSelector)
            .classList.add(Controller.DOMstrings.activeLinkClassName);
        // Get data for coding progress table
        import("./coding_progress_table_controller.js").then((module) => {
            let unsubscribeFunc = DataController.watchCodingProgress(
                module.CodingProgressTableController.updateCodingProgressTable
            );
            DataController.registerSnapshotListener(unsubscribeFunc);
        });
    }

    static displayProject(project) {
        // Add the graphs container to the UI
        UIController.addGraphs(project);
        Controller.resetActiveLink();
        document
            .querySelector(Controller.DOMstrings.trafficsLinkSelector)
            .classList.add(Controller.DOMstrings.activeLinkClassName);
        // Update and show the Graphs
        import("./traffic_graphs_controller.js").then((module) => {
            let unsubscribeFunc = DataController.watchProjectTrafficData(
                project,
                module.TrafficGraphsController.updateGraphs
            );
            DataController.registerSnapshotListener(unsubscribeFunc);
        });
        const { updateTotals, displayATCredits } = TrafficMetricsController;
        // Update and show the Metrics
        DataController.projectTrafficDataMetrics(project, updateTotals);
        // Update Africa's Talking balance
        DataController.watchATCredits(project, displayATCredits);
    }

    static displayServerMetrics() {
        UIController.addSystemsGraphs();
        // Update and show the Graphs
        import("./systems_graphs_controller.js").then((module) => {
            let unsubscribeFunc = DataController.watchServerMetrics(
                module.SystemsGraphsController.updateGraphs
            );
            DataController.registerSnapshotListener(unsubscribeFunc);
        });
    }

    static displayPipelines() {
        UIController.addPipelinesGraphs();
        // Update and show the Graphs
        import("./pipelines_controller.js").then((module) => {
            let unsubscribeFunc = DataController.watchPipelinesMetrics(
                module.PipelinesController.updatePipelinePage
            );
            DataController.registerSnapshotListener(unsubscribeFunc);
        });
    }

    static navigateToCodingProgress(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.clearAllTimers();
            DataController.detachSnapshotListener();
            window.location.hash = "coding_progress";
            Controller.displayCodingProgress();
        }
    }

    static navigateToSelectedProject(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.clearAllTimers();
            DataController.detachSnapshotListener();
            console.log(e.target.innerText);
            let project = e.target.innerText;
            window.location.hash = `traffic-${project}`;
            Controller.displayProject(project);
        }
    }

    static navigateToSystems(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.resetActiveLink();
            document
                .querySelector(Controller.DOMstrings.systemsLinkSelector)
                .classList.add(Controller.DOMstrings.activeLinkClassName);
            Controller.clearAllTimers();
            DataController.detachSnapshotListener();
            window.location.hash = "systems";
            Controller.displaySystems();
        }
    }

    static navigateToPipelines(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.clearAllTimers();
            DataController.detachSnapshotListener();
            window.location.hash = "pipelines";
            Controller.displayPipelines();
        }
    }

    static displayDeepLinkedTrafficPage(activeProjectsData) {
        let activeProjects = [],
            page_route = window.location.hash.substring(1);
        activeProjectsData.forEach((project) => {
            activeProjects.push(project.project_name);
        });
        let project = page_route.split("traffic-")[1];
        if (activeProjects.includes(project)) {
            Controller.displayProject(project);
        } else {
            // update the URL and replace the item in the browser history
            // without reloading the page
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
        let page_route = window.location.hash.substring(1);
        // Navigate appropriately according to the hash value
        if (page_route) {
            if (page_route == "coding_progress") {
                Controller.displayCodingProgress();
            } else if (page_route == "systems") {
                Controller.displaySystems();
            } else if (page_route == "pipelines") {
                Controller.displayPipelines();
            } else if (page_route.startsWith("traffic-")) {
                DataController.watchActiveProjects(Controller.displayDeepLinkedTrafficPage);
            } else {
                // update the URL and replace the item in the browser history
                // without reloading the page
                history.replaceState(null, null, " ");
                Controller.displayCodingProgress();
            }
        } else {
            Controller.displayCodingProgress();
        }
    }
}

// Initialize the application
export const mediadb = firebase.firestore();
Controller.init();
