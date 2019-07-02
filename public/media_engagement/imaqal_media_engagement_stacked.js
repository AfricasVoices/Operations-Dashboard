//Perform Authentication then update data 
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
//Create margins for the two graphs
const Margin = { top: 40, right: 100, bottom: 50, left: 70 };
const Width = 900 - Margin.right - Margin.left;
const Height = 500 - Margin.top - Margin.bottom;

// Append total received sms graph to svg
var total_received_sms_graph = d3.select(".total_received_sms_graph").append("svg")
    .attr("width", Width + Margin.left + Margin.right)
    .attr("height", Height + Margin.top + Margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + Margin.left + "," + Margin.top + ")");

// Append total sent sms graph to svg
var total_sent_sms_graph = d3.select(".total_sent_sms_graph").append("svg")
    .attr("width", Width + Margin.left + Margin.right)
    .attr("height", Height + Margin.top + Margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + Margin.left + "," + Margin.top + ")");

// Append total sent sms graph to svg
var total_failed_sms_graph = d3.select(".total_failed_sms_graph").append("svg")
    .attr("width", Width + Margin.left + Margin.right)
    .attr("height", Height + Margin.top + Margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + Margin.left + "," + Margin.top + ")");

// Format TimeStamp  
var timeFormat = d3.timeFormat("%H %d %m %Y");
// Create tooltip variables
const tooltip = d3.select('#tooltip');

// Set x and y scales
const x = d3.scaleTime().range([0, Width]);
const y_total_received_sms = d3.scaleLinear().range([Height, 0]);
const y_total_sent_sms = d3.scaleLinear().range([Height, 0]);
const y_total_failed_sms = d3.scaleLinear().range([Height, 0]);


// Define line paths for total failed sms(s)
const total_failed_line = d3.line()
    .curve(d3.curveLinear)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_failed_sms(d.total_errored); })


// Create line path element for failed line graph
const total_failed_path = total_failed_sms_graph.append('path');

// Function to update data
const update = (data) => {

    // format the data  
    data.forEach(function (d) {
        d.datetime = new Date(d.datetime);
        d.total_received = +d.total_received
        d.total_sent = +d.total_sent
        d.total_pending = +d.total_pending
        d.total_errored = +d.total_errored
        d.golis_received= +d.operators["golis"]["received"]
        d.hormud_received= +d.operators["hormud"]["received"]
        d.nationlink_received= +d.operators["nationlink"]["received"]
        d.somnet_received= +d.operators["somnet"]["received"]
        d.somtel_received= +d.operators["somtel"]["received"]
        d.telesom_received= +d.operators["telesom"]["received"]
        d.golis_sent= +d.operators["golis"]["sent"]
        d.hormud_sent= +d.operators["hormud"]["sent"]
        d.nationlink_sent= +d.operators["nationlink"]["sent"]
        d.somnet_sent= +d.operators["somnet"]["sent"]
        d.somtel_sent= +d.operators["somtel"]["sent"]
        d.telesom_sent= +d.operators["telesom"]["sent"]
    });

    data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    data = data.filter(a => a.datetime > new Date("2019-07-01T12:30:00+00:00"));
    
    receivedKeys = ["NC_received", "golis_received", "hormud_received", "nationlink_received", "somnet_received", 
    "somtel_received", "telegram_received", "telesom_received"]

    let stackReceived = d3.stack()
            .keys(receivedKeys)
    let receivedDataStacked = stackReceived(data)

    sentKeys = ["NC_sent", "golis_sent", "hormud_sent", "nationlink_sent", "somnet_sent", 
    "somtel_sent", "telegram_sent", "telesom_sent"]

    let stackSent = d3.stack()
            .keys(sentKeys)
    let sentdDataStacked = stackSent(data)


    // set scale domains
    x.domain(d3.extent(data, d => new Date(d.datetime)));
    y_total_received_sms.domain([0, d3.max(data, function (d) { return Math.max(d.total_received, d.golis_received, d.hormud_received, d.nationlink_received, d.somnet_received, d.somtel_received, d.telesom_received); })]);
    y_total_sent_sms.domain([0, d3.max(data, function (d) { return Math.max(d.total_sent, d.golis_sent, d.hormud_sent, d.nationlink_sent, d.somnet_sent, d.somtel_sent, d.telesom_sent); })]);
    y_total_failed_sms.domain([0, d3.max(data, function (d) { return Math.max(d.total_errored); })]);

    let color = d3.scaleOrdinal(d3.schemeCategory10);

    // Received bar chart

    // Add the Y Axis for the total received sms graph
    total_received_sms_graph.append("g")
        .attr("class", "axisSteelBlue")
        .call(d3.axisLeft(y_total_received_sms));
    
    // Y axis Label for the total received sms graph
    total_received_sms_graph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No.of Incoming Message (s)");

    let receivedLayer = total_received_sms_graph.selectAll('#receivedStack')
        .data(receivedDataStacked)
        .enter()    
      .append('g')
        .attr('id', 'receivedStack')    
        .attr('class', function(d, i) { return receivedKeys[i] })
        .style('fill', function (d, i) { return color(i) })
    
    receivedLayer.selectAll('rect')
        .data(function(d) { return d })
        .enter()
      .append('rect')
        .attr('x', function (d) { return x(d.data.datetime) })
        .attr('y', function (d) { return y_total_received_sms(d[1]) })
        .attr('height', function (d) { return y_total_received_sms(d[0]) - y_total_received_sms(d[1]) })
        .attr('width', Width / Object.keys(data).length)
    
    //Add the X Axis for the total received sms graph
        total_received_sms_graph.append("g")
        .attr("transform", "translate(0," + Height + ")")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(timeFormat));
    
    //Add X axis label for the total received sms graph
    total_received_sms_graph.append("text")
        .attr("transform",
            "translate(" + (Width / 2) + " ," +
            (Height + Margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Time (D:H:M:S)");

    
    // Sent bar chart
    // Add the Y Axis for the total sent sms graph
    total_sent_sms_graph.append("g")
        .attr("class", "axisSteelBlue")
        .call(d3.axisLeft(y_total_sent_sms));
    
    // Y axis Label for the total sent sms graph
    total_sent_sms_graph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No.of Sent Message (s)");

    let sentLayer = total_sent_sms_graph.selectAll('#sentStack')
        .data(sentdDataStacked)
        .enter()    
      .append('g')
        .attr('id', 'sentStack')    
        .attr('class', function(d, i) { return sentKeys[i] })
        .style('fill', function (d, i) { return color(i) })
    
    sentLayer.selectAll('rect')
        .data(function(d) { return d })
        .enter()
      .append('rect')
        .attr('x', function (d) { return x(d.data.datetime) })
        .attr('y', function (d) { return y_total_sent_sms(d[1]) })
        .attr('height', function (d) { return y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]) })
        .attr('width', Width / Object.keys(data).length)
    
    //Add the X Axis for the total sent sms graph
    total_sent_sms_graph.append("g")
        .attr("transform", "translate(0," + Height + ")")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(timeFormat));
    
    //Add X axis label for the total sent sms graph
    total_sent_sms_graph.append("text")
        .attr("transform",
            "translate(" + (Width / 2) + " ," +
            (Height + Margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Time (D:H:M:S)");
    
    // Add the Y Axis for the total sent sms graph
    total_sent_sms_graph.append("g")
        .attr("class", "axisSteelBlue")
        .call(d3.axisLeft(y_total_sent_sms));
    
    // Y axis Label for the total sent sms graph
    total_sent_sms_graph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No.of Outgoing Message (s)");
      
    // update path data for total failed sms(s)
    total_failed_path.data([data])
        .attr("class", "line")
        .style("stroke", "red")
        .attr("d", total_failed_line);

    //Add the X Axis for the total failed sms graph
    total_failed_sms_graph.append("g")
        .attr("transform", "translate(0," + Height + ")")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(timeFormat));
    
    //Add X axis label for the total failed sms graph
    total_failed_sms_graph.append("text")
        .attr("transform",
            "translate(" + (Width / 2) + " ," +
            (Height + Margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Time (D:H:M:S)");
    
    // Add the Y Axis for the total failed sms graph
    total_failed_sms_graph.append("g")
        .attr("class", "axisSteelBlue")
        .call(d3.axisLeft(y_total_failed_sms));
    
    // Y axis Label for the total failed sms graph
    total_failed_sms_graph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No.of Failed Message (s)");

     // Total Sms(s) graph title
     total_received_sms_graph.append("text")
        .attr("x", (Width / 2))
        .attr("y", 0 - (Margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "bold")
        .text("Total Incoming Message(s) / hr");
    
    // Total Outgoing Sms(s) graph title
     total_sent_sms_graph.append("text")
        .attr("x", (Width / 2))
        .attr("y", 0 - (Margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "bold")
        .text("Total Outgoing Messages(s) / hr");
    
    // Total Failed Sms(s) graph title
     total_failed_sms_graph.append("text")
        .attr("x", (Width / 2))
        .attr("y", 0 - (Margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "bold")
        .text("Total Failed Messages(s) / hr");     


        
};