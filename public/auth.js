// AUTH CONTROLLER
class AuthController {
    // Authentication state listener
    static get_user() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log("User Authorized");
            } else {
                window.location.replace("auth.html")
            }
        });
    }

    static logout() {
        firebase.auth().signOut()
            .catch(err => {
                alert("An error occurred")
                console.log(err);
            })
    }
}