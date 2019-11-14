var config = {
    apiKey: "AIzaSyCUHQE4gDk35-BtZrlNEkNbr1nX2Yn4l5Q",
    authDomain: "avf-dashboards.firebaseapp.com",
    databaseURL: "https://avf-dashboards.firebaseio.com",
    projectId: "avf-dashboards",
    storageBucket: "avf-dashboards.appspot.com",
    messagingSenderId: "1063777163571",
    appId: "1:1063777163571:web:57361756b9ecb959"
};
firebase.initializeApp(config);
const mediadb = firebase.firestore();
const settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
