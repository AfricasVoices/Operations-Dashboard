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

const TIMEFRAME = 7
var view = "1day"

// Function to update data
const update = (data) => {

    d3.selectAll("svg").remove();

    let operators = new Set()

    var dayDateFormat = d3.timeFormat("%Y-%m-%d")	

    // format the data  
    data.forEach(function (d) {
        d.datetime = new Date(d.datetime);
        d.day = dayDateFormat(new Date(d.datetime))
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
        Object.keys(d.operators).sort().forEach(function(key) {
            if (!(key in operators)) {
                operators.add(key)
            };
        });
    });

    operators = Array.from(operators)

    data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    var dailyReceivedTotal = d3.nest()
        .key(function(d) { return d.day; })
        .rollup(function(v) { return {
            hormud_received: d3.sum(v, function(d) {return d.hormud_received}),
            nationlink_received: d3.sum(v, function(d) {return d.nationlink_received}),
            somnet_received: d3.sum(v, function(d) {return d.somnet_received}),
            somtel_received: d3.sum(v, function(d) {return d.somtel_received}),
            telesom_received: d3.sum(v, function(d) {return d.telesom_received}),
            golis_received: d3.sum(v, function(d) {return d.golis_received}),
            total_received: d3.sum(v, function(d) {return d.total_received}),
        };
         })
        .entries(data);

    for (var entry in dailyReceivedTotal) {
        var valueList = dailyReceivedTotal[entry].value
        for (var key in valueList) {
            dailyReceivedTotal[entry][key] = valueList[key]
        }
        dailyReceivedTotal[entry]["day"] = dailyReceivedTotal[entry].key
        delete dailyReceivedTotal[entry]["value"]
        delete dailyReceivedTotal[entry]["key"]
    }

    var dailySentTotal = d3.nest()
        .key(function(d) { return d.day; })
        .rollup(function(v) { return {
            hormud_sent: d3.sum(v, function(d) {return d.hormud_sent}),
            nationlink_sent: d3.sum(v, function(d) {return d.nationlink_sent}),
            somnet_sent: d3.sum(v, function(d) {return d.somnet_sent}),
            somtel_sent: d3.sum(v, function(d) {return d.somtel_sent}),
            telesom_sent: d3.sum(v, function(d) {return d.telesom_sent}),
            golis_sent: d3.sum(v, function(d) {return d.golis_sent}),
            total_sent: d3.sum(v, function(d) {return d.total_sent}),
        };
         })
        .entries(data);

    for (var entry in dailySentTotal) {
        var valueList = dailySentTotal[entry].value
        for (var key in valueList) {
            dailySentTotal[entry][key] = valueList[key]
        }
        dailySentTotal[entry]["day"] = dailySentTotal[entry].key
        delete dailySentTotal[entry]["value"]
        delete dailySentTotal[entry]["key"]

    }

    receivedKeys = []
    sentKeys = []

    var receivedStr = ""
    var sentStr = ""

    for (var i=0; i<operators.length; i++) {
        receivedStr = operators[i] + "_received";
        receivedKeys.push(receivedStr)
        sentStr = operators[i] + "_sent"
        sentKeys.push(sentStr)
    }

    let stackReceivedDaily = d3.stack()
            .keys(receivedKeys)
    let receivedDataStackedDaily = stackReceivedDaily(dailyReceivedTotal)

    let stackSentDaily = d3.stack()
        .keys(sentKeys)
    let sentDataStackedDaily = stackSentDaily(dailySentTotal)
  

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

    let color = d3.scaleOrdinal(d3.schemeCategory10);

    let colorReceived = d3.scaleOrdinal(d3.schemeCategory10).domain(receivedKeys)
    let colorSent = d3.scaleOrdinal(d3.schemeCategory10).domain(sentKeys)

    // set scale domains
    y_total_failed_sms.domain([0, d3.max(data, function (d) { return d.total_errored; })]);

    if (view == "1day") {
        drawOneDayReceivedGraph()
        drawOneDaySentGraph()
    }

    else if (view == "10min") {
        draw10MinReceivedGraph()
        draw10MinSentGraph()
    }

    // // Y axis Label for the total received sms graph
    total_received_sms_graph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No. of Incoming Message (s)");

    // Y axis Label for the total sent sms graph
    total_sent_sms_graph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No. of Outgoing Message (s)");
      
    // update path data for total failed sms(s)
    total_failed_path.data([data])
        .attr("class", "line")
        .style("stroke", "blue")
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
        .text("No. of Failed Message (s)");
    
    // Total Failed Sms(s) graph title
     total_failed_sms_graph.append("text")
        .attr("x", (Width / 2))
        .attr("y", 0 - (Margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "bold")
        .text("Total Failed Messages(s) / hr");     

    // Total received graph legend
    total_received_sms_graph.append("g")
        .attr("class", "receivedLegend")
        .attr("transform", `translate(${Width - Margin.right + 100},${Margin.top - 30})`)

    var receivedLegend = d3.legendColor()
        .shapeWidth(20)
        .orient('vertical')
        .scale(colorReceived)
        .labels(operators);

    d3.select(".receivedLegend")
        .call(receivedLegend);

    // Total sent graph legend
    total_sent_sms_graph.append("g")
    .attr("class", "sentLegend")
    .attr("transform", `translate(${Width - Margin.right + 80},${Margin.top - 30})`)

    var sentLegend = d3.legendColor()
        .shapeWidth(30)
        .orient('vertical')
        .scale(colorSent)
        .labels(operators);

    d3.select(".sentLegend")
        .call(sentLegend);

    // Label Lines for the total failed sms graph
    total_failed_sms_graph.append("text")
        .attr("transform", `translate(${Width - Margin.right + 100},${Margin.top})`)
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "blue")
        .text("Total Failed");


    function updateView10Minutes() {
        draw10MinReceivedGraph()
        draw10MinSentGraph()       
    }

    function updateViewOneDay() {
        drawOneDayReceivedGraph()
        drawOneDaySentGraph()
    }

    function draw10MinReceivedGraph() {
        var offset = new Date()
        offset.setDate(offset.getDate() - 7)

        dataFiltered = data.filter(a => a.datetime > offset);

        let stackReceived = d3.stack()
            .keys(receivedKeys)
        let receivedDataStacked = stackReceived(dataFiltered)

        // set scale domains
        x.domain(d3.extent(dataFiltered, d => new Date(d.datetime)));
        y_total_received_sms.domain([0, d3.max(dataFiltered, function (d) { return d.total_received; })]);

        d3.selectAll(".redrawElementReceived").remove();
        d3.selectAll("#receivedStack").remove();

        // Add the Y Axis for the total received sms graph
        total_received_sms_graph.append("g")
            .attr("id", "axisSteelBlue")
            .attr("class", "redrawElementReceived")
            .call(d3.axisLeft(y_total_received_sms));

        let receivedLayer10min = total_received_sms_graph.selectAll('#receivedStack10min')
            .data(receivedDataStacked)
            .enter()    
        .append('g')
            .attr('id', 'receivedStack10min')    
            .attr('class', function(d, i) { return receivedKeys[i] })
            .style('fill', function (d, i) { return color(i) })
        
        receivedLayer10min.selectAll('rect')
            .data(function(dataFiltered) { return dataFiltered })
            .enter()
        .append('rect')
            .attr('x', function (d) { return x(d.data.datetime) })
            .attr('y', function (d) { return y_total_received_sms(d[1]) })
            .attr('height', function (d) { return y_total_received_sms(d[0]) - y_total_received_sms(d[1]) })
            .attr('width', Width / Object.keys(dataFiltered).length)

        //Add the X Axis for the total received sms graph
        total_received_sms_graph.append("g")
            .attr("class", "redrawElementReceived")
            .attr("transform", "translate(0," + Height + ")")
            .call(d3.axisBottom(x)
                .ticks(d3.timeDay.every(1))
                .tickFormat(timeFormat));

        // Add X axis label for the total received sms graph
        total_received_sms_graph.append("text")
            .attr("class", "redrawElementReceived")
            .attr("transform",
                    "translate(" + (Width / 2) + " ," +
                    (Height + Margin.top + 10) + ")")
                .style("text-anchor", "middle")
                .text("Date (H-D-M-Y)");

        // Total Sms(s) graph title
        total_received_sms_graph.append("text")
            .attr("class", "redrawElementReceived")
            .attr("x", (Width / 2))
            .attr("y", 0 - (Margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Incoming Message(s) / 10 minutes");
        }

    function drawOneDayReceivedGraph() {
        // set scale domains
        x.domain(d3.extent(data, d => new Date(d.day)));
        y_total_received_sms.domain([0, d3.max(dailyReceivedTotal, function (d) { return d.total_received; })]);
    
        d3.selectAll(".redrawElementReceived").remove();
        d3.selectAll("#receivedStack10min").remove();
    
         // Add the Y Axis for the total received sms graph
         total_received_sms_graph.append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementReceived")
            .call(d3.axisLeft(y_total_received_sms));
    
       let receivedLayer = total_received_sms_graph.selectAll('#receivedStack')
            .data(receivedDataStackedDaily)
            .enter()    
        .append('g')
            .attr('id', 'receivedStack') 
            .attr('class', function(d, i) { return receivedKeys[i] })
            .style('fill', function (d, i) { return color(i) })
    
        receivedLayer.selectAll('rect')
            .data(function(d) { return d })
            .enter()
            .append('rect')
            .attr('x', function (d) { return x(new Date(d.data.day)) })
            .attr('y', function (d) { return y_total_received_sms(d[1]) })
            .attr('height', function (d) { return y_total_received_sms(d[0]) - y_total_received_sms(d[1]) })
            .attr('width', Width / Object.keys(dailyReceivedTotal).length);
    
         //Add the X Axis for the total received sms graph
        total_received_sms_graph.append("g")
            .attr("class", "redrawElementReceived")
            .attr("transform", "translate(0," + Height + ")")
            .call(d3.axisBottom(x)
                .ticks(d3.timeWeek.every(1))
                .tickFormat(dayDateFormat));
    
        // Add X axis label for the total received sms graph
        total_received_sms_graph.append("text")
            .attr("class", "redrawElementReceived")
            .attr("transform",
                    "translate(" + (Width / 2) + " ," +
                    (Height + Margin.top + 10) + ")")
                .style("text-anchor", "middle")
                .text("Date (Y-M-D)");
    
        // Total Sms(s) graph title
        total_received_sms_graph.append("text")
            .attr("class", "redrawElementReceived")
            .attr("x", (Width / 2))
            .attr("y", 0 - (Margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Incoming Message(s) / day");
    }
    
    function draw10MinSentGraph() {
        var offset = new Date()
        offset.setDate(offset.getDate() - TIMEFRAME)
    
        dataFiltered = data.filter(a => a.datetime > offset);
    
        let stackSent = d3.stack()
            .keys(sentKeys)
        let sentDataStacked = stackSent(dataFiltered)
    
        // set scale domains
        x.domain(d3.extent(dataFiltered, d => new Date(d.datetime)));
        y_total_sent_sms.domain([0, d3.max(dataFiltered, function (d) { return d.total_sent; })]);
    
        d3.selectAll(".redrawElementSent").remove();
        d3.selectAll("#sentStack1day").remove();
    
        // Add the Y Axis for the total sent sms graph
       total_sent_sms_graph.append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementSent")
            .call(d3.axisLeft(y_total_sent_sms));
        
        let sentLayer10min = total_sent_sms_graph.selectAll('#sentStack10min')
            .data(sentDataStacked)
            .enter()    
        .append('g')
            .attr('id', 'sentStack10min')    
            .attr('class', function(d, i) { return sentKeys[i] })
            .style('fill', function (d, i) { return color(i) })
            
        sentLayer10min.selectAll('rect')
            .data(function(dataFiltered) { return dataFiltered })
            .enter()
        .append('rect')
            .attr('x', function (d) { return x(d.data.datetime) })
            .attr('y', function (d) { return y_total_sent_sms(d[1]) })
            .attr('height', function (d) { return y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]) })
            .attr('width', Width / Object.keys(dataFiltered).length)
        
        //Add the X Axis for the total sent sms graph
        total_sent_sms_graph.append("g")
            .attr("class", "redrawElementSent")
            .attr("transform", "translate(0," + Height + ")")
            .call(d3.axisBottom(x)
                .ticks(d3.timeDay.every(1))
                .tickFormat(timeFormat));
    
        // Add X axis label for the total sent sms graph
        total_sent_sms_graph.append("text")
            .attr("class", "redrawElementSent")
            .attr("transform",
                    "translate(" + (Width / 2) + " ," +
                    (Height + Margin.top + 10) + ")")
                .style("text-anchor", "middle")
                .text("Date (H-D-M-Y)");
    
        // Total Sms(s) graph title
        total_sent_sms_graph.append("text")
            .attr("class", "redrawElementSent")
            .attr("x", (Width / 2))
            .attr("y", 0 - (Margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Outgoing Message(s) / 10 minutes");
        
    }
    
    function drawOneDaySentGraph() {
    
        // set scale domains
        x.domain(d3.extent(data, d => new Date(d.day)));
        y_total_sent_sms.domain([0, d3.max(dailySentTotal, function (d) { return d.total_sent; })]);
    
        d3.selectAll(".redrawElementSent").remove();
        d3.selectAll("#sentStack10min").remove();
    
         // Add the Y Axis for the total sent sms graph
        total_sent_sms_graph.append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementSent")
            .call(d3.axisLeft(y_total_sent_sms));
    
       let sentLayer = total_sent_sms_graph.selectAll('#sentStack1day')
            .data(sentDataStackedDaily)
            .enter()    
        .append('g')
            .attr('id', 'sentStack1day')
            .attr('class', function(d, i) { return sentKeys[i] })
            .style('fill', function (d, i) { return color(i) })
    
        sentLayer.selectAll('rect')
            .data(function(d) { return d })
            .enter()
            .append('rect')
            .attr('x', function (d) { return x(new Date(d.data.day)) })
            .attr('y', function (d) { return y_total_sent_sms(d[1]) })
            .attr('height', function (d) { return y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]) })
            .attr('width', Width / Object.keys(dailySentTotal).length);
      
         //Add the X Axis for the total sent sms graph
         total_sent_sms_graph.append("g")
            .attr("class", "redrawElementSent")
            .attr("transform", "translate(0," + Height + ")")
            .call(d3.axisBottom(x)
                .ticks(d3.timeWeek.every(1))
                .tickFormat(dayDateFormat));
    
         // Add X axis label for the total sent sms graph
         total_sent_sms_graph.append("text")
             .attr("class", "redrawElementSent")
             .attr("transform",
                     "translate(" + (Width / 2) + " ," +
                     (Height + Margin.top + 10) + ")")
                 .style("text-anchor", "middle")
                 .text("Date (Y-M-D)");
    
         // Total Sms(s) graph title
         total_sent_sms_graph.append("text")
            .attr("class", "redrawElementSent")
            .attr("x", (Width / 2))
            .attr("y", 0 - (Margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Outgoing Message(s) / day");
    
    }

    // Add an event listener to the buttons
    d3.select("#buttonUpdateView10Minutes").on("click", function() {
        updateView10Minutes()
        view = "10min"
    } )
    d3.select("#buttonUpdateViewOneDay").on("click", function() {
        updateViewOneDay()
        view = "1day"
    } )
    
};
