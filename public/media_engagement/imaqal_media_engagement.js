//Permorm Authentication then update data 
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        console.log("Attempting to bind: " + user.email)
        const mediadb = firebase.firestore();
        const settings = { timestampsInSnapshots: true };
        mediadb.settings(settings);
        var data = [];
        mediadb.collection('/metrics/rapid_pro/IMAQAL/').onSnapshot(res => {
            console.log(res)
            // Update data every time it changes in firestore
            res.docChanges().forEach(change => {

                const doc = { ...change.doc.data(), id: change.doc.id };

                switch (change.type) {
                    case 'added':
                        data.push(doc);
                        break;
                    case 'modified':
                        const index = data.findIndex(item => item.id == doc.id);
                        data[index] = doc;
                        break;
                    case 'removed':
                        data = data.filter(item => item.id !== doc.id);
                        break;
                    default:
                        break;
                }
            });
            update(data);
        });
        console.log('Bind Successful');
    } else {
        window.location.replace('auth.html')
    }
});
