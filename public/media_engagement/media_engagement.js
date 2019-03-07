//Permorm Authentication then update data download
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        console.log("Attempting to bind: " + user.email)
        const mediadb = firebase.firestore();
        const settings = { timestampsInSnapshots: true };
        mediadb.settings(settings);
        var data = [];
        mediadb.collection('M&E Dashboard').onSnapshot(res => {
            // Update data every time it changes in firestore
            res.docChanges().forEach(change => {

                const doc = {...change.doc.data(), id: change.doc.id };

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

//Create margins for the two graphs
const Margin = { top: 40, right: 100, bottom: 50, left: 70 };
const Width = 900 - Margin.right - Margin.left;
const Height = 500 - Margin.top - Margin.bottom;

// Appending total sms graph to svg
var smsresponsegraph = d3.select(".totalsmsgraph").append("svg")
    .attr("width", Width + Margin.left + Margin.right)
    .attr("height", Height + Margin.top + Margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + Margin.left + "," + Margin.top + ")");

// Appending operator graph to svg
var surveygraph = d3.select(".operatorgraph").append("svg")
    .attr("width", Width + Margin.left + Margin.right)
    .attr("height", Height + Margin.top + Margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + Margin.left + "," + Margin.top + ")");

// Format TimeStamp  
var timeFormat = d3.timeFormat("%d %H:%M:%S");

// Set x and y scales
const x = d3.scaleTime().range([0, Width]);
const y_operator = d3.scaleLinear().range([Height, 0]);
const y_sms = d3.scaleLinear().range([Height, 0]);

// Define line paths for total sms
const responseline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.Date)) })
    .y(function(d) { return y_sms(d.Total); });

// Define line paths for the operators
const golisline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.Date)) })
    .y(function(d) { return y_operator(d.Golis); });

const hormudline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.Date)) })
    .y(function(d) { return y_operator(d.Hormud); });

const nationLinkline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.Date)) })
    .y(function(d) { return y_operator(d.NationLink); });

const somtelline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.Date)) })
    .y(function(d) { return y_operator(d.Somtel); });

const telesomline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.Date)) })
    .y(function(d) { return y_operator(d.Telesom); });

// Create line path element
const totalsmspath = smsresponsegraph.append('path');

// Create line path element for operator graph
const golispath = surveygraph.append('path');
const hormudpath = surveygraph.append('path');
const nationLinkpath = surveygraph.append('path');
const somtelpath = surveygraph.append('path');
const telesompath = surveygraph.append('path');

// update function
const update = (data) => {

    //format the data  
    data.forEach(function(d) {
        d.Date = new Date(d.Date);
        d.Golis = +d.Golis;
        d.Hormud = +d.Hormud;
        d.NationLink = +d.NationLink;
        d.Somtel = +d.Somtel;
        d.Telesom = +d.Telesom;
        d.Total = +d.Total
    });

    data.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    // set scale domains
    x.domain(d3.extent(data, d => new Date(d.Date)));
    y_sms.domain([0, d3.max(data, function(d) { return Math.max(d.Total); })]);
    y_operator.domain([0, d3.max(data, function(d) { return Math.max(d.Golis, d.Hormud, d.NationLink, d.Somtel, d.Telesom, ); })]);

    //update path data for the total sms response line
    totalsmspath.data([data])
        .attr("class", "line")
        .style("stroke", "blue")
        .attr("d", responseline);

    // update path data for all operators
    golispath.data([data])
        .attr("class", "line")
        .style("stroke", "blue")
        .attr("d", golisline);

    hormudpath.data([data])
        .attr("class", "line")
        .style("stroke", "red")
        .attr("d", hormudline);

    nationLinkpath.data([data])
        .attr("class", "line")
        .style("stroke", "green")
        .attr("d", nationLinkline);

    somtelpath.data([data])
        .attr("class", "line")
        .style("stroke", "orange")
        .attr("d", somtelline);

    telesompath.data([data])
        .attr("class", "line")
        .style("stroke", "purple")
        .attr("d", telesomline);

    //Add the X Axis for the sms response graph
    smsresponsegraph.append("g")
        .attr("transform", "translate(0," + Height + ")")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(timeFormat));

    // Add the X Axis for operators graph
    surveygraph.append("g")
        .attr("transform", "translate(0," + Height + ")")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(timeFormat));

    // X axis label for the sms response graph
    smsresponsegraph.append("text")
        .attr("transform",
            "translate(" + (Width / 2) + " ," +
            (Height + Margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Time (D:H:M:S)");

    // X axis label for the operator graph
    surveygraph.append("text")
        .attr("transform",
            "translate(" + (Width / 2) + " ," +
            (Height + Margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Time (D:H:M:S)");

    // Add the Y Axis for the sms response graph
    smsresponsegraph.append("g")
        .attr("class", "axisSteelBlue")
        .call(d3.axisLeft(y_sms));

    // Add the Y Axis for the operator graph
    surveygraph.append("g")
        .attr("class", "axisSteelBlue")
        .call(d3.axisLeft(y_operator));

    // Y axis Label for the sms response graph
    smsresponsegraph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No. of Sms(s)");

    // Y axis Label for the operator graph
    surveygraph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No. of Sms(s)");

    // Label Lines for the operator graph
    surveygraph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_operator(data[data.length - 1].Golis) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "blue")
        .text("Golis");

    surveygraph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_operator(data[data.length - 1].Hormud) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "red")
        .text("Hormud");

    surveygraph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_operator(data[data.length - 1].NationLink) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "green")
        .text("Nationlink");

    surveygraph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_operator(data[data.length - 1].Telesom) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "green")
        .text("Telesom");

    surveygraph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_operator(data[data.length - 1].Somtel) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "green")
        .text("Somtel");

    // Operator graph title
    surveygraph.append("text")
        .attr("x", (Width / 2))
        .attr("y", 0 - (Margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "bold")
        .text("SMS Response Per Telephone Operator / Hr");

    // Sms response graph title
    smsresponsegraph.append("text")
        .attr("x", (Width / 2))
        .attr("y", 0 - (Margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "bold")
        .text("Sms Response / Hr");

};