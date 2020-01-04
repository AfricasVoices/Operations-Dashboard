// AUTH CONTROLLER
class AuthController {
    // Authentication state listener
    static login() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log("Login Successful");
            } else {
                window.location.replace("auth.html")
            }
        });
    }

    static logout() {
        firebase.auth().signOut()
            .catch(err => {
                console.log(err);
            })
    }
}