// DATA CONTROLLER
var dataController = (function() {
    var data = [];
    var activeProjects = [];
    var offset = new Date();
    timerange = 30;
    offset.setDate(offset.getDate() - timerange);
    var iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L");
    offsetString = iso(offset);

    var updateData = function(response, input) {
        // Update data every time it changes in firestore
        response.docChanges().forEach(change => {

            const doc = { ...change.doc.data(), id: change.doc.id };

            switch (change.type) {
                case 'added':
                    input.push(doc);
                    break;
                case 'modified':
                    const index = input.findIndex(item => item.id == doc.id);
                    input[index] = doc;
                    break;
                case 'removed':
                    input = input.filter(item => item.id !== doc.id);
                    break;
                default:
                    break;
            }
        });
    }
    
    return {
        resetData: function() {
            data = [];
            activeProjects = [];
            operators = new Set()
        }, 

        getProject: function(update) {
            mediadb.collection('active_projects').onSnapshot(res => {
                // Update data every time it changes in firestore
                updateData(res, activeProjects);
                update(activeProjects);
            });  
        },

        getDocument: function(update) {
            mediadb.doc('metrics/coda').onSnapshot(function(res) {
                update(res.data());
            });
        },

        getCollection: function(collection, update) {   
            mediadb.collection(`/metrics/rapid_pro/${collection}/`).where("datetime", ">", offsetString).onSnapshot(res => {
                // Update data every time it changes in firestore
                updateData(res, data);
                update(data);
            });
        }
    };
})();