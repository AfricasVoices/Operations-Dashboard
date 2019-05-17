var config = {
    apiKey: "AIzaSyCiVcO6RuGxMPMDI2SiTpjcdXtko-PFAbw",
    authDomain: "learning-d3.firebaseapp.com",
    databaseURL: "https://learning-d3.firebaseio.com",
    projectId: "learning-d3",
    storageBucket: "learning-d3.appspot.com",
    messagingSenderId: "405879847462"
};
firebase.initializeApp(config);
const mediadb = firebase.firestore();
const settings = { timestampsInSnapshots: true };
mediadb.settings(settings);