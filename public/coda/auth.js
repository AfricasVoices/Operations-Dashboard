//Authentication state listener
function initApp() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('Login Successful');
        } else {
        window.location = 'auth.html'
        }
    });
    }
    window.onload = function() {
    initApp();
    };
//logout function
function logout(){
    firebase.auth().signOut()
    .catch(function (err) {
      console.log(err);
    });
}
