// GRAPH CONTROLLER
class GraphController {
    static addOneDayToDate(date) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }

    static setProperties() {
        GraphController.TIMEFRAME_WEEK = 7;
        GraphController.TIMEFRAME_MONTH = 30;
        GraphController.isYLimitReceivedManuallySet = false;
        GraphController.isYLimitSentManuallySet = false;
        GraphController.dayDateFormat = d3.timeFormat("%Y-%m-%d");
        GraphController.dayDateFormatWithWeekdayName = d3.timeFormat("%Y-%m-%d:%a");
        GraphController.fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        GraphController.operators = new Set();
    }

    static formatData(data) {
        data.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            d.day = GraphController.dayDateFormat(new Date(d.datetime));
            d.total_received = +d.total_received;
            d.total_sent = +d.total_sent;
            d.total_pending = +d.total_pending;
            d.total_errored = +d.total_errored;
            Object.keys(d.operators)
                .sort()
                .forEach(operator => {
                    if (!(operator in GraphController.operators)) {
                        GraphController.operators.add(operator);
                        d[`${operator}_received`] = +d.operators[operator]["received"];
                        d[`${operator}_sent`] = +d.operators[operator]["sent"];
                    } else {
                        console.warn(operator)
                    }
                });
        });
    }

    static groupDataByDay(dataFilteredMonth, messageDirection) {
        let groupedDataTotal = d3
            .nest()
            .key(d => d.day)
            .rollup(v => {
                let groupedData = {};
                GraphController.operators.forEach(operator => {
                    groupedData[`${operator}_${messageDirection}`] = d3.sum(v,
                        d => d[`${operator}_${messageDirection}`]
                    );
                });
                groupedData[`total_${messageDirection}`] = d3.sum(v, d => d[`total_${messageDirection}`]);
                return groupedData;
            })
            .entries(dataFilteredMonth);
        if (messageDirection == "sent") {
            GraphController.dailySentTotal = groupedDataTotal;
        } else if (messageDirection == "received") {
            GraphController.dailyReceivedTotal = groupedDataTotal;
        }
    }

    static flattenNestedDataforStacking(messageDirection) {
        let nestedData;
        if (messageDirection == "received") {
            nestedData = GraphController.dailyReceivedTotal;
        } else if (messageDirection == "sent") {
            nestedData = GraphController.dailySentTotal;
        }
        for (let entry in nestedData) {
            let valueList = nestedData[entry].value;
            for (let key in valueList) {
                nestedData[entry][key] = valueList[key];
            }
            nestedData[entry]["day"] = nestedData[entry].key;
            delete nestedData[entry]["value"];
            delete nestedData[entry]["key"];
        }
        if (messageDirection == "received") {
            GraphController.dailyReceivedTotal = nestedData;
        } else if (messageDirection == "sent") {
            nestedData = GraphController.dailySentTotal = nestedData;
        }
    }

    static stackDataBasedOnOperatorAndDirection() {
        // Create keys to stack by based on operator and direction
        GraphController.receivedKeys = [];
        GraphController.sentKeys = [];
        let receivedStr = "",
            sentStr = "";

        GraphController.operators = Array.from(GraphController.operators);

        for (let i = 0; i < GraphController.operators.length; i++) {
            receivedStr = GraphController.operators[i] + "_received";
            GraphController.receivedKeys.push(receivedStr);
            sentStr = GraphController.operators[i] + "_sent";
            GraphController.sentKeys.push(sentStr);
        }

        // Stack data by keys created above
        let stackReceivedDaily = d3.stack().keys(GraphController.receivedKeys);
        GraphController.receivedDataStackedDaily = stackReceivedDaily(GraphController.dailyReceivedTotal);
        let stackSentDaily = d3.stack().keys(GraphController.sentKeys);
        GraphController.sentDataStackedDaily = stackSentDaily(GraphController.dailySentTotal);
    }

    static setUpGraphLayout() {
        //Create margins for the three graphs
        GraphController.Margin = { top: 40, right: 100, bottom: 90, left: 70 };
        GraphController.Width = 960 - GraphController.Margin.right - GraphController.Margin.left;
        GraphController.Height = 500 - GraphController.Margin.top - GraphController.Margin.bottom;
        // Set x and y scales
        GraphController.x = d3.scaleTime().range([0, GraphController.Width]);
        GraphController.failed_messages_x_axis_range = d3.scaleTime().range([0, GraphController.Width]);
        GraphController.y_total_received_sms_range = d3.scaleLinear().range([GraphController.Height, 0]);
        GraphController.y_total_sent_sms_range = d3.scaleLinear().range([GraphController.Height, 0]);
        GraphController.y_total_failed_sms = d3.scaleLinear().range([GraphController.Height, 0]);

        // Append total received sms graph to svg
        GraphController.total_received_sms_graph = d3
            .select(".total_received_sms_graph")
            .append("svg")
            .attr("width", GraphController.Width + GraphController.Margin.left + GraphController.Margin.right + 120)
            .attr("height", GraphController.Height + GraphController.Margin.top + GraphController.Margin.bottom)
            .append("g")
            .attr("transform", "translate(" + GraphController.Margin.left + "," + GraphController.Margin.top + ")");
        // Append total sent sms graph to svg
        GraphController.total_sent_sms_graph = d3
            .select(".total_sent_sms_graph")
            .append("svg")
            .attr("width", GraphController.Width + GraphController.Margin.left + GraphController.Margin.right + 120)
            .attr("height", GraphController.Height + GraphController.Margin.top + GraphController.Margin.bottom)
            .append("g")
            .attr("transform", "translate(" + GraphController.Margin.left + "," + GraphController.Margin.top + ")");
        // Append total failed sms graph to svg
        GraphController.total_failed_sms_graph = d3
            .select(".total_failed_sms_graph")
            .append("svg")
            .attr("width", GraphController.Width + GraphController.Margin.left + GraphController.Margin.right + 120)
            .attr("height", GraphController.Height + GraphController.Margin.top + GraphController.Margin.bottom)
            .append("g")
            .attr("transform", "translate(" + GraphController.Margin.left + "," + GraphController.Margin.top + ")");
        // Y axis Label for the total received sms graph
        GraphController.total_received_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - GraphController.Margin.left)
            .attr("x", 0 - GraphController.Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Incoming Message (s)");
        // Y axis Label for the total sent sms graph
        GraphController.total_sent_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - GraphController.Margin.left)
            .attr("x", 0 - GraphController.Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Outgoing Message (s)");
    }

    static drawFailedMsgGraph() {
        // set scale domain for failed graph
        GraphController.y_total_failed_sms.domain([0, d3.max(GraphController.data, d => d.total_errored)]);
        GraphController.xMin = d3.min(GraphController.data, d => new Date(d.day));
        GraphController.xMax = d3.max(GraphController.data, d => GraphController.addOneDayToDate(d.day));
        GraphController.failed_messages_x_axis_range.domain([GraphController.xMin, GraphController.xMax]);

        //Add the X Axis for the total failed sms graph
        GraphController.total_failed_sms_graph
            .append("g")
            .attr("transform", "translate(0," + GraphController.Height + ")")
            .call(d3.axisBottom(GraphController.failed_messages_x_axis_range)
                    .ticks(5)
                    .tickFormat(GraphController.dayDateFormat))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        //Add X axis label for the total failed sms graph
        GraphController.total_failed_sms_graph
            .append("text")
            .attr(
                "transform",
                "translate(" + GraphController.Width / 2 + " ," + (GraphController.Height + GraphController.Margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text("Time (D:H:M:S)");

        // Add the Y Axis for the total failed sms graph
        GraphController.total_failed_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .call(d3.axisLeft(GraphController.y_total_failed_sms));

        // Y axis Label for the total failed sms graph
        GraphController.total_failed_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - GraphController.Margin.left)
            .attr("x", 0 - GraphController.Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Failed Message (s)");

        // Total Failed Sms(s) graph title
        GraphController.total_failed_sms_graph
            .append("text")
            .attr("x", GraphController.Width / 2)
            .attr("y", 0 - GraphController.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Failed Messages(s) / hr");

        // Label Lines for the total failed sms graph
        GraphController.total_failed_sms_graph.append("text");

        // Define line paths for total failed sms(s)
        const total_failed_line = d3
                .line()
                .curve(d3.curveLinear)
                .x(d => GraphController.failed_messages_x_axis_range(new Date(d.datetime)))
                .y(d => GraphController.y_total_failed_sms(d.total_errored)),
            // Create line path element for failed line graph
            total_failed_path = GraphController.total_failed_sms_graph.append("path");

        // update path data for total failed sms(s)
        total_failed_path
            .data([GraphController.data])
            .attr("class", "line")
            .style("stroke", "blue")
            .attr("d", total_failed_line);
    }

    static setUpGraphLegend() {
        // custom color scheme
        let color_scheme = [
            "#31cece",
            "#f58231",
            "#3cb44b",
            "#CCCC00",
            "#4363d8",
            "#800000",
            "#f032e6",
            "#911eb4",
            "#e6194B"
        ];
        GraphController.color = d3.scaleOrdinal(color_scheme);
        let colorReceived = d3.scaleOrdinal(color_scheme).domain(GraphController.receivedKeys),
            colorSent = d3.scaleOrdinal(color_scheme).domain(GraphController.sentKeys);

        // Total received graph legend
        GraphController.total_received_sms_graph
            .append("g")
            .attr("class", "receivedLegend")
            .attr(
                "transform",
                `translate(${GraphController.Width - GraphController.Margin.right + 110},${GraphController.Margin.top - 30})`
            );

        let receivedLegend = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(colorReceived)
            .labels(GraphController.operators);

        d3.select(".receivedLegend").call(receivedLegend);

        // Total sent graph legend
        GraphController.total_sent_sms_graph
            .append("g")
            .attr("class", "sentLegend")
            .attr(
                "transform",
                `translate(${GraphController.Width - GraphController.Margin.right + 110},${GraphController.Margin.top - 30})`
            );

        let sentLegend = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(colorSent)
            .labels(GraphController.operators);

        d3.select(".sentLegend").call(sentLegend);
    }

    static updateReceivedChartLimit() {
        // Get the value of the button
        let ylimit = this.value;

        GraphController.y_total_received_sms_range.domain([0, ylimit]);

        // Add the Y Axis for the total received sms graph
        GraphController.total_received_sms_graph
            .selectAll(".axisSteelBlue")
            .call(d3.axisLeft(GraphController.y_total_received_sms_range));

        GraphController.receivedLayer
            .selectAll("rect")
            .data(d => d)
            .attr("x", d => GraphController.x(d.data.datetime))
            .attr("y", d => GraphController.y_total_received_sms_range(d[1]))
            .attr(
                "height",
                d => GraphController.y_total_received_sms_range(d[0]) - GraphController.y_total_received_sms_range(d[1])
            )
            .attr("width", GraphController.Width / Object.keys(data).length);
    }

    static updateSentChartLimit() {
        // Get the value of the button
        let ylimit = this.value;

        GraphController.y_total_sent_sms_range.domain([0, ylimit]);

        // Add the Y Axis for the total sent sms graph
        GraphController.total_sent_sms_graph
            .selectAll(".axisSteelBlue")
            .call(d3.axisLeft(GraphController.y_total_sent_sms_range));

        GraphController.sentLayer
            .selectAll("rect")
            .data(d => d)
            .attr("x", d => GraphController.x(d.data.datetime))
            .attr("y", d => GraphController.y_total_sent_sms_range(d[1]))
            .attr("height", d => GraphController.y_total_sent_sms_range(d[0]) - GraphController.y_total_sent_sms_range(d[1]))
            .attr("width", GraphController.Width / Object.keys(data).length);
    }

    static setLastUpdatedAlert() {
        // Calculate time diff between current and lastUpdateTimeStamp
        let currentTime = new Date(),
            difference_ms = (currentTime.getTime() - GraphController.lastUpdateTimeStamp.getTime()) / 60000,
            difference_minutes = Math.floor(difference_ms % 60);
        if (difference_minutes > 20) {
            d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", true);
        } else {
            d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", false);
        }
    }

    static clearTimers() {
        if (GraphController.lastUpdateTimer) {
            clearInterval(GraphController.lastUpdateTimer);
            GraphController.lastUpdateTimer = null;
        }
    }

    static draw10MinReceivedGraph(dataFilteredWeek, yLimitReceived) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        if (GraphController.isYLimitReceivedManuallySet == false) {
            yLimitReceived = d3.max(dataFilteredWeek, d => d.total_received);
        }

        let stackReceived = d3.stack().keys(GraphController.receivedKeys),
            receivedDataStacked = stackReceived(dataFilteredWeek);

        // set scale domains
        GraphController.x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
        GraphController.y_total_received_sms_range.domain([0, yLimitReceived]);

        d3.selectAll(".redrawElementReceived").remove();
        d3.selectAll("#receivedStack").remove();
        d3.selectAll("#receivedStack10min").remove();

        // Add the Y Axis for the total received sms graph
        GraphController.total_received_sms_graph
            .append("g")
            .attr("id", "axisSteelBlue")
            .attr("class", "redrawElementReceived")
            .call(d3.axisLeft(GraphController.y_total_received_sms_range));

        let receivedLayer10min = GraphController.total_received_sms_graph
            .selectAll("#receivedStack10min")
            .data(receivedDataStacked)
            .enter()
            .append("g")
            .attr("id", "receivedStack10min")
            .attr("class", (d, i) => GraphController.receivedKeys[i])
            .style("fill", (d, i) => GraphController.color(i));

        receivedLayer10min
            .selectAll("rect")
            .data(dataFilteredWeek => dataFilteredWeek)
            .enter()
            .append("rect")
            .attr("x", d => GraphController.x(d.data.datetime))
            .attr("y", d => GraphController.y_total_received_sms_range(d[1]))
            .attr(
                "height",
                d => GraphController.y_total_received_sms_range(d[0]) - GraphController.y_total_received_sms_range(d[1])
            )
            .attr("width", GraphController.Width / Object.keys(dataFilteredWeek).length);

        //Add the X Axis for the total received sms graph
        GraphController.total_received_sms_graph
            .append("g")
            .attr("class", "redrawElementReceived")
            .attr("transform", "translate(0," + GraphController.Height + ")")
            .call(d3.axisBottom(GraphController.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GraphController.dayDateFormat))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total received sms graph
        GraphController.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr(
                "transform",
                "translate(" + GraphController.Width / 2 + " ," + (GraphController.Height + GraphController.Margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (D-M-Y)");

        // Total Sms(s) graph title
        GraphController.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr("x", GraphController.Width / 2)
            .attr("y", 0 - GraphController.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Incoming Message(s) / 10 minutes");
    }

    static draw10MinSentGraph(dataFilteredWeek, yLimitSent) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        if (GraphController.isYLimitSentManuallySet == false) {
            yLimitSent = d3.max(dataFilteredWeek, d => d.total_sent);
        }

        let stackSent = d3.stack().keys(GraphController.sentKeys),
            sentDataStacked = stackSent(dataFilteredWeek);

        // set scale domains
        GraphController.x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
        GraphController.y_total_sent_sms_range.domain([0, yLimitSent]);

        // Remove changing chart elements before redrawing
        d3.selectAll(".redrawElementSent").remove();
        d3.selectAll("#sentStack1day").remove();
        d3.selectAll("#sentStack10min").remove();

        // Add the Y Axis for the total sent sms graph
        GraphController.total_sent_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementSent")
            .call(d3.axisLeft(GraphController.y_total_sent_sms_range));

        // Create stacks
        let sentLayer10min = GraphController.total_sent_sms_graph
            .selectAll("#sentStack10min")
            .data(sentDataStacked)
            .enter()
            .append("g")
            .attr("id", "sentStack10min")
            .attr("class", (d, i) => GraphController.sentKeys[i])
            .style("fill", (d, i) => GraphController.color(i));

        sentLayer10min
            .selectAll("rect")
            .data(dataFilteredWeek => dataFilteredWeek)
            .enter()
            .append("rect")
            .attr("x", d => GraphController.x(d.data.datetime))
            .attr("y", d => GraphController.y_total_sent_sms_range(d[1]))
            .attr("height", d => GraphController.y_total_sent_sms_range(d[0]) - GraphController.y_total_sent_sms_range(d[1]))
            .attr("width", GraphController.Width / Object.keys(dataFilteredWeek).length);

        //Add the X Axis for the total sent sms graph
        GraphController.total_sent_sms_graph
            .append("g")
            .attr("class", "redrawElementSent")
            .attr("transform", "translate(0," + GraphController.Height + ")")
            .call(d3.axisBottom(GraphController.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GraphController.dayDateFormat))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total sent sms graph
        GraphController.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr(
                "transform",
                "translate(" + GraphController.Width / 2 + " ," + (GraphController.Height + GraphController.Margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (D-M-Y)");

        // Total Sms(s) graph title
        GraphController.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr("x", GraphController.Width / 2)
            .attr("y", 0 - GraphController.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Outgoing Message(s) / 10 minutes");
    }

    static drawOneDayReceivedGraph(yLimitReceived) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        let yLimitReceivedTotal = d3.max(GraphController.dailyReceivedTotal, d => d.total_received);

        if (GraphController.isYLimitReceivedManuallySet == false) {
            yLimitReceived = yLimitReceivedTotal;
        }

        GraphController.xMin = d3.min(GraphController.data, d => new Date(d.day));
        GraphController.xMax = d3.max(GraphController.data, d => GraphController.addOneDayToDate(d.day));
        // set scale domains
        GraphController.x.domain([GraphController.xMin, GraphController.xMax]);
        GraphController.y_total_received_sms_range.domain([0, yLimitReceived]);

        d3.selectAll(".redrawElementReceived").remove();
        d3.selectAll("#receivedStack10min").remove();
        d3.selectAll("#receivedStack").remove();

        // Add the Y Axis for the total received sms graph
        GraphController.total_received_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementReceived")
            .call(d3.axisLeft(GraphController.y_total_received_sms_range));

        GraphController.receivedLayer = GraphController.total_received_sms_graph
            .selectAll("#receivedStack")
            .data(GraphController.receivedDataStackedDaily)
            .enter()
            .append("g")
            .attr("id", "receivedStack")
            .attr("class", (d, i) => GraphController.receivedKeys[i])
            .style("fill", (d, i) => GraphController.color(i));

        GraphController.receivedLayer
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => GraphController.x(new Date(d.data.day)))
            .attr("y", d => GraphController.y_total_received_sms_range(d[1]))
            .attr(
                "height",
                d => GraphController.y_total_received_sms_range(d[0]) - GraphController.y_total_received_sms_range(d[1])
            )
            .attr("width", GraphController.Width / Object.keys(GraphController.dailyReceivedTotal).length);

        //Add the X Axis for the total received sms graph
        GraphController.total_received_sms_graph
            .append("g")
            .attr("class", "redrawElementReceived")
            .attr("transform", "translate(0," + GraphController.Height + ")")
            .call(d3.axisBottom(GraphController.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GraphController.dayDateFormatWithWeekdayName))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total received sms graph
        GraphController.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr(
                "transform",
                "translate(" + GraphController.Width / 2 + " ," + (GraphController.Height + GraphController.Margin.top + 65) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (Y-M-D)");

        // Total Sms(s) graph title
        GraphController.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr("x", GraphController.Width / 2)
            .attr("y", 0 - GraphController.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Incoming Message(s) / day");
    }

    static drawOneDaySentGraph(yLimitSent) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        let yLimitSentTotal = d3.max(GraphController.dailySentTotal, d => d.total_sent);

        if (GraphController.isYLimitSentManuallySet != true) {
            yLimitSent = yLimitSentTotal;
        }

        GraphController.xMin = d3.min(GraphController.data, d => new Date(d.day));
        GraphController.xMax = d3.max(GraphController.data, d => GraphController.addOneDayToDate(d.day));
        // set scale domains
        GraphController.x.domain([GraphController.xMin, GraphController.xMax]);
        GraphController.y_total_sent_sms_range.domain([0, yLimitSent]);

        d3.selectAll(".redrawElementSent").remove();
        d3.selectAll("#sentStack10min").remove();
        d3.selectAll("#sentStack1day").remove();

        // Add the Y Axis for the total sent sms graph
        GraphController.total_sent_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementSent")
            .call(d3.axisLeft(GraphController.y_total_sent_sms_range));

        // Create stacks
        GraphController.sentLayer = GraphController.total_sent_sms_graph
            .selectAll("#sentStack1day")
            .data(GraphController.sentDataStackedDaily)
            .enter()
            .append("g")
            .attr("id", "sentStack1day")
            .attr("class", (d, i) => GraphController.sentKeys[i])
            .style("fill", (d, i) => GraphController.color(i));

        GraphController.sentLayer
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => GraphController.x(new Date(d.data.day)))
            .attr("y", d => GraphController.y_total_sent_sms_range(d[1]))
            .attr("height", d => GraphController.y_total_sent_sms_range(d[0]) - GraphController.y_total_sent_sms_range(d[1]))
            .attr("width", GraphController.Width / Object.keys(GraphController.dailySentTotal).length);

        //Add the X Axis for the total sent sms graph
        GraphController.total_sent_sms_graph
            .append("g")
            .attr("class", "redrawElementSent")
            .attr("transform", "translate(0," + GraphController.Height + ")")
            .call(d3.axisBottom(GraphController.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GraphController.dayDateFormatWithWeekdayName))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total sent sms graph
        GraphController.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr(
                "transform",
                "translate(" + GraphController.Width / 2 + " ," + (GraphController.Height + GraphController.Margin.top + 65) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (Y-M-D)");

        // Total Sms(s) graph title
        GraphController.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr("x", GraphController.Width / 2)
            .attr("y", 0 - GraphController.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Outgoing Message(s) / day");
    }

    static updateGraphs(data, projectName) {
        GraphController.setProperties();

        if (!GraphController.chartTimeUnit) {
            GraphController.chartTimeUnit = "10min";
        }

        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        GraphController.formatData(data);

        // Sort data by date
        data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        // Assign formatted and sorted data to static variable
        GraphController.data = data;

        let offsetWeek = new Date(),
            offsetMonth = new Date();

        offsetWeek.setDate(offsetWeek.getDate() - GraphController.TIMEFRAME_WEEK);
        offsetMonth.setDate(offsetMonth.getDate() - GraphController.TIMEFRAME_MONTH);

        let dataFilteredWeek = GraphController.data.filter(a => a.datetime > offsetWeek),
            dataFilteredMonth = GraphController.data.filter(a => a.datetime > offsetMonth);

        // Process Data
        GraphController.GroupDataByDay(dataFilteredMonth, "received");
        GraphController.FlattenNestedDataforStacking("received");
        GraphController.GroupDataByDay(dataFilteredMonth, "sent");
        GraphController.FlattenNestedDataforStacking("sent");
        GraphController.stackDataBasedOnOperatorAndDirection();

        GraphController.setUpGraphLayout();
        GraphController.setUpGraphLegend();
        GraphController.drawFailedMsgGraph();

        // Set default y-axis limits
        let yLimitReceived = d3.max(GraphController.dailyReceivedTotal, d => d.total_received),
            yLimitReceivedFiltered = d3.max(dataFilteredWeek, d => d.total_received),
            yLimitSent = d3.max(GraphController.dailySentTotal, d => d.total_sent),
            yLimitSentFiltered = d3.max(dataFilteredWeek, d => d.total_sent);

        // Draw graphs according to selected time unit
        if (GraphController.chartTimeUnit == "1day") {
            updateViewOneDay(yLimitReceived, yLimitSent);
        } else if (GraphController.chartTimeUnit == "10min") {
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered);
        }

        // Add an event listener to the button created in the html part
        d3.select("#buttonYLimitReceived").on("input", GraphController.updateReceivedChartLimit);
        d3.select("#buttonYLimitSent")
            .on("input", GraphController.updateSentChartLimit)
            .attr("transform", `translate(${GraphController.Width - GraphController.Margin.right + 100},${GraphController.Margin.top})`)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "blue")
            .text("Total Failed");

        // Set y-axis control button value and draw graphs
        function updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceivedFiltered);
            d3.select("#buttonYLimitSent").property("value", yLimitSentFiltered);
            GraphController.draw10MinReceivedGraph(dataFilteredWeek, yLimitReceivedFiltered);
            GraphController.draw10MinSentGraph(dataFilteredWeek, yLimitSentFiltered);
        }

        function updateViewOneDay(yLimitReceived, yLimitSent) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceived);
            d3.select("#buttonYLimitSent").property("value", yLimitSent);
            GraphController.drawOneDayReceivedGraph(yLimitReceived);
            GraphController.drawOneDaySentGraph(yLimitSent);
        }

        // Update chart time unit on user selection
        d3.select("#buttonUpdateView10Minutes").on("click", () => {
            GraphController.chartTimeUnit = "10min";
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered);
        });

        d3.select("#buttonUpdateViewOneDay").on("click", () => {
            GraphController.chartTimeUnit = "1day";
            updateViewOneDay(yLimitReceived, yLimitSent);
        });

        // Draw received graph with user-selected y-axis limit
        d3.select("#buttonYLimitReceived").on("input", function() {
            GraphController.isYLimitReceivedManuallySet = true;
            if (GraphController.chartTimeUnit == "1day") {
                yLimitReceived = this.value;
                GraphController.drawOneDayReceivedGraph(yLimitReceived);
            } else if (GraphController.chartTimeUnit == "10min") {
                yLimitReceivedFiltered = this.value;
                GraphController.draw10MinReceivedGraph(dataFilteredWeek, yLimitReceivedFiltered);
            }
        });

        // Draw sent graph with user-selected y-axis limit
        d3.select("#buttonYLimitSent").on("input", function() {
            GraphController.isYLimitSentManuallySet = true;
            if (GraphController.chartTimeUnit == "1day") {
                yLimitSent = this.value;
                GraphController.drawOneDaySentGraph(yLimitSent);
            } else if (GraphController.chartTimeUnit == "10min") {
                yLimitSentFiltered = this.value;
                GraphController.draw10MinSentGraph(dataFilteredWeek, yLimitSentFiltered);
            }
        });

        // Update timestamp of update and reset formatting
        GraphController.lastUpdateTimeStamp = new Date(
            Math.max.apply(
                null,
                GraphController.data.map(d => new Date(d.datetime))
            )
        );
        GraphController.lastUpdateTimeStamp.setMinutes(GraphController.lastUpdateTimeStamp.getMinutes() + 10);
        GraphController.lastUpdateTimeStamp = new Date(GraphController.lastUpdateTimeStamp);

        d3.select("#lastUpdated")
            .classed("text-stale-info", false)
            .text(GraphController.fullDateFormat(GraphController.lastUpdateTimeStamp));

        GraphController.setLastUpdatedAlert();

        if (GraphController.lastUpdateTimer) {
            clearInterval(GraphController.lastUpdateTimer);
        }
        GraphController.lastUpdateTimer = setInterval(GraphController.setLastUpdatedAlert, 1000);
    }
}
