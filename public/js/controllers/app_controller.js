import { UIController } from "./ui_controller.js";
import { DataController } from "./data_controller.js";
import { AuthController } from "./auth_controller.js";

// GLOBAL APP CONTROLLER
class Controller {
    static setupEventListeners() {
        Controller.DOMstrings = UIController.getDOMstrings();
        document
            .querySelectorAll(Controller.DOMstrings.logoutBtns).forEach(btn => {
                btn.addEventListener("click", AuthController.logout);
            });
        document
            .querySelector(Controller.DOMstrings.codingProgressLinkSelector)
            .addEventListener("click", Controller.navigateToCodingProgress);
        document
            .querySelector(Controller.DOMstrings.projectMenu)
            .addEventListener("click", Controller.navigateToSelectedProject);
        document
            .querySelector(Controller.DOMstrings.systemsLinkSelector)
            .addEventListener("click", Controller.navigateToSystems);

        let mobileNav = document.querySelector(".mobile-nav"),
            backdrop = document.querySelector(".backdrop");
        function displayMobileNav() {
            mobileNav.style.display = 'block';
            backdrop.style.display = 'block';
        }
        function hideMobileNav() {
            mobileNav.style.display = 'none';
            backdrop.style.display = 'none';
        }
        document
            .querySelector(".toggle-button")
            .addEventListener("click", function() {
                displayMobileNav()
            });
        document
            .querySelector(".close-button")
            .addEventListener("click", function() {
                hideMobileNav();
            });
        document
            .querySelector(Controller.DOMstrings.mobileCodingProgressLinkSelector)
            .addEventListener("click", function(event) {
                hideMobileNav();
                Controller.navigateToCodingProgress(event);
            });
        document
            .querySelector(Controller.DOMstrings.mobileProjectMenu)
            .addEventListener("change", function(event) { 
                hideMobileNav();
                Controller.navigateToSelectedProject(event, this.value) 
            });
        document
            .querySelector(Controller.DOMstrings.mobileSystemsLinkSelector)
            .addEventListener("click", function(event) {
                hideMobileNav();
                Controller.navigateToSystems(event)
            });
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
    }

    static displaySystems() {
        UIController.addSystemsGraphs();
        Controller.resetActiveLink();
        document
            .querySelector(Controller.DOMstrings.systemsLinkSelector)
            .classList.add(Controller.DOMstrings.activeLinkClassName);
        // Update and show the Graphs
        import("./systems_graphs_controller.js").then((module) => {
            let unsubscribeFunc = DataController.watchSystemsMetrics(
                module.SystemsGraphsController.updateGraphs
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

    static navigateToCodingProgressOnMobile(e) {
        mobileNav.style.display = 'none';
        backdrop.style.display = 'none';
        Controller.navigateToCodingProgress(e);
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

    static navigateToSelectedProjectOnMobile(project) {
        mobileNav.style.display = 'none';
        backdrop.style.display = 'none';
        Controller.clearAllTimers();
        DataController.detachSnapshotListener();
        window.location.hash = `traffic-${project}`;
        Controller.displayProject(project);
    }

    static navigateToSystems(e) {
        if (e.target && e.target.nodeName == "A") {
            Controller.clearAllTimers();
            DataController.detachSnapshotListener();
            window.location.hash = "systems";
            Controller.displaySystems();
        }
    }

    static navigateToSystemsOnMobile(e) {
        mobileNav.style.display = 'none';
        backdrop.style.display = 'none';
        Controller.navigateToSystems(e)
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
