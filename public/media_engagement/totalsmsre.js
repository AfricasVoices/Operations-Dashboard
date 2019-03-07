var smsresponsegraph = d3.select(".totalsmsgraph").append("svg")
    .attr("width", Width + Margin.left + Margin.right)
    .attr("height", Height + Margin.top + Margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + Margin.left + "," + Margin.top + ")");

//Formating TimeStamp  
var timeFormat = d3.timeFormat("%H:%M:%S");

// Define the response line
const responseline = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(new Date(d.Date)) })
    .y(function(d) { return y(d.Total); });

// Create line path element
const totalsmspath = smsresponsegraph.append('path');

// Update function
const systemupdate = (data) => {

    //format the data
    data.forEach(function(d) {
        d.Date = new Date(d.Date);
        d.Total = +d.Total;
    });
    data.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    console.log(data[5].Total)

    // Set scale domains based on the x and Y axis data values
    x.domain(d3.extent(data, d => new Date(d.Date)));
    y.domain([0, d3.max(data, function(d) { return Math.max(d.Total); })]);

    //Update Sms path data response line 
    totalsmspath.data([data])
        .attr("class", "line")
        .style("stroke", "blue")
        .attr("d", responseline);

    // Add the X Axis
    smsresponsegraph.append("g")
        .attr("transform", "translate(0," + Height + ")")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(timeFormat));

    // X axis label
    smsresponsegraph.append("text")
        .attr("transform",
            "translate(" + (Width / 2) + " ," +
            (Height + Margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Time (D:H:M:S)");

    // Add the Y Axis
    smsresponsegraph.append("g")
        .attr("class", "axisSteelBlue")
        .call(d3.axisLeft(y));

    //Y axis Label
    smsresponsegraph.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - Margin.left)
        .attr("x", 0 - (Height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("No. of Sms(s)");

    // Graph title
    smsresponsegraph.append("text")
        .attr("x", (Width / 2))
        .attr("y", 0 - (Margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "bold")
        .text("Sms Response / Hr");

};

//data and firestore
var data = [];

mediadb.collection('M&E Dashboard/').onSnapshot(res => {

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

    systemupdate(data);
});

for (var [obj, arr] of Object.entries(data)) {
    const values = Object.values(arr)
    var totals_array = values[6]
    console.log(totals_array)
    const add = (a, b) => a + b
    const total_sms = totals_array.reduce(add)
    console.log(total_sms)




}

// document.getElementById('total_received').innerText = "Last updated: " + total_received