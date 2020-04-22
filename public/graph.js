// GRAPH CONTROLLER
class GraphController {
    static addOneDayToDate(date) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }

    static updateGraphs(data, projectName, MNOColors, week=7, month=30) {
        const TIMEFRAME_WEEK = week,
            TIMEFRAME_MONTH = month;
        if (!GraphController.chartTimeUnit) {
            GraphController.chartTimeUnit = "10min";
        }
        // let chartTimeUnit = "10min",
        let isYLimitReceivedManuallySet = false,
            isYLimitSentManuallySet = false,
            isYLimitFailedManuallySet = false,
            dayDateFormat = d3.timeFormat("%Y-%m-%d"),
            dayDateFormatWithWeekdayName = d3.timeFormat("%Y-%m-%d:%a"),
            operators = new Set();

        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        // format the data
        data.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            d.day = dayDateFormat(new Date(d.datetime));
            d.total_received = +d.total_received;
            d.total_sent = +d.total_sent;
            d.total_pending = +d.total_pending;
            d.total_errored = +d.total_errored;
            Object.keys(d.operators)
                .sort()
                .forEach(operator => {
                    if (!(operator in operators)) {
                        operators.add(operator);
                        d[`${operator}_received`] = +d.operators[operator]["received"];
                        d[`${operator}_sent`] = +d.operators[operator]["sent"];
                    }
                });
        });

        // Sort data by date
        data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        let offsetWeek = new Date(),
            offsetMonth = new Date();

        offsetWeek.setDate(offsetWeek.getDate() - TIMEFRAME_WEEK);
        offsetMonth.setDate(offsetMonth.getDate() - TIMEFRAME_MONTH);
        // Set date offsets to nearest midnight in the past
        offsetWeek.setHours(0,0,0,0)
        offsetMonth.setHours(0,0,0,0)

        // Set default y-axis limits
        let dataFilteredWeek = data.filter(a => a.datetime > offsetWeek),
            dataFilteredMonth = data.filter(a => a.datetime > offsetMonth);

        // Group received data by day
        let dailyReceivedTotal = d3
            .nest()
            .key(d => d.day)
            .rollup(v => {
                let receivedData = {};
                operators.forEach(operator => {
                    receivedData[`${operator}_received`] = d3.sum(
                        v,
                        d => d[`${operator}_received`]
                    );
                });
                receivedData["total_received"] = d3.sum(v, d => d.total_received);
                return receivedData;
            })
            .entries(dataFilteredMonth);

        // Flatten nested data for stacking
        for (let entry in dailyReceivedTotal) {
            let valueList = dailyReceivedTotal[entry].value;
            for (let key in valueList) {
                dailyReceivedTotal[entry][key] = valueList[key];
            }
            dailyReceivedTotal[entry]["day"] = dailyReceivedTotal[entry].key;
            delete dailyReceivedTotal[entry]["value"];
            delete dailyReceivedTotal[entry]["key"];
        }

        // Group sent data by day
        let dailySentTotal = d3
            .nest()
            .key(d => d.day)
            .rollup(v => {
                let sentData = {};
                operators.forEach(operator => {
                    sentData[`${operator}_sent`] = d3.sum(v, d => d[`${operator}_sent`]);
                });
                sentData["total_sent"] = d3.sum(v, d => d.total_sent);
                return sentData;
            })
            .entries(dataFilteredMonth);

        // Flatten nested data for stacking
        for (let entry in dailySentTotal) {
            let valueList = dailySentTotal[entry].value;
            for (let key in valueList) {
                dailySentTotal[entry][key] = valueList[key];
            }
            dailySentTotal[entry]["day"] = dailySentTotal[entry].key;
            delete dailySentTotal[entry]["value"];
            delete dailySentTotal[entry]["key"];
        }

        // Group failed data by day
        let dailyFailedTotal = d3
            .nest()
            .key(d => d.day)
            .rollup(v => {
                let failedData = {};
                failedData["total_errored"] = d3.sum(v,d => d.total_errored);
                return failedData;
            })
            .entries(dataFilteredMonth);

        // Flatten nested data
        for (let entry in dailyFailedTotal) {
            let valueList = dailyFailedTotal[entry].value;
            for (let key in valueList) {
                dailyFailedTotal[entry][key] = valueList[key];
            }
            dailyFailedTotal[entry]["day"] = dailyFailedTotal[entry].key;
            delete dailyFailedTotal[entry]["value"];
            delete dailyFailedTotal[entry]["key"];
        }

        // Create keys to stack by based on operator and direction
        let receivedKeys = [],
            sentKeys = [],
            receivedStr = "",
            sentStr = "";

        operators = Array.from(operators);

        for (let i = 0; i < operators.length; i++) {
            receivedStr = operators[i] + "_received";
            receivedKeys.push(receivedStr);
            sentStr = operators[i] + "_sent";
            sentKeys.push(sentStr);
        }

        // Stack data by keys created above
        let stackReceivedDaily = d3.stack().keys(receivedKeys),
            receivedDataStackedDaily = stackReceivedDaily(dailyReceivedTotal),
            stackSentDaily = d3.stack().keys(sentKeys),
            sentDataStackedDaily = stackSentDaily(dailySentTotal);

        //Create margins for the three graphs
        const Margin = { top: 40, right: 100, bottom: 105, left: 70 },
            Width = 960 - Margin.right - Margin.left,
            Height = 500 - Margin.top - Margin.bottom,
            // Set x and y scales
            x = d3.scaleTime().range([0, Width]),
            failed_messages_x_axis_range = d3.scaleTime().range([0, Width]),
            y_total_received_sms_range = d3.scaleLinear().range([Height, 0]),
            y_total_sent_sms_range = d3.scaleLinear().range([Height, 0]),
            y_total_failed_sms_range = d3.scaleLinear().range([Height, 0]);

        // Append total received sms graph to svg
        let total_received_sms_graph = d3
                .select(".total_received_sms_graph")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform", "translate(" + Margin.left + "," + Margin.top + ")"),
            // Append total sent sms graph to svg
            total_sent_sms_graph = d3
                .select(".total_sent_sms_graph")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform", "translate(" + Margin.left + "," + Margin.top + ")"),
            // Append total sent sms graph to svg
            total_failed_sms_graph = d3
                .select(".total_failed_sms_graph")
                .append("svg")
                .attr("width", Width + Margin.left + Margin.right + 120)
                .attr("height", Height + Margin.top + Margin.bottom)
                .append("g")
                .attr("transform", "translate(" + Margin.left + "," + Margin.top + ")"),
            // Format TimeStamp
            timeFormat = d3.timeFormat("%Y-%m-%d");

            // Y axis Label for the total failed sms graph
            total_failed_sms_graph
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - Margin.left)
                .attr("x", 0 - Height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("No. of Failed Message (s)");

        let mno_color_scheme = [],
            operators_with_color_identity = Object.keys(MNOColors);

        // Generate color scheme based on operators identity
        operators.forEach((operator, index) => {
            if (operators_with_color_identity.includes(operator)) {
                mno_color_scheme[index] = MNOColors[operator];
            }
        });

        let color = d3.scaleOrdinal(mno_color_scheme),
            colorReceived = d3.scaleOrdinal(mno_color_scheme).domain(receivedKeys),
            colorSent = d3.scaleOrdinal(mno_color_scheme).domain(sentKeys),
            colorFailed = d3.scaleOrdinal(["#ff0000"]).domain(["total_errored"]);

        let yLimitReceived = d3.max(dailyReceivedTotal, d => d.total_received),
            yLimitReceivedFiltered = d3.max(dataFilteredWeek, d => d.total_received),
            yLimitSent = d3.max(dailySentTotal, d => d.total_sent),
            yLimitSentFiltered = d3.max(dataFilteredWeek, d => d.total_sent),
            yLimitFailed = d3.max(dailyFailedTotal, d => d.total_errored),
            yLimitFailedFiltered = d3.max(dataFilteredWeek, d => d.total_errored); 

        // Draw graphs according to selected time unit
        if (GraphController.chartTimeUnit == "1day") {
            updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed);
        } else if (GraphController.chartTimeUnit == "10min") {
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered, yLimitFailedFiltered);
        }

        // Y axis Label for the total received sms graph
        total_received_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - Margin.left)
            .attr("x", 0 - Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Incoming Message (s)");

        // Y axis Label for the total sent sms graph
        total_sent_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - Margin.left)
            .attr("x", 0 - Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Outgoing Message (s)");

        // Total received graph legend
        total_received_sms_graph
            .append("g")
            .attr("class", "receivedLegend")
            .attr("transform", `translate(${Width - Margin.right + 110},${Margin.top - 30})`);

        let receivedLegend = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(colorReceived)
            .labels(operators);

        d3.select(".receivedLegend").call(receivedLegend);

        // Total sent graph legend
        total_sent_sms_graph
            .append("g")
            .attr("class", "sentLegend")
            .attr("transform", `translate(${Width - Margin.right + 110},${Margin.top - 30})`);

        let sentLegend = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(colorSent)
            .labels(operators);

        d3.select(".sentLegend").call(sentLegend);

        // Total failed graph legend
        total_failed_sms_graph
            .append("g")
            .attr("class", "failedLegend")
            .attr(
                "transform",
                `translate(${Width - Margin.right + 110},${Margin.top - 30})`
            );
        let failedLegend = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(colorFailed)
            .labels(["total failed"]);

        d3.select(".failedLegend").call(failedLegend);

        // Set y-axis control button value and draw graphs
        function updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered, yLimitFailedFiltered) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceivedFiltered);
            d3.select("#buttonYLimitSent").property("value", yLimitSentFiltered);
            d3.select("#buttonYLimitFailed").property("value", yLimitFailedFiltered);
            draw10MinReceivedGraph(yLimitReceivedFiltered);
            draw10MinSentGraph(yLimitSentFiltered);
            draw10MinFailedGraph(yLimitFailedFiltered);
        }

        function updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceived);
            d3.select("#buttonYLimitSent").property("value", yLimitSent);
            d3.select("#buttonYLimitFailed").property("value", yLimitFailed);
            drawOneDayReceivedGraph(yLimitReceived);
            drawOneDaySentGraph(yLimitSent);
            drawOneDayFailedGraph(yLimitFailed);
        }

        function draw10MinReceivedGraph(yLimitReceived) {
            // Set Y axis limit to max of daily values or to the value inputted by the user
            if (isYLimitReceivedManuallySet == false) {
                yLimitReceived = d3.max(dataFilteredWeek, d => d.total_received);
            }

            let stackReceived = d3.stack().keys(receivedKeys),
                receivedDataStacked = stackReceived(dataFilteredWeek);

            // set scale domains
            x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
            if (yLimitReceived > 0)
                y_total_received_sms_range.domain([0, yLimitReceived]);

            d3.selectAll(".redrawElementReceived").remove();
            d3.selectAll("#receivedStack").remove();
            d3.selectAll("#receivedStack10min").remove();
            d3.selectAll(".receivedGrid").remove();

            // Group data filtered by week daily and generate tick values for x axis
            let dataFilteredWeekGroupedDaily  = d3.nest().key(d => d.day).entries(dataFilteredWeek);
            let tickValuesForXAxis = dataFilteredWeekGroupedDaily.map(d => new Date(d.key)).slice(1)
           
            // Add the X gridlines
            total_received_sms_graph.append("g")			
                .attr("class", "receivedGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickValues(tickValuesForXAxis)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Add the Y gridlines
            total_received_sms_graph.append("g")			
                .attr("class", "receivedGrid")
                .call(d3.axisLeft(y_total_received_sms_range)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add the Y Axis for the total received sms graph
            total_received_sms_graph
                .append("g")
                .attr("id", "axisSteelBlue")
                .attr("class", "redrawElementReceived")
                .call(d3.axisLeft(y_total_received_sms_range));

            let receivedLayer10min = total_received_sms_graph
                .selectAll("#receivedStack10min")
                .data(receivedDataStacked)
                .enter()
                .append("g")
                .attr("id", "receivedStack10min")
                .attr("class", (d, i) => receivedKeys[i])
                .style("fill", (d, i) => color(i));

            receivedLayer10min
                .selectAll("rect")
                .data(dataFilteredWeek => dataFilteredWeek)
                .enter()
                .append("rect")
                .attr("x", d => x(d.data.datetime))
                .attr("y", d => y_total_received_sms_range(d[1]))
                .attr(
                    "height",
                    d => y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1])
                )
                .attr("width", Width / Object.keys(dataFilteredWeek).length);

            //Add the X Axis for the total received sms graph
            total_received_sms_graph
                .append("g")
                .attr("class", "redrawElementReceived")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .tickValues(tickValuesForXAxis)
                        .tickFormat(timeFormat)
                )
                // Rotate axis labels
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label for the total received sms graph
            total_received_sms_graph
                .append("text")
                .attr("class", "redrawElementReceived")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (Y-M-D)");

            // Total Sms(s) graph title
            total_received_sms_graph
                .append("text")
                .attr("class", "redrawElementReceived")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Total Incoming Message(s) / 10 minutes");
        }

        function drawOneDayReceivedGraph(yLimitReceived) {
            // Set Y axis limit to max of daily values or to the value inputted by the user
            let yLimitReceivedTotal = d3.max(dailyReceivedTotal, d => d.total_received);

            if (isYLimitReceivedManuallySet == false) {
                yLimitReceived = yLimitReceivedTotal;
            }

            let xMin = d3.min(dailyReceivedTotal, d => new Date(d.day)),
                xMax = d3.max(dailyReceivedTotal, d => GraphController.addOneDayToDate(d.day));
            // set scale domains
            x.domain([xMin, xMax]);
            if (yLimitReceived > 0)
                y_total_received_sms_range.domain([0, yLimitReceived]);

            d3.selectAll(".redrawElementReceived").remove();
            d3.selectAll("#receivedStack10min").remove();
            d3.selectAll("#receivedStack").remove();
            d3.selectAll(".receivedGrid").remove();

            // Add the X gridlines
            const tickValuesForXAxis = dailyReceivedTotal.map(d => new Date(d.day));
            total_received_sms_graph.append("g")			
                .attr("class", "receivedGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickValues(tickValuesForXAxis)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Add the Y gridlines
            total_received_sms_graph.append("g")			
                .attr("class", "receivedGrid")
                .call(d3.axisLeft(y_total_received_sms_range)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add the Y Axis for the total received sms graph
            total_received_sms_graph
                .append("g")
                .attr("class", "axisSteelBlue")
                .attr("class", "redrawElementReceived")
                .call(d3.axisLeft(y_total_received_sms_range));

            let receivedLayer = total_received_sms_graph
                .selectAll("#receivedStack")
                .data(receivedDataStackedDaily)
                .enter()
                .append("g")
                .attr("id", "receivedStack")
                .attr("class", (d, i) => receivedKeys[i])
                .style("fill", (d, i) => color(i));

            let innerPadding = 5
            receivedLayer
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("x", d => x(new Date(d.data.day)))
                .attr("y", d => y_total_received_sms_range(d[1]))
                .attr(
                    "height",
                    d => y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1])
                )
                .attr("width", (Width / Object.keys(dailyReceivedTotal).length) - innerPadding);

            // Add tooltip for the total received sms graph
            let tip;
            receivedLayer
                .selectAll("rect")
                .on("mouseover", (d, i, n) => {
                    // Get key of stacked data from the selection
                    let operatorNameWithMessageDirection = d3.select(n[i].parentNode).datum().key,
                        // Get operator name from the key
                        operatorName = operatorNameWithMessageDirection.replace('_received',''),
                        // Get color of hovered rect
                        operatorColor = d3.select(n[i]).style("fill");
                    tip = d3.tip()
                        .attr("class", "tooltip")
                        .attr("id", "tooltip")
                        .html(d => { 
                            let receivedMessages = d.data[operatorNameWithMessageDirection],
                                totalReceivedMessages = d.data.total_received,
                                // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
                                tooltipContent = `<div>${receivedMessages} 
                                (${Math.round((receivedMessages/totalReceivedMessages)*100)}%)
                                ${operatorName.charAt(0).toUpperCase() + operatorName.slice(1)} 
                                Message${receivedMessages !== 1 ? 's': ''} </div>`;
                            return tooltipContent;
                    })
                    total_received_sms_graph.call(tip)
                    tip.show(d, n[i]).style("color", operatorColor)
                })
                .on("mouseout", (d, i, n) => {
                    tip.hide()
                })

            // "Add the X Axis for the total received sms graph
            total_received_sms_graph
                .append("g")
                .attr("class", "redrawElementReceived")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .tickValues(tickValuesForXAxis)
                        .tickFormat(d => dayDateFormatWithWeekdayName(d))
                )
                // Rotate axis labels
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label for the total received sms graph
            total_received_sms_graph
                .append("text")
                .attr("class", "redrawElementReceived")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 65) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (Y-M-D)");

            // Total Sms(s) graph title
            total_received_sms_graph
                .append("text")
                .attr("class", "redrawElementReceived")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Total Incoming Message(s) / day");
        }

        function draw10MinSentGraph(yLimitSent) {
            // Set Y axis limit to max of daily values or to the value inputted by the user
            if (isYLimitSentManuallySet == false) {
                yLimitSent = d3.max(dataFilteredWeek, d => d.total_sent);
            }

            let stackSent = d3.stack().keys(sentKeys),
                sentDataStacked = stackSent(dataFilteredWeek);

            // set scale domains
            x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
            if (yLimitSent > 0)
                y_total_sent_sms_range.domain([0, yLimitSent]);

            // Remove changing chart elements before redrawing
            d3.selectAll(".redrawElementSent").remove();
            d3.selectAll("#sentStack1day").remove();
            d3.selectAll("#sentStack10min").remove();
            d3.selectAll(".sentGrid").remove();

            // Group data filtered by week daily and generate tick values for x axis
            let dataFilteredWeekGroupedDaily  = d3.nest().key(d => d.day).entries(dataFilteredWeek);
            let tickValuesForXAxis = dataFilteredWeekGroupedDaily.map(d => new Date(d.key)).slice(1)
           
            // Add the X gridlines
            total_sent_sms_graph.append("g")			
                .attr("class", "sentGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickValues(tickValuesForXAxis)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Add the Y gridlines
            total_sent_sms_graph.append("g")			
                .attr("class", "sentGrid")
                .call(d3.axisLeft(y_total_sent_sms_range)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add the Y Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "axisSteelBlue")
                .attr("class", "redrawElementSent")
                .call(d3.axisLeft(y_total_sent_sms_range));

            // Create stacks
            let sentLayer10min = total_sent_sms_graph
                .selectAll("#sentStack10min")
                .data(sentDataStacked)
                .enter()
                .append("g")
                .attr("id", "sentStack10min")
                .attr("class", (d, i) => sentKeys[i])
                .style("fill", (d, i) => color(i));

            sentLayer10min
                .selectAll("rect")
                .data(dataFilteredWeek => dataFilteredWeek)
                .enter()
                .append("rect")
                .attr("x", d => x(d.data.datetime))
                .attr("y", d => y_total_sent_sms_range(d[1]))
                .attr("height", d => y_total_sent_sms_range(d[0]) - y_total_sent_sms_range(d[1]))
                .attr("width", Width / Object.keys(dataFilteredWeek).length);

            //Add the X Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "redrawElementSent")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .tickValues(tickValuesForXAxis)
                        .tickFormat(timeFormat)
                )
                // Rotate axis labels
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label for the total sent sms graph
            total_sent_sms_graph
                .append("text")
                .attr("class", "redrawElementSent")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (Y-M-D)");

            // Total Sms(s) graph title
            total_sent_sms_graph
                .append("text")
                .attr("class", "redrawElementSent")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Total Outgoing Message(s) / 10 minutes");
        }

        function drawOneDaySentGraph(yLimitSent) {
            // Set Y axis limit to max of daily values or to the value inputted by the user
            let yLimitSentTotal = d3.max(dailySentTotal, d => d.total_sent);

            if (isYLimitSentManuallySet != true) {
                yLimitSent = yLimitSentTotal;
            }

            let xMin = d3.min(dailySentTotal, d => new Date(d.day)),
                xMax = d3.max(dailySentTotal, d => GraphController.addOneDayToDate(d.day));
            // set scale domains
            x.domain([xMin, xMax]);
            if (yLimitSent > 0)
                y_total_sent_sms_range.domain([0, yLimitSent]);

            d3.selectAll(".redrawElementSent").remove();
            d3.selectAll("#sentStack10min").remove();
            d3.selectAll("#sentStack1day").remove();
            d3.selectAll(".sentGrid").remove();

            // Add the X gridlines
            const tickValuesForXAxis = dailySentTotal.map(d => new Date(d.day));
            total_sent_sms_graph.append("g")			
                .attr("class", "sentGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickValues(tickValuesForXAxis)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Add the Y gridlines
            total_sent_sms_graph.append("g")			
                .attr("class", "sentGrid")
                .call(d3.axisLeft(y_total_sent_sms_range)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add the Y Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "axisSteelBlue")
                .attr("class", "redrawElementSent")
                .call(d3.axisLeft(y_total_sent_sms_range));

            // Create stacks
            let sentLayer = total_sent_sms_graph
                .selectAll("#sentStack1day")
                .data(sentDataStackedDaily)
                .enter()
                .append("g")
                .attr("id", "sentStack1day")
                .attr("class", (d, i) => sentKeys[i])
                .style("fill", (d, i) => color(i));

            let innerPadding = 5;
            sentLayer
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("x", d => x(new Date(d.data.day)))
                .attr("y", d => y_total_sent_sms_range(d[1]))
                .attr("height", d => y_total_sent_sms_range(d[0]) - y_total_sent_sms_range(d[1]))
                .attr("width", (Width / Object.keys(dailySentTotal).length) - innerPadding);

            // Add tooltip for the total sent sms graph
            let tip;
            sentLayer
                .selectAll("rect")
                .on("mouseover", (d, i, n) => {
                    // Get key of stacked data from the selection
                    let operatorNameWithMessageDirection = d3.select(n[i].parentNode).datum().key,
                        // Get operator name from the key
                        operatorName = operatorNameWithMessageDirection.replace('_sent',''),
                        // Get color of hovered rect
                        operatorColor = d3.select(n[i]).style("fill");
                    tip = d3.tip()
                        .attr("class", "tooltip")
                        .attr("id", "tooltip")
                        .html(d => { 
                            let sentMessages = d.data[operatorNameWithMessageDirection],
                                totalSentMessages = d.data.total_sent,
                                // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
                                tooltipContent = `<div>${sentMessages} 
                                (${Math.round((sentMessages/totalSentMessages)*100)}%)
                                ${operatorName.charAt(0).toUpperCase() + operatorName.slice(1)} 
                                Message${sentMessages !== 1 ? 's': ''} </div>`;
                            return tooltipContent;
                    })
                    total_sent_sms_graph.call(tip)
                    tip.show(d, n[i]).style("color", operatorColor)
                })
                .on("mouseout", (d, i, n) => {
                    tip.hide()
                })

            //Add the X Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "redrawElementSent")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .tickValues(tickValuesForXAxis)
                        .tickFormat(d => dayDateFormatWithWeekdayName(d))
                )
                // Rotate axis labels
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label for the total sent sms graph
            total_sent_sms_graph
                .append("text")
                .attr("class", "redrawElementSent")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 65) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (Y-M-D)");

            // Total Sms(s) graph title
            total_sent_sms_graph
                .append("text")
                .attr("class", "redrawElementSent")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Total Outgoing Message(s) / day");
        }

        function drawOneDayFailedGraph(yLimitFailed) {
            // Set Y axis limit to max of daily values or to the value inputted by the user
            let yLimitFailedTotal = d3.max(dailyFailedTotal, d => d.total_errored);

            if (isYLimitFailedManuallySet != true) {
                yLimitFailed = yLimitFailedTotal;
            }

            // set scale domain for failed graph
            let xMin = d3.min(dailyFailedTotal, d => new Date(d.day)),
                xMax = d3.max(dailyFailedTotal, d => GraphController.addOneDayToDate(d.day));
            failed_messages_x_axis_range.domain([xMin, xMax]);
            if (yLimitFailed > 0)
                y_total_failed_sms_range.domain([0, yLimitFailed]);

            d3.selectAll(".redrawElementFailed").remove();
            d3.selectAll("#failedBarChart").remove();
            d3.selectAll("#failedBarChart10min").remove();
            d3.selectAll(".failedGrid").remove();

            // Add the X gridlines
            const tickValuesForXAxis = dailyFailedTotal.map(d => new Date(d.day));
            total_failed_sms_graph.append("g")			
                .attr("class", "failedGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickValues(tickValuesForXAxis)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Add the Y gridlines
            total_failed_sms_graph.append("g")			
                .attr("class", "failedGrid")
                .call(d3.axisLeft(y_total_failed_sms_range)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add the Y Axis for the total failed sms graph
            total_failed_sms_graph
                .append("g")
                .attr("class", "axisSteelBrown")
                .attr("class", "redrawElementFailed")
                .call(d3.axisLeft(y_total_failed_sms_range));

            // Create bars
            let innerPadding = 5;
            total_failed_sms_graph
                .selectAll("rect")
                .data(dailyFailedTotal)
                .enter()
                .append("rect")
                .attr("id", "failedBarChart")
                .attr("x", d => x(new Date(d.day)))
                .attr("y", d => y_total_failed_sms_range(d.total_errored))
                .attr("height", d => Height - y_total_failed_sms_range(d.total_errored))
                .attr("fill", "#ff0000")
                .attr("width", (Width / Object.keys(dailyFailedTotal).length) - innerPadding);

            // Add tooltip for the total failed sms graph
            let tip;
            total_failed_sms_graph
                .selectAll("rect")
                .on("mouseover", (d, i, n) => {
                    let barColor = d3.select(n[i]).style("fill");
                    tip = d3.tip()
                        .attr("class", "tooltip")
                        .attr("id", "tooltip")
                        .html(d => {
                            let totalFiledMessages = d.total_errored,
                                // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
                                tooltipContent = `<div>${totalFiledMessages} Failed
                                Message${totalFiledMessages !== 1 ? 's': ''} </div>`;
                            return tooltipContent;
                        })
                    total_failed_sms_graph.call(tip)
                    tip.show(d, n[i]).style("color", barColor)
                })
                .on("mouseout", (d, i, n) => {
                    tip.hide()
                })

            // Add the X Axis for the total failed sms graph
            total_failed_sms_graph
                .append("g")
                .attr("class", "redrawElementFailed")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(failed_messages_x_axis_range)
                        .tickValues(tickValuesForXAxis)
                        .tickFormat(d => dayDateFormatWithWeekdayName(d))
                )
                // Rotate axis labels
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label for the total failed sms graph
            total_failed_sms_graph
                .append("text")
                .attr("class", "redrawElementFailed")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 65) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (Y-M-D)");

            // Total Sms(s) graph title
            total_failed_sms_graph
                .append("text")
                .attr("class", "redrawElementFailed")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Total Failed Message(s) / day");
        }

        function draw10MinFailedGraph(yLimitFailed) {
            // Set Y axis limit to max of daily values or to the value inputted by the user
            if (isYLimitFailedManuallySet == false) {
                yLimitFailed = d3.max(dataFilteredWeek, d => d.total_errored);
            }

            // Set scale domain for failed graph
            failed_messages_x_axis_range.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
            if (yLimitFailed > 0)
                y_total_failed_sms_range.domain([0, yLimitFailed]);

            d3.selectAll(".redrawElementFailed").remove();
            d3.selectAll("#failedBarChart").remove();
            d3.selectAll("#failedBarChart10min").remove();
            d3.selectAll(".failedGrid").remove();

            // Group data filtered by week daily and generate tick values for x axis
            let dataFilteredWeekGroupedDaily  = d3.nest().key(d => d.day).entries(dataFilteredWeek);
            let tickValuesForXAxis = dataFilteredWeekGroupedDaily.map(d => new Date(d.key)).slice(1)
           
            // Add the X gridlines
            total_failed_sms_graph.append("g")			
                .attr("class", "failedGrid")
                .attr("transform", "translate(0," + Height + ")")
                .call(d3.axisBottom(x)
                    .tickValues(tickValuesForXAxis)
                    .tickSize(-Height)
                    .tickFormat("")
                )

            // Add the Y gridlines
            total_failed_sms_graph.append("g")			
                .attr("class", "failedGrid")
                .call(d3.axisLeft(y_total_failed_sms_range)
                    .tickSize(-Width)
                    .tickFormat("")
                )

            // Add the Y Axis for the total failed sms graph
            total_failed_sms_graph
                .append("g")
                .attr("id", "axisSteelBrown")
                .attr("class", "redrawElementFailed")
                .call(d3.axisLeft(y_total_failed_sms_range));

            // Create bars
            total_failed_sms_graph
                .selectAll("rect")
                .data(dataFilteredWeek)
                .enter()
                .append("rect")
                .attr("id", "failedBarChart10min")
                .attr("x", d => failed_messages_x_axis_range(new Date(d.datetime)))
                .attr("y", d => y_total_failed_sms_range(d.total_errored))
                .attr("height", d => Height - y_total_failed_sms_range(d.total_errored))
                .attr("fill", "#ff0000")
                .attr("width", Width / Object.keys(dataFilteredWeek).length)

            // Add the X Axis for the total failed sms graph
            total_failed_sms_graph
                .append("g")
                .attr("class", "redrawElementFailed")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .tickValues(tickValuesForXAxis)
                        .tickFormat(timeFormat)
                )
                // Rotate axis labels
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            // Add X axis label for the total failed sms graph
            total_failed_sms_graph
                .append("text")
                .attr("class", "redrawElementFailed")
                .attr(
                    "transform",
                    "translate(" + Width / 2 + " ," + (Height + Margin.top + 50) + ")"
                )
                .style("text-anchor", "middle")
                .text("Date (Y-M-D)");

            // Total Sms(s) graph title
            total_failed_sms_graph
                .append("text")
                .attr("class", "redrawElementFailed")
                .attr("x", Width / 2)
                .attr("y", 0 - Margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "bold")
                .text("Total Failed Message(s) / 10 minutes");
        }

        // Update chart time unit on user selection
        d3.select("#buttonUpdateView10Minutes").on("click", () => {
            GraphController.chartTimeUnit = "10min";
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered, yLimitFailedFiltered);
        });

        d3.select("#buttonUpdateViewOneDay").on("click", () => {
            GraphController.chartTimeUnit = "1day";
            updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed);
        });

        d3.select("#timeFrame").on("change", function() {
            let timeFrame = this.options[this.selectedIndex].value,
                week = 7, month = 30;
            if (timeFrame == "default") {
                GraphController.updateGraphs(data, projectName, MNOColors, week, month)
            } else {
                GraphController.updateGraphs(data, projectName, MNOColors, timeFrame, timeFrame)
            }
        })

        // Draw received graph with user-selected y-axis limit
        d3.select("#buttonYLimitReceived").on("input", function() {
            isYLimitReceivedManuallySet = true;
            if (GraphController.chartTimeUnit == "1day") {
                yLimitReceived = this.value;
                drawOneDayReceivedGraph(yLimitReceived);
            } else if (GraphController.chartTimeUnit == "10min") {
                yLimitReceivedFiltered = this.value;
                draw10MinReceivedGraph(yLimitReceivedFiltered);
            }
        });

        // Draw sent graph with user-selected y-axis limit
        d3.select("#buttonYLimitSent").on("input", function() {
            isYLimitSentManuallySet = true;
            if (GraphController.chartTimeUnit == "1day") {
                yLimitSent = this.value;
                drawOneDaySentGraph(yLimitSent);
            } else if (GraphController.chartTimeUnit == "10min") {
                yLimitSentFiltered = this.value;
                draw10MinSentGraph(yLimitSentFiltered);
            }
        });

        // Draw failed graph with user-selected y-axis limit
        d3.select("#buttonYLimitFailed").on("input", function() {
            isYLimitFailedManuallySet = true;
            if (GraphController.chartTimeUnit == "1day") {
                yLimitFailed = this.value;
                drawOneDayFailedGraph(yLimitFailed);
            }  else if (GraphController.chartTimeUnit == "10min") {
                yLimitFailedFiltered = this.value;
                draw10MinFailedGraph(yLimitFailedFiltered);
            }
        });

        let fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        // Update timestamp of update and reset formatting
        let lastUpdateTimeStamp = new Date(
            Math.max.apply(
                null,
                data.map(d => new Date(d.datetime))
            )
        );
        lastUpdateTimeStamp.setMinutes(lastUpdateTimeStamp.getMinutes() + 10);
        lastUpdateTimeStamp = new Date(lastUpdateTimeStamp);

        d3.select("#lastUpdated")
            .classed("text-stale-info", false)
            .text(fullDateFormat(lastUpdateTimeStamp));

        function setLastUpdatedAlert() {
            // Calculate time diff bw current and lastUpdateTimeStamp
            let currentTime = new Date(),
                difference_ms = (currentTime.getTime() - lastUpdateTimeStamp.getTime()) / 60000,
                difference_minutes = Math.floor(difference_ms % 60);
            if (difference_minutes > 20) {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", true);
            } else {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", false);
            }
        }
        if (GraphController.lastUpdateTimer) {
            clearInterval(GraphController.lastUpdateTimer);
        }
        GraphController.lastUpdateTimer = setInterval(setLastUpdatedAlert, 1000);
    }
    static clearTimers() {
        if (GraphController.lastUpdateTimer) {
            clearInterval(GraphController.lastUpdateTimer);
            GraphController.lastUpdateTimer = null;
        }
    }
}
