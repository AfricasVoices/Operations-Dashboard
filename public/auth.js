// AUTH CONTROLLER
var authController = (function() {
    return {
        // Authentication state listener
        initApp: function() {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    console.log('Login Successful');
                    console.log("Attempting to bind: " + user.email)
                    console.log('Bind Successful');
                    return user;
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