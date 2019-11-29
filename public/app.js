// AUTH CONTROLLER
var authController = (function() {
    return {
        //Authentication state listener
        initApp: function() {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    console.log('Login Successful');
                    console.log("Attempting to bind: " + user.email)
                    console.log('Bind Successful');
                    return user;
                } else {
                    window.location.replace('auth.html')
                }
            });
        },

        //logout function
        logout: function() {
            firebase.auth().signOut()
                .catch(function (err) {
                    console.log(err);
                })
        }
    };
})();

// DATA CONTROLLER
var dataController = (function() {
    var data = [];
    var gdata = [];
    var data2 = [];
    var offset = new Date()
    timerange = 30
    offset.setDate(offset.getDate() - timerange)
    var iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L");
    offsetString = iso(offset)

    var updateData = function(res) {
        // Update data every time it changes in firestore
        res.docChanges().forEach(change => {

            const doc = { ...change.doc.data(), id: change.doc.id };

            switch (change.type) {
                case 'added':
                    data2.push(doc);
                    break;
                case 'modified':
                    const index = data2.findIndex(item => item.id == doc.id);
                    data2[index] = doc;
                    break;
                case 'removed':
                    data2 = data2.filter(item => item.id !== doc.id);
                    break;
                default:
                    break;
            }
        });
        // console.log(data2)
    }
    
    return {
        resetData: function() {
            data = [];
            gdata = [];
            data2 = [];
            operators = new Set()
        }, 

        getProject: function(update) {
            mediadb.collection('active_projects').onSnapshot(res => {
                // console.log(res);
                // Update data every time it changes in firestore
                updateData(res)
                update(data2);
            });  
        },

        getDocument: function(update) {
            mediadb.doc('metrics/coda').onSnapshot(function(res) {
                update(res.data());
            });
        },

        getCollection: function(collection, update) {   
            mediadb.collection(`/metrics/rapid_pro/${collection}/`).where("datetime", ">", offsetString).onSnapshot(res => {
                // console.log(res)
                // Update data every time it changes in firestore
                res.docChanges().forEach(change => {

                    const doc = { ...change.doc.data(), id: change.doc.id };
        
                    switch (change.type) {
                        case 'added':
                            gdata.push(doc);
                            break;
                        case 'modified':
                            const index = gdata.findIndex(item => item.id == doc.id);
                            gdata[index] = doc;
                            break;
                        case 'removed':
                            gdata = gdata.filter(item => item.id !== doc.id);
                            break;
                        default:
                            break;
                    }
                });
                // console.log(gdata)
                update(gdata);
            });
        }
    };
})();

// GRAPH CONTROLLER
var graphController = (function() {
    const TIMEFRAME_WEEK = 7;
    const TIMEFRAME_MONTH = 30;
    var chartTimeUnit = "10min";
    var isYLimitReceivedManuallySet = false;
    var isYLimitSentManuallySet = false;
    var operators = new Set()
    var dayDateFormat = d3.timeFormat("%Y-%m-%d")	

    var add_one_day_to_date = function (date) {
        var newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    };

    // var formatData = function(data) {
    //     data.forEach(function (d) {
    //         d.datetime = new Date(d.datetime);
    //         d.day = dayDateFormat(new Date(d.datetime))
    //         d.total_received = +d.total_received
    //         d.total_sent = +d.total_sent
    //         d.total_pending = +d.total_pending
    //         d.total_errored = +d.total_errored
    //         d.NC_received = +d.operators["NC"]["received"]
    //         d.telegram_received= +d.operators["telegram"]["received"]
    //         d.golis_received= +d.operators["golis"]["received"]
    //         d.hormud_received= +d.operators["hormud"]["received"]
    //         d.nationlink_received= +d.operators["nationlink"]["received"]
    //         d.somnet_received= +d.operators["somnet"]["received"]
    //         d.somtel_received= +d.operators["somtel"]["received"]
    //         d.telesom_received= +d.operators["telesom"]["received"]
    //         d.golis_sent= +d.operators["golis"]["sent"]
    //         d.hormud_sent= +d.operators["hormud"]["sent"]
    //         d.nationlink_sent= +d.operators["nationlink"]["sent"]
    //         d.somnet_sent= +d.operators["somnet"]["sent"]
    //         d.somtel_sent= +d.operators["somtel"]["sent"]
    //         d.telesom_sent= +d.operators["telesom"]["sent"]
    //         d.telegram_sent= +d.operators["telegram"]["sent"]
    //         d.NC_sent = +d.operators["NC"]["sent"]
    //         Object.keys(d.operators).sort().forEach(function(key) {
    //             if (!(key in operators)) {
    //                 operators.add(key)
    //             };
    //         });
    //     });

    // };

    // Update timestamp of update and reset formatting
    const timestamp = new Date()

    var setLastUpdatedAlert = function() {
        // Calculate time diff bw current and timestamp
        var currentTime = new Date()
        var difference_ms = (currentTime.getTime() - timestamp.getTime())/60000
        var difference_minutes = Math.floor(difference_ms % 60)
        // if updated more than 20 min ago >> reformat
        if (difference_minutes > 20) {
            d3.select("#lastUpdated").classed("alert", true)
        }
    };

    return {
        update_graphs: function(data) {
            // Clear previous graphs before redrawing
            d3.selectAll("svg").remove();

            // format the data  
            // formatData(data)
            var operators = new Set()
     
            data.forEach(function (d) {
                d.datetime = new Date(d.datetime);
                d.day = dayDateFormat(new Date(d.datetime))
                d.total_received = +d.total_received
                d.total_sent = +d.total_sent
                d.total_pending = +d.total_pending
                d.total_errored = +d.total_errored
                d.NC_received = +d.operators["NC"]["received"]
                d.telegram_received= +d.operators["telegram"]["received"]
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
                d.telegram_sent= +d.operators["telegram"]["sent"]
                d.NC_sent = +d.operators["NC"]["sent"]
                Object.keys(d.operators).sort().forEach(function(key) {
                    if (!(key in operators)) {
                        operators.add(key)
                    };
                });
            });
    
            // Sort data by date
            data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
            var offsetWeek = new Date()
            offsetWeek.setDate(offsetWeek.getDate() - TIMEFRAME_WEEK)
        
            var offsetMonth = new Date()
            offsetMonth.setDate(offsetMonth.getDate() - TIMEFRAME_MONTH)
        
            // Set default y-axis limits
            dataFilteredWeek = data.filter(a => a.datetime > offsetWeek);
            dataFilteredMonth = data.filter(a => a.datetime > offsetMonth);
        
            // Group received data by day
            var dailyReceivedTotal = d3.nest()
                .key(function(d) { return d.day; })
                .rollup(function(v) { return {
                    NC_received: d3.sum(v, function(d) {return d.NC_received}),
                    telegram_received: d3.sum(v, function(d) {return d.telegram_received}),
                    hormud_received: d3.sum(v, function(d) {return d.hormud_received}),
                    nationlink_received: d3.sum(v, function(d) {return d.nationlink_received}),
                    somnet_received: d3.sum(v, function(d) {return d.somnet_received}),
                    somtel_received: d3.sum(v, function(d) {return d.somtel_received}),
                    telesom_received: d3.sum(v, function(d) {return d.telesom_received}),
                    golis_received: d3.sum(v, function(d) {return d.golis_received}),
                    total_received: d3.sum(v, function(d) {return d.total_received}),
                };
                    })
                .entries(dataFilteredMonth);
        
            // Flatten nested data for stacking
            for (var entry in dailyReceivedTotal) {
                var valueList = dailyReceivedTotal[entry].value
                for (var key in valueList) {
                    dailyReceivedTotal[entry][key] = valueList[key]
                }
                dailyReceivedTotal[entry]["day"] = dailyReceivedTotal[entry].key
                delete dailyReceivedTotal[entry]["value"]
                delete dailyReceivedTotal[entry]["key"]
            }
        
            // Group sent data by day
            var dailySentTotal = d3.nest()
                .key(function(d) { return d.day; })
                .rollup(function(v) { return {
                    NC_sent: d3.sum(v, function(d) {return d.NC_sent}),
                    telegram_sent: d3.sum(v, function(d) {return d.telegram_sent}),
                    hormud_sent: d3.sum(v, function(d) {return d.hormud_sent}),
                    nationlink_sent: d3.sum(v, function(d) {return d.nationlink_sent}),
                    somnet_sent: d3.sum(v, function(d) {return d.somnet_sent}),
                    somtel_sent: d3.sum(v, function(d) {return d.somtel_sent}),
                    telesom_sent: d3.sum(v, function(d) {return d.telesom_sent}),
                    golis_sent: d3.sum(v, function(d) {return d.golis_sent}),
                    total_sent: d3.sum(v, function(d) {return d.total_sent}),
                };
                    })
                .entries(dataFilteredMonth);
        
            // Flatten nested data for stacking
            for (var entry in dailySentTotal) {
                var valueList = dailySentTotal[entry].value
                for (var key in valueList) {
                    dailySentTotal[entry][key] = valueList[key]
                }
                dailySentTotal[entry]["day"] = dailySentTotal[entry].key
                delete dailySentTotal[entry]["value"]
                delete dailySentTotal[entry]["key"]
            }
        
            // Create keys to stack by based on operator and direction
            receivedKeys = []
            sentKeys = []
        
            var receivedStr = ""
            var sentStr = ""
        
            operators = Array.from(operators)
        
            for (var i=0; i<operators.length; i++) {
                receivedStr = operators[i] + "_received";
                receivedKeys.push(receivedStr)
                sentStr = operators[i] + "_sent"
                sentKeys.push(sentStr)
            }
        
            // Stack data by keys created above
            let stackReceivedDaily = d3.stack()
                    .keys(receivedKeys)
            let receivedDataStackedDaily = stackReceivedDaily(dailyReceivedTotal)
        
            let stackSentDaily = d3.stack()
                .keys(sentKeys)
            let sentDataStackedDaily = stackSentDaily(dailySentTotal)
        
            //Create margins for the three graphs
            const Margin = { top: 40, right: 100, bottom: 90, left: 70 };
            const Width = 960 - Margin.right - Margin.left;
            const Height = 500 - Margin.top - Margin.bottom;
        
        
            // Set x and y scales
            const x = d3.scaleTime().range([0, Width]);
            const failed_messages_x_axis_range = d3.scaleTime().range([0, Width]);
            const y_total_received_sms_range = d3.scaleLinear().range([Height, 0]);
            const y_total_sent_sms = d3.scaleLinear().range([Height, 0]);
            const y_total_failed_sms = d3.scaleLinear().range([Height, 0]);
        
        
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
        
            // Define line paths for total failed sms(s)
            const total_failed_line = d3.line()
                .curve(d3.curveLinear)
                .x(function (d) { return failed_messages_x_axis_range(new Date(d.datetime)) })
                .y(function (d) { return y_total_failed_sms(d.total_errored); })
        
            // Create line path element for failed line graph
            const total_failed_path = total_failed_sms_graph.append('path');
        
            // custom color scheme
            color_scheme = ["#31cece", "#f58231", "#3cb44b", "#CCCC00", "#4363d8", "#800000", "#f032e6", "#911eb4", "#e6194B"]
            let color = d3.scaleOrdinal(color_scheme);
            let colorReceived = d3.scaleOrdinal(color_scheme).domain(receivedKeys);
            let colorSent = d3.scaleOrdinal(color_scheme).domain(sentKeys);
        
            // set scale domain for failed graph
            y_total_failed_sms.domain([0, d3.max(data, function (d) { return d.total_errored; })]);
            xMin = d3.min(data, d => new Date(d.day));
            xMax = d3.max(data, d => add_one_day_to_date(d.day)) 
            failed_messages_x_axis_range.domain([xMin, xMax]);
        
            var yLimitReceived = d3.max(dailyReceivedTotal, function (d) { return d.total_received; });
            var yLimitReceivedFiltered = d3.max(dataFilteredWeek, function (d) { return d.total_received; });
            var yLimitSent = d3.max(dailySentTotal, function (d) { return d.total_sent; });
            var yLimitSentFiltered = d3.max(dataFilteredWeek, function (d) { return d.total_sent; });
        
            // Draw graphs according to selected time unit
            if (chartTimeUnit == "1day") {
                updateViewOneDay(yLimitReceived, yLimitSent)
            }
        
            else if (chartTimeUnit == "10min") {
                updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered)
            }
        
            // Y axis Label for the total received sms graph
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
                .call(d3.axisBottom(failed_messages_x_axis_range)
                    .ticks(5)
                    .tickFormat(timeFormat))
                // Rotate axis labels
                .selectAll("text") 
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");
            
            //Add X axis label for the total failed sms graph
            total_failed_sms_graph.append("text")
                .attr("transform",
                    "translate(" + (Width / 2) + " ," +
                    (Height + Margin.top + 50) + ")")
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
                .attr("transform", `translate(${Width - Margin.right + 110},${Margin.top - 30})`)
        
            var receivedLegend = d3.legendColor()
                .shapeWidth(12)
                .orient('vertical')
                .scale(colorReceived)
                .labels(operators);
        
            d3.select(".receivedLegend")
                .call(receivedLegend);
        
            // Total sent graph legend
            total_sent_sms_graph.append("g")
            .attr("class", "sentLegend")
            .attr("transform", `translate(${Width - Margin.right + 110},${Margin.top - 30})`)
        
            var sentLegend = d3.legendColor()
                .shapeWidth(12)
                .orient('vertical')
                .scale(colorSent)
                .labels(operators);
        
            d3.select(".sentLegend")
                .call(sentLegend);
        
            // Label Lines for the total failed sms graph
            total_failed_sms_graph.append("text")
        
            function updateReceivedChartLimit() {
                // Get the value of the button
                var ylimit = this.value
            
                y_total_received_sms.domain([0, ylimit]);
        
                // Add the Y Axis for the total received sms graph
                total_received_sms_graph.selectAll(".axisSteelBlue")
                .call(d3.axisLeft(y_total_received_sms));
                
                receivedLayer.selectAll('rect')
                    .data(function(d) { return d })
                    .attr('x', function (d) { return x(d.data.datetime) })
                    .attr('y', function (d) { return y_total_received_sms_range(d[1]) })
                    .attr('height', function (d) { return y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1]) })
                    .attr('width', Width / Object.keys(data).length)
            
            }
        
            function updateSentChartLimit() {
                // Get the value of the button
                var ylimit = this.value
            
                y_total_sent_sms.domain([0, ylimit]);
        
                // Add the Y Axis for the total sent sms graph
                total_sent_sms_graph.selectAll(".axisSteelBlue")
                .call(d3.axisLeft(y_total_sent_sms));
                
                sentLayer.selectAll('rect')
                    .data(function(d) { return d })
                    .attr('x', function (d) { return x(d.data.datetime) })
                    .attr('y', function (d) { return y_total_sent_sms(d[1]) })
                    .attr('height', function (d) { return y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]) })
                    .attr('width', Width / Object.keys(data).length)
            
            }
        
            // Add an event listener to the button created in the html part
            d3.select("#buttonYLimitReceived").on("input", updateReceivedChartLimit )
            d3.select("#buttonYLimitSent").on("input", updateSentChartLimit )
                .attr("transform", `translate(${Width - Margin.right + 100},${Margin.top})`)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("fill", "blue")
                .text("Total Failed");
        
            // Set y-axis control button value and draw graphs
            function updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered) {
                d3.select("#buttonYLimitReceived").property("value", yLimitReceivedFiltered);
                d3.select("#buttonYLimitSent").property("value", yLimitSentFiltered);
                draw10MinReceivedGraph(yLimitReceivedFiltered)
                draw10MinSentGraph(yLimitSentFiltered)       
            }
        
            function updateViewOneDay(yLimitReceived, yLimitSent) {
                d3.select("#buttonYLimitReceived").property("value", yLimitReceived);
                d3.select("#buttonYLimitSent").property("value", yLimitSent);
                drawOneDayReceivedGraph(yLimitReceived)
                drawOneDaySentGraph(yLimitSent)
            }
        
            function draw10MinReceivedGraph(yLimitReceived) {
                // Set Y axis limit to max of daily values or to the value inputted by the user
                if (isYLimitReceivedManuallySet == false) {
                    yLimitReceived = d3.max(dataFilteredWeek, function (d) { return d.total_received; });
                }
        
                let stackReceived = d3.stack()
                    .keys(receivedKeys)
                let receivedDataStacked = stackReceived(dataFilteredWeek)
        
                // set scale domains
                x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
                y_total_received_sms_range.domain([0, yLimitReceived]);
        
                d3.selectAll(".redrawElementReceived").remove();
                d3.selectAll("#receivedStack").remove();
                d3.selectAll("#receivedStack10min").remove();
        
                // Add the Y Axis for the total received sms graph
                total_received_sms_graph.append("g")
                    .attr("id", "axisSteelBlue")
                    .attr("class", "redrawElementReceived")
                    .call(d3.axisLeft(y_total_received_sms_range));
        
                let receivedLayer10min = total_received_sms_graph.selectAll('#receivedStack10min')
                    .data(receivedDataStacked)
                    .enter()    
                .append('g')
                    .attr('id', 'receivedStack10min')    
                    .attr('class', function(d, i) { return receivedKeys[i] })
                    .style('fill', function (d, i) { return color(i) })
                
                receivedLayer10min.selectAll('rect')
                    .data(function(dataFilteredWeek) { return dataFilteredWeek })
                    .enter()
                .append('rect')
                    .attr('x', function (d) { return x(d.data.datetime) })
                    .attr('y', function (d) { return y_total_received_sms_range(d[1]) })
                    .attr('height', function (d) { return y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1]) })
                    .attr('width', Width / Object.keys(dataFilteredWeek).length)
        
                //Add the X Axis for the total received sms graph
                total_received_sms_graph.append("g")
                    .attr("class", "redrawElementReceived")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .ticks(d3.timeDay.every(1))
                        .tickFormat(timeFormat))
                    // Rotate axis labels
                    .selectAll("text") 
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");
        
                // Add X axis label for the total received sms graph
                total_received_sms_graph.append("text")
                    .attr("class", "redrawElementReceived")
                    .attr("transform",
                            "translate(" + (Width / 2) + " ," +
                            (Height + Margin.top + 50) + ")")
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
        
            function drawOneDayReceivedGraph(yLimitReceived) {
                // Set Y axis limit to max of daily values or to the value inputted by the user
                yLimitReceivedTotal = d3.max(dailyReceivedTotal, function (d) { return d.total_received; });
        
                if (isYLimitReceivedManuallySet == false) {
                    yLimitReceived = yLimitReceivedTotal
                }
        
                xMin = d3.min(data, d => new Date(d.day));
                xMax = d3.max(data, d => add_one_day_to_date(d.day)) 
                // set scale domains
                x.domain([xMin, xMax]);
                y_total_received_sms_range.domain([0, yLimitReceived]);
            
                d3.selectAll(".redrawElementReceived").remove();
                d3.selectAll("#receivedStack10min").remove();
                d3.selectAll("#receivedStack").remove();
            
                    // Add the Y Axis for the total received sms graph
                    total_received_sms_graph.append("g")
                    .attr("class", "axisSteelBlue")
                    .attr("class", "redrawElementReceived")
                    .call(d3.axisLeft(y_total_received_sms_range));
            
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
                    .attr('y', function (d) { return y_total_received_sms_range(d[1]) })
                    .attr('height', function (d) { return y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1]) })
                    .attr('width', Width / Object.keys(dailyReceivedTotal).length);
            
                    //Add the X Axis for the total received sms graph
                total_received_sms_graph.append("g")
                    .attr("class", "redrawElementReceived")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .ticks(d3.timeDay.every(4))
                        .tickFormat(dayDateFormat))
                    // Rotate axis labels
                    .selectAll("text") 
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");
            
                // Add X axis label for the total received sms graph
                total_received_sms_graph.append("text")
                    .attr("class", "redrawElementReceived")
                    .attr("transform",
                            "translate(" + (Width / 2) + " ," +
                            (Height + Margin.top + 50) + ")")
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
            
            function draw10MinSentGraph(yLimitSent) {
                // Set Y axis limit to max of daily values or to the value inputted by the user
                if (isYLimitSentManuallySet == false) {
                    yLimitSent = d3.max(dataFilteredWeek, function (d) { return d.total_sent; });
                }
            
                let stackSent = d3.stack()
                    .keys(sentKeys)
                let sentDataStacked = stackSent(dataFilteredWeek)
            
                // set scale domains
                x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
                y_total_sent_sms.domain([0, yLimitSent]);
            
                // Remove changing chart elements before redrawing
                d3.selectAll(".redrawElementSent").remove();
                d3.selectAll("#sentStack1day").remove();
                d3.selectAll("#sentStack10min").remove();
            
                // Add the Y Axis for the total sent sms graph
                total_sent_sms_graph.append("g")
                    .attr("class", "axisSteelBlue")
                    .attr("class", "redrawElementSent")
                    .call(d3.axisLeft(y_total_sent_sms));
                
                // Create stacks
                let sentLayer10min = total_sent_sms_graph.selectAll('#sentStack10min')
                    .data(sentDataStacked)
                    .enter()    
                .append('g')
                    .attr('id', 'sentStack10min')    
                    .attr('class', function(d, i) { return sentKeys[i] })
                    .style('fill', function (d, i) { return color(i) })
                    
                sentLayer10min.selectAll('rect')
                    .data(function(dataFilteredWeek) { return dataFilteredWeek })
                    .enter()
                .append('rect')
                    .attr('x', function (d) { return x(d.data.datetime) })
                    .attr('y', function (d) { return y_total_sent_sms(d[1]) })
                    .attr('height', function (d) { return y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]) })
                    .attr('width', Width / Object.keys(dataFilteredWeek).length)
                
                //Add the X Axis for the total sent sms graph
                total_sent_sms_graph.append("g")
                    .attr("class", "redrawElementSent")
                    .attr("transform", "translate(0," + Height + ")")
                    .call(d3.axisBottom(x)
                        .ticks(d3.timeDay.every(1))
                        .tickFormat(timeFormat))
                    // Rotate axis labels
                    .selectAll("text") 
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");
            
                // Add X axis label for the total sent sms graph
                total_sent_sms_graph.append("text")
                    .attr("class", "redrawElementSent")
                    .attr("transform",
                            "translate(" + (Width / 2) + " ," +
                            (Height + Margin.top + 50) + ")")
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
            
            function drawOneDaySentGraph(yLimitSent) {
                // Set Y axis limit to max of daily values or to the value inputted by the user
                yLimitSentTotal = d3.max(dailySentTotal, function (d) { return d.total_sent; });
        
                if (isYLimitSentManuallySet != true) {
                    yLimitSent = yLimitSentTotal
                }
        
                xMin = d3.min(data, d => new Date(d.day));
                xMax = d3.max(data, d => add_one_day_to_date(d.day)) 
                // set scale domains
                x.domain([xMin, xMax]);
                y_total_sent_sms.domain([0, yLimitSent]);
            
                d3.selectAll(".redrawElementSent").remove();
                d3.selectAll("#sentStack10min").remove();
                d3.selectAll("#sentStack1day").remove();
            
                    // Add the Y Axis for the total sent sms graph
                total_sent_sms_graph.append("g")
                    .attr("class", "axisSteelBlue")
                    .attr("class", "redrawElementSent")
                    .call(d3.axisLeft(y_total_sent_sms));
            
                // Create stacks
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
                        .ticks(d3.timeDay.every(4))
                        .tickFormat(dayDateFormat))
                    // Rotate axis labels
                    .selectAll("text") 
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");
            
                    // Add X axis label for the total sent sms graph
                    total_sent_sms_graph.append("text")
                        .attr("class", "redrawElementSent")
                        .attr("transform",
                                "translate(" + (Width / 2) + " ," +
                                (Height + Margin.top + 50) + ")")
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
        
            // Update chart time unit on user selection
            d3.select("#buttonUpdateView10Minutes").on("click", function() {
                chartTimeUnit = "10min"
                updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered)                                                                                                                                                                                                                                       
            } )
        
            d3.select("#buttonUpdateViewOneDay").on("click", function() {
                chartTimeUnit = "1day"
                updateViewOneDay(yLimitReceived, yLimitSent)
            } )
            
            // Draw received graph with user-selected y-axis limit
            d3.select("#buttonYLimitReceived").on("input", function() {
                isYLimitReceivedManuallySet = true
                if (chartTimeUnit == "1day") {
                    yLimitReceived = this.value
                    drawOneDayReceivedGraph(yLimitReceived)
                }
                else if (chartTimeUnit == "10min") {
                    yLimitReceivedFiltered = this.value
                    draw10MinReceivedGraph(yLimitReceivedFiltered)
                }
            });                                                                                                                                                                                  
        
            // Draw sent graph with user-selected y-axis limit
            d3.select("#buttonYLimitSent").on("input", function() {
                isYLimitSentManuallySet = true
                if (chartTimeUnit == "1day") {
                    yLimitSent = this.value
                    drawOneDaySentGraph(yLimitSent)
                }
                else if (chartTimeUnit == "10min") {
                    yLimitSentFiltered = this.value
                    draw10MinSentGraph(yLimitSentFiltered)
                }
            });                        
            
            var fullDateFormat = d3.timeFormat("%c")	
        
            d3.select("#lastUpdated").classed("alert", false).text(fullDateFormat(timestamp))
        
            setInterval(setLastUpdatedAlert, 1000);  
        },
    };

})();

// UI CONTROLLER
var UIController = (function() {
    var DOMstrings = {
        projectMenu: '.select__project',
        codingProgressLink: '.codingprogress__link',
        codingProgressContainer: '.codingprogress__table',
        graphContainer: '.graph__list',
        logoutBtn: '.logout__btn',
    };

    return {

        getDOMstrings: function() {
            return DOMstrings;
        },

        addDropdownMenu: function(data) {
            var html, newHtml;
            html = `<a id="project" class="dropdown-item">%project_name%</a><div class="dropdown-divider"></div>`
            // Replace the placeholder text with some actual data
            data.forEach(function (obj) {
                newHtml = html.replace('%project_name%', obj.project_name);
                document.querySelector(".dropdown-menu").insertAdjacentHTML('beforeend', newHtml);
            });
            
        },

        addSection: function() {
            var html;
            html = `<div class="container container-fluid table-responsive">
                    <table id='codingtable' class='table'>
                        <thead>
                            <tr class="table-heading">
                                <th scope="col">Dataset</th>
                                <th scope="col">Messages</th>
                                <th scope="col">Messages with a label</th>
                                <th scope="col">Done</th>
                                <th scope="col">Wrong Scheme messages</th>
                                <th scope="col">WS %</th>
                                <th scope="col">Not Coded messages</th>
                                <th scope="col">NC %</th>
                            </tr>
                        </thead>
                        <tbody id="coding_status_body"></tbody>
                    </table>
                <div id="last_update">Last updated: </div>
            </div> `
            // Insert the HTML into the DOM
            document.querySelector(".coding_progress").insertAdjacentHTML('beforeend', html);
        },

        update_progress_ui: function(data) {
            // console.log("update_ui: " + JSON.stringify(data));
            var status_body = document.getElementById('coding_status_body');
            while (status_body.firstChild) {
                // status_body.removeChild(status_body.firstChild);
            }
            last_update = data["last_update"]
            document.getElementById('last_update').innerText = "Last updated: " + last_update
            for (var dataset_id in data["coding_progress"]) {
                var messages_count = data["coding_progress"][dataset_id]["messages_count"]
                var messages_with_label = data["coding_progress"][dataset_id]["messages_with_label"]
                var wrong_scheme_messages = data['coding_progress'][dataset_id]['wrong_scheme_messages']
                var not_coded_messages = data['coding_progress'][dataset_id]['not_coded_messages']
                var dataset_link = document.createElement("a")
                    dataset_link.setAttribute("href", "https://web-coda.firebaseapp.com/?dataset="+dataset_id)
                    dataset_link.setAttribute('target', '_blank')
                    dataset_link.innerText = dataset_id
                rw = status_body.insertRow()
                rw.insertCell().appendChild(dataset_link)
                rw.insertCell().innerText = messages_count
                rw.insertCell().innerText = messages_with_label
                rw.insertCell().innerText = (100 * messages_with_label / messages_count).toFixed(2) + '%'
                rw.insertCell().innerText = wrong_scheme_messages != null ? wrong_scheme_messages : "-"
                rw.insertCell().innerText = wrong_scheme_messages != null ? (100 * wrong_scheme_messages / messages_count).toFixed(2) + '%' : "-"
                rw.insertCell().innerText = not_coded_messages != null ? not_coded_messages : "-"
                rw.insertCell().innerText = not_coded_messages != null ?(100 * not_coded_messages / messages_count).toFixed(2) + '%' : "-"
                // console.log(dataset_id, messages_count, messages_with_label,wrong_scheme_messages,not_coded_messages);
                //Table sorting using tablesorter plugin based on fraction of message labelling complete   
                $("#codingtable").tablesorter({
                    //sorting on page load, column four in descending order i.e from least coded to most coded.
                    sortList: [[3, 0]]
                });
                //Trigger sorting on table data update
                $('#codingtable').tablesorter().trigger('update');
                //Formating rows based on cell value
                $('#codingtable td:nth-child(4)').each(function () {
                    var Done = $(this).text();
                    //Style the entire row conditionally based on the cell value
                    if ((parseFloat(Done) === 0)) {
                        $(this).parent().addClass('coding-notstarted');
                    }
                    else if ((parseFloat(Done) > 0) && (parseFloat(Done) <= 25)) {
                        $(this).parent().addClass('coding-below25');
                    }
                    else if ((parseFloat(Done) > 25) && (parseFloat(Done) <= 50)) {
                        $(this).parent().addClass('coding-above25');
                    }
                    else if ((parseFloat(Done) > 50) && (parseFloat(Done) <= 75)) {
                        $(this).parent().addClass('coding-above50');
                    }
                    else if ((parseFloat(Done) > 75) && (parseFloat(Done) < 100)) {
                        $(this).parent().addClass('coding-above75');
                    }
                    else {
                        $(this).parent().addClass('coding-complete');
                    }
                });
            }
        }, 

        addGraphs: function() {
            var html;
            html = `<div class="container"> 
                <div class="d-md-flex justify-content-between p-1">
                    <span class="txt-brown my-auto"><b>IMAQAL</b></span>
                    <div>
                        <span class="align-content-end font-weight-bold">Timescale</span>
                        <input class="mr-2 btn btn-sm btn-brown" type="button" id="buttonUpdateView10Minutes" value="10 minutes">
                        <input class="btn btn-sm btn-brown" type="button" id="buttonUpdateViewOneDay" value="1 day"> 
                    </div>
                </div> 
                <section>
                    <div class="d-md-flex justify-content-start my-2">
                        <span class="font-weight-bold" type="text">Set the maximum number of incoming messages you want to see</span> 
                        <div class="col-md-2"><input class="form-control form-control-sm" type="number" id="buttonYLimitReceived" step="100" min="10"></div>
                    </div>
                    <div class="card shadow total_received_sms_graph"></div>
                </section> 
                <section>
                    <div class="d-md-flex justify-content-start mt-4 mb-3">
                        <span class="font-weight-bold" type="text">Set the maximum number of outgoing messages you want to see</span> 
                        <div class="col-md-2"><input class="form-control form-control-sm" type="number" id="buttonYLimitSent" step="500" min="10"></div>
                    </div>
                    <div class="card shadow total_sent_sms_graph"></div>
                </section> 
                <div class="card shadow total_failed_sms_graph my-4"></div> 
            </div> `
            // Insert the HTML into the DOM
            document.querySelector(".coding_progress").insertAdjacentHTML('beforeend', html);
        }
    }
})();

// // GLOBAL APP CONTROLLER
var controller = (function(authCtrl, dataCtrl, graphCtrl, UICtrl) {

    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();
        document.querySelector(DOM.logoutBtn).addEventListener('click', ctrlLogoutDashboard);
        document.querySelector(DOM.codingProgressLink).addEventListener('click', ctrlDisplayCodingProgress);
        document.querySelector(DOM.projectMenu).addEventListener('click', ctrlDisplayProject);          
    };
    
    // Logout of the dashboard
    var ctrlLogoutDashboard = function() {
        authCtrl.logout()
    };

    var ctrlDisplayCodingProgress = function(e) {
        if(e.target && e.target.nodeName == "A") {
            window.location.reload();
        }
    };
    
    var ctrlDisplayProject = function(e) {
        var collection;
        var DOM = UICtrl.getDOMstrings();
        document.querySelector(DOM.codingProgressContainer).innerHTML = "";
        document.querySelector(DOM.graphContainer).innerHTML = "";
        if(e.target && e.target.nodeName == "A") {
            console.log(e.target.innerText)
            collection = e.target.innerText
        }
        dataCtrl.resetData()
        // Add the graphs container to the UI
        UICtrl.addGraphs();
        // Update and show the Graphs
        dataCtrl.getCollection(collection, graphCtrl.update_graphs);
    };  

    // window.onload = function () {
    //     authCtrl.initApp();
    //     dataCtrl.getProject(UICtrl.addDropdownMenu);
    //     UICtrl.addSection();
    //     dataCtrl.getDocument(UICtrl.update_progress_ui);
    // };

    return {
        init: function() {
            console.log('Application has started.');
            authCtrl.initApp();
            setupEventListeners();
            dataCtrl.getProject(UICtrl.addDropdownMenu);
            UICtrl.addSection();
            dataCtrl.getDocument(UICtrl.update_progress_ui);
        }
    };
    
})(authController, dataController, graphController, UIController);

const mediadb = firebase.firestore();
const settings = { timestampsInSnapshots: true };
mediadb.settings(settings);
controller.init();























