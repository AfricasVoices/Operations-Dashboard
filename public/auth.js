class AuthController {
    // Authentication state listener
    static getUser() {
        firebase.auth().onAuthStateChanged(user => {
            if (user && user.email.match(".*@africasvoices.org$")){
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