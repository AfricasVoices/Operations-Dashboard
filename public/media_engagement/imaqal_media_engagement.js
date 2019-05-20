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
var timeFormat = d3.timeFormat("%d %H:%M:%S");
// Create tooltip variables
const tooltip = d3.select('#tooltip');

// Set x and y scales
const x = d3.scaleTime().range([0, Width]);
const y_total_received_sms = d3.scaleLinear().range([Height, 0]);
const y_total_sent_sms = d3.scaleLinear().range([Height, 0]);
const y_total_failed_sms = d3.scaleLinear().range([Height, 0]);

// Define line paths for total received sms(s)
const total_received_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_received_sms(d.total_received); })

// Define line paths for total sent sms(s)
const total_sent_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_sent_sms(d.total_sent); })

// Define line paths for total pending sms(s)
const total_pending_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_errored_pending_sms(d.total_pending); })

// Define line paths for total failed sms(s)
const total_failed_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_failed_sms(d.total_errored); })

// Define line path for total golis received sms(s)
const total_golis_received_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_received_sms(d.golis_received); })

// Define line path for total hormud received sms(s)
const total_hormud_received_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_received_sms(d.hormud_received); })

// Define line path for total nationlink received sms(s)
const total_nationlink_received_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_received_sms(d.nationlink_received); })

// Define line path for total somnet received sms(s)
const total_somnet_received_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_received_sms(d.somnet_received); })

// Define line path for total somtel received sms(s)
const total_somtel_received_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_received_sms(d.somtel_received); })

// Define line path for total telesom received sms(s)
const total_telesom_received_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_received_sms(d.telesom_received); })

// Define line path for total golis sent sms(s)
const total_golis_sent_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_sent_sms(d.golis_sent); })

// Define line path for total hormud sent sms(s)
const total_hormud_sent_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_sent_sms(d.hormud_sent); })

// Define line path for total nationlink sent sms(s)
const total_nationlink_sent_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_sent_sms(d.nationlink_sent); })

// Define line path for total somnet sent sms(s)
const total_somnet_sent_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_sent_sms(d.somnet_sent); })

// Define line path for total somtel sent sms(s)
const total_somtel_sent_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_sent_sms(d.somtel_sent); })

// Define line path for total telesom sent sms(s)
const total_telesom_sent_line = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function (d) { return x(new Date(d.datetime)) })
    .y(function (d) { return y_total_sent_sms(d.telesom_sent); })

// Create line path element for each message variable
const total_received_path = total_received_sms_graph.append('path');
const total_golis_received_path = total_received_sms_graph.append('path');
const total_hormud_received_path = total_received_sms_graph.append('path');
const total_nationlink_received_path = total_received_sms_graph.append('path');
const total_somnet_received_path = total_received_sms_graph.append('path');
const total_somtel_received_path = total_received_sms_graph.append('path');
const total_telesom_received_path = total_received_sms_graph.append('path');

const total_sent_path = total_sent_sms_graph.append('path');
const total_golis_sent_path = total_sent_sms_graph.append('path');
const total_hormud_sent_path = total_sent_sms_graph.append('path');
const total_nationlink_sent_path = total_sent_sms_graph.append('path');
const total_somnet_sent_path = total_sent_sms_graph.append('path');
const total_somtel_sent_path = total_sent_sms_graph.append('path');
const total_telesom_sent_path = total_sent_sms_graph.append('path');

const total_pending_path = total_failed_sms_graph.append('path');
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
    
    // set scale domains
    x.domain(d3.extent(data, d => new Date(d.datetime)));
    y_total_received_sms.domain([0, d3.max(data, function (d) { return Math.max(d.total_received, d.golis_received, d.hormud_received, d.nationlink_received, d.somnet_received, d.somtel_received, d.telesom_received); })]);
    y_total_sent_sms.domain([0, d3.max(data, function (d) { return Math.max(d.total_sent, d.golis_sent, d.hormud_sent, d.nationlink_sent, d.somnet_sent, d.somtel_sent, d.telesom_sent); })]);
    y_total_failed_sms.domain([0, d3.max(data, function (d) { return Math.max(d.total_errored); })]);

    // update path data for total incoming sms(s)
    total_received_path.data([data])
        .attr("class", "line")
        .style("stroke", "green")
        .attr("d", total_received_line);
    total_golis_received_path.data([data])
        .attr("class", "line")
        .style("stroke", "#FF6F61")
        .attr("d", total_golis_received_line);
    total_hormud_received_path.data([data])
        .attr("class", "line")
        .style("stroke", "#6B5B95")
        .attr("d", total_hormud_received_line);
    total_nationlink_received_path.data([data])
        .attr("class", "line")
        .style("stroke", "#790303")
        .attr("d", total_nationlink_received_line);
    total_somnet_received_path.data([data])
        .attr("class", "line")
        .style("stroke", "#5A3E36")
        .attr("d", total_somnet_received_line);
    total_somtel_received_path.data([data])
        .attr("class", "line")
        .style("stroke", "#935529")
        .attr("d", total_somtel_received_line);
    total_telesom_received_path.data([data])
        .attr("class", "line")
        .style("stroke", "#2A4B7C")
        .attr("d", total_telesom_received_line);
    
    // update path data for total outgoing sms(s)
    total_sent_path.data([data])
        .attr("class", "line")
        .style("stroke", "blue")
        .attr("d", total_sent_line);
    total_golis_sent_path.data([data])
        .attr("class", "line")
        .style("stroke", "#FF6F61")
        .attr("d", total_golis_sent_line);
    total_hormud_sent_path.data([data])
        .attr("class", "line")
        .style("stroke", "#6B5B95")
        .attr("d", total_hormud_sent_line);
    total_nationlink_sent_path.data([data])
        .attr("class", "line")
        .style("stroke", "#790303")
        .attr("d", total_nationlink_sent_line);
    total_somnet_sent_path.data([data])
        .attr("class", "line")
        .style("stroke", "#5A3E36")
        .attr("d", total_somnet_sent_line);
    total_somtel_sent_path.data([data])
        .attr("class", "line")
        .style("stroke", "#935529")
        .attr("d", total_somtel_sent_line);
    total_telesom_sent_path.data([data])
        .attr("class", "line")
        .style("stroke", "#2A4B7C")
        .attr("d", total_telesom_sent_line);
    
    // update path data for total failed sms(s)
    total_failed_path.data([data])
        .attr("class", "line")
        .style("stroke", "red")
        .attr("d", total_failed_line);
    
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
    
    // Label Lines for the total received sms graph
    total_received_sms_graph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_total_received_sms(data[data.length - 1].total_received) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "green")
        .text("Total Incoming");
    total_received_sms_graph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_total_received_sms(data[data.length - 1].golis_received) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "#FF6F61")
        .text("Golis");
    total_received_sms_graph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_total_received_sms(data[data.length - 1].hormud_received) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "#6B5B95")
        .text("Hormud");
    
    // Label Lines for the total sent sms graph
    total_sent_sms_graph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_total_received_sms(data[data.length - 1].total_sent) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "blue")
        .text("Total Outgoing");
    total_sent_sms_graph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_total_received_sms(data[data.length - 1].golis_sent) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "#FF6F61")
        .text("Golis");
    total_sent_sms_graph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_total_received_sms(data[data.length - 1].hormud_sent) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "#6B5B95")
        .text("Hormud");
    
    // Label Lines for the total failed sms graph
    total_failed_sms_graph.append("text")
        .attr("transform", "translate(" + (Width + 3) + "," + y_total_received_sms(data[data.length - 1].total_errored) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "red")
        .text("Total Failed");

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
