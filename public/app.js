// AUTH CONTROLLER
var authController = (function() {

    return {
        //Authentication state listener
        initApp: function() {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    console.log('Login Successful');
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
    // coding_progress data
    // sms traffic data
})();

// GRAPH CONTROLLER
var graphController = (function() {

})();

// UI CONTROLLER
var UIController = (function() {

    
    
    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value,
            }
            
            // var traffics = document.getElementsByClassName('dropdown-item');
            // for (var i = 0; i < traffics.length; i++) {
            //     traffics[i].onclick = function () {
            //         console.log(this.innerText)  
            //     }
            // }
        }
    }

})();

// // GLOBAL APP CONTROLLER
var controller = (function(authCtrl, dataCtrl, graphCtrl, UICtrl) {
    window.onload = function () {
        authCtrl.initApp();
    };
    // authCtrl.logout()
    var input = UICtrl.getInput();
    console.log(input)
    
})(authController, dataController, graphController, UIController);

// controller.init();