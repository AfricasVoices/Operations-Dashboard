// GRAPH CONTROLLER
class GC {
    static addOneDayToDate(date) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }

    static setProperties() {
        GC.TIMEFRAME_WEEK = 7;
        GC.TIMEFRAME_MONTH = 30;
        GC.isYLimitReceivedManuallySet = false;
        GC.isYLimitSentManuallySet = false;
        GC.isYLimitFailedManuallySet = false;
        GC.dayDateFormat = d3.timeFormat("%Y-%m-%d");
        GC.dayDateFormatWithWeekdayName = d3.timeFormat("%Y-%m-%d:%a");
        GC.fullDateFormat = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        GC.operators = new Set();
    }

    static formatData(data) {
        data.forEach(function(d) {
            d.datetime = new Date(d.datetime);
            d.day = GC.dayDateFormat(new Date(d.datetime));
            d.total_received = +d.total_received;
            d.total_sent = +d.total_sent;
            d.total_pending = +d.total_pending;
            d.total_errored = +d.total_errored;
            Object.keys(d.operators)
                .sort()
                .forEach(operator => {
                    if (!(operator in GC.operators)) {
                        GC.operators.add(operator);
                        d[`${operator}_received`] = +d.operators[operator]["received"];
                        d[`${operator}_sent`] = +d.operators[operator]["sent"];
                    }
                });
        });
    }

    static GroupDataByDay(dataFilteredMonth, messageDirection) {
        let groupedDataTotal = d3
            .nest()
            .key(d => d.day)
            .rollup(v => {
                let groupedData = {};
                GC.operators.forEach(operator => {
                    groupedData[`${operator}_${messageDirection}`] = d3.sum(v,
                        d => d[`${operator}_${messageDirection}`]
                    );
                });
                groupedData[`total_${messageDirection}`] = d3.sum(v,d => d[`total_${messageDirection}`]
                );
                return groupedData;
            })
            .entries(dataFilteredMonth);
        if (messageDirection == "sent") {
            GC.dailySentTotal = groupedDataTotal;
        } else if (messageDirection == "received") {
            GC.dailyReceivedTotal = groupedDataTotal;
        };
        GC.dailyFailedTotal = d3
            .nest()
            .key(d => d.day)
            .rollup(v => {
                let failedData = {};
                failedData["total_errored"] = d3.sum(v,d => d.total_errored);
                return failedData;
            })
            .entries(dataFilteredMonth);
    }

    static FlattenNestedDataforStacking(messageDirection) {
        let nestedData;
        if (messageDirection == "received") {
            nestedData = GC.dailyReceivedTotal;
        } else if (messageDirection == "sent") {
            nestedData = GC.dailySentTotal;
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
            GC.dailyReceivedTotal = nestedData;
        } else if (messageDirection == "sent") {
            nestedData = GC.dailySentTotal = nestedData;
        }
        for (let entry in GC.dailyFailedTotal) {
            let valueList = GC.dailyFailedTotal[entry].value;
            for (let key in valueList) {
                GC.dailyFailedTotal[entry][key] = valueList[key];
            }
            GC.dailyFailedTotal[entry]["day"] = GC.dailyFailedTotal[entry].key;
            delete GC.dailyFailedTotal[entry]["value"];
            delete GC.dailyFailedTotal[entry]["key"];
        }
    }

    static stackDataBasedOnOperatorAndDirection() {
        // Create keys to stack by based on operator and direction
        GC.receivedKeys = [];
        GC.sentKeys = [];
        let receivedStr = "",
            sentStr = "";

        GC.operators = Array.from(GC.operators);

        for (let i = 0; i < GC.operators.length; i++) {
            receivedStr = GC.operators[i] + "_received";
            GC.receivedKeys.push(receivedStr);
            sentStr = GC.operators[i] + "_sent";
            GC.sentKeys.push(sentStr);
        }

        // Stack data by keys created above
        let stackReceivedDaily = d3.stack().keys(GC.receivedKeys);
        GC.receivedDataStackedDaily = stackReceivedDaily(GC.dailyReceivedTotal);
        let stackSentDaily = d3.stack().keys(GC.sentKeys);
        GC.sentDataStackedDaily = stackSentDaily(GC.dailySentTotal);
    }

    static setUpGraphLayout() {
        //Create margins for the three graphs
        GC.Margin = { top: 40, right: 100, bottom: 90, left: 70 };
        GC.Width = 960 - GC.Margin.right - GC.Margin.left;
        GC.Height = 500 - GC.Margin.top - GC.Margin.bottom;
        // Set x and y scales
        GC.x = d3.scaleTime().range([0, GC.Width]);
        GC.failed_messages_x_axis_range = d3.scaleTime().range([0, GC.Width]);
        GC.y_total_received_sms_range = d3.scaleLinear().range([GC.Height, 0]);
        GC.y_total_sent_sms_range = d3.scaleLinear().range([GC.Height, 0]);
        GC.y_total_failed_sms = d3.scaleLinear().range([GC.Height, 0]);

        // Append total received sms graph to svg
        GC.total_received_sms_graph = d3
            .select(".total_received_sms_graph")
            .append("svg")
            .attr("width", GC.Width + GC.Margin.left + GC.Margin.right + 120)
            .attr("height", GC.Height + GC.Margin.top + GC.Margin.bottom)
            .append("g")
            .attr("transform", "translate(" + GC.Margin.left + "," + GC.Margin.top + ")");
        // Append total sent sms graph to svg
        GC.total_sent_sms_graph = d3
            .select(".total_sent_sms_graph")
            .append("svg")
            .attr("width", GC.Width + GC.Margin.left + GC.Margin.right + 120)
            .attr("height", GC.Height + GC.Margin.top + GC.Margin.bottom)
            .append("g")
            .attr("transform", "translate(" + GC.Margin.left + "," + GC.Margin.top + ")");
        // Append total failed sms graph to svg
        GC.total_failed_sms_graph = d3
            .select(".total_failed_sms_graph")
            .append("svg")
            .attr("width", GC.Width + GC.Margin.left + GC.Margin.right + 120)
            .attr("height", GC.Height + GC.Margin.top + GC.Margin.bottom)
            .append("g")
            .attr("transform", "translate(" + GC.Margin.left + "," + GC.Margin.top + ")");
        // Y axis Label for the total received sms graph
        GC.total_received_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - GC.Margin.left)
            .attr("x", 0 - GC.Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Incoming Message (s)");
        // Y axis Label for the total sent sms graph
        GC.total_sent_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - GC.Margin.left)
            .attr("x", 0 - GC.Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Outgoing Message (s)");
        // Y axis Label for the total failed sms graph
        GC.total_failed_sms_graph
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - GC.Margin.left)
            .attr("x", 0 - GC.Height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("No. of Failed Message (s)");
    }

    static drawOneDayFailedGraph(yLimitFailed) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        let yLimitFailedTotal = d3.max(GC.dailyFailedTotal, d => d.total_errored);

        if (GC.isYLimitFailedManuallySet != true) {
            yLimitFailed = yLimitFailedTotal;
        }
        // set scale domain for failed graph
        GC.y_total_failed_sms.domain([0, yLimitFailed]);
        GC.failed_messages_x_axis_range.domain(d3.extent(GC.data, d => new Date(d.datetime)));

        d3.selectAll(".redrawElementFailed").remove();
        d3.selectAll("#failedLine10min").remove();
        d3.selectAll("#failedLine1day").remove();

        // Create circles for objects
        const circles = GC.total_failed_sms_graph.selectAll("circle")
            .data(GC.data);

        // Remove unwanted points
        circles.exit().remove()

        // Update current Points
        circles
            .attr("cx", d => GC.failed_messages_x_axis_range(new Date(d.datetime)))
            .attr("cy", d => GC.y_total_failed_sms(d.total_errored))

        // Add new points
        circles.enter()
            .append("circle")
            .attr("class", "redrawElementFailed")
            .attr("r", 2)
            .attr("cx", d => GC.failed_messages_x_axis_range(new Date(d.datetime)))
            .attr("cy", d => GC.y_total_failed_sms(d.total_errored))
            .attr("fill", "blue");

        GC.total_failed_sms_graph.selectAll("circle")
            .on("mouseover", (d, i, n) => {
                d3.select(n[i])
                    .transition().duration(100)
                    .attr("r", 8)
                    .attr("fill", "blue")
                // Set x dotted line coords (x1,x2,y1,y2)
                xDottedLine
                    .attr("x1", GC.failed_messages_x_axis_range(new Date(d.datetime)))
                    .attr("x2", GC.failed_messages_x_axis_range(new Date(d.datetime)))
                    .attr("y1", GC.Height)
                    .attr("y2", GC.y_total_failed_sms(d.total_errored))
                // Set y dotted line coords (x1,x2,y1,y2)
                yDottedLine
                    .attr("x1", 0)
                    .attr("x2", GC.failed_messages_x_axis_range(new Date(d.datetime)))
                    .attr("y1", GC.y_total_failed_sms(d.total_errored))
                    .attr("y2", GC.y_total_failed_sms(d.total_errored))
                // Show the dotted line group (style, opaccity)
                dottedLines.style("opacity", 1);
            })
            .on("mouseleave", (d, i, n) => {
                d3.select(n[i])
                    .transition().duration(100)
                    .attr("r", 2)
                    .attr("fill", "blue")
                // Hide the dotted line group (style, opaccity)
                dottedLines.style("opacity", 0);
            }) 

        //Add the X Axis for the total failed sms graph
        GC.total_failed_sms_graph
            .append("g")
            .attr("class", "redrawElementFailed")
            .attr("transform", "translate(0," + GC.Height + ")")
            .call(d3.axisBottom(GC.failed_messages_x_axis_range)
                .ticks(d3.timeDay.every(1))
                .tickFormat(GC.dayDateFormatWithWeekdayName))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        //Add X axis label for the total failed sms graph
        GC.total_failed_sms_graph
            .append("text")
            .attr("class", "redrawElementFailed")
            .attr(
                "transform",
                "translate(" + GC.Width / 2 + " ," + (GC.Height + GC.Margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text("Time (D:H:M:S)");

        // Add the Y Axis for the total failed sms graph
        GC.total_failed_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementFailed")
            .call(d3.axisLeft(GC.y_total_failed_sms));

        // Total Failed Sms(s) graph title
        GC.total_failed_sms_graph
            .append("text")
            .attr("class", "redrawElementFailed")
            .attr("x", GC.Width / 2)
            .attr("y", 0 - GC.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Failed Messages(s) / day");

        // Label Lines for the total failed sms graph
        GC.total_failed_sms_graph.append("text");

        // Define line paths for total failed sms(s)
        GC.total_failed_line = d3
                .line()
                .curve(d3.curveLinear)
                .x(d => GC.failed_messages_x_axis_range(new Date(d.datetime)))
                .y(d => GC.y_total_failed_sms(d.total_errored));

        // Create line path element for failed line graph
        let total_failed_path = GC.total_failed_sms_graph.append("path");

        // Create dotted line group and append to graph
        const dottedLines = GC.total_failed_sms_graph.append("g")
            .attr("class", "lines")
            .attr("opacity", 0)

        // Create x dotted line and append to dotted line group
        const xDottedLine = dottedLines.append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", 4);

        // Create y dotted line and append to dotted line group
        const yDottedLine = dottedLines.append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", 4);

        // update path data for total failed sms(s)
        total_failed_path
            .data([GC.data])
            .attr("class", "line")
            .attr("id", "failedLine1day")
            .attr("fill", "none")
            .style("stroke", "blue")
            .style("stroke-width", 1)
            .attr("d", GC.total_failed_line);
    }

    static draw10MinFailedGraph(dataFilteredWeek, yLimitFailed) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        if (GC.isYLimitFailedManuallySet == false) {
            yLimitFailed = d3.max(dataFilteredWeek, d => d.total_sent);
        }

        // Set Y axis limit to max of daily values or to the value inputted by the user
        let yLimitFailedTotal = d3.max(GC.dailyFailedTotal, d => d.total_errored);

        if (GC.isYLimitFailedManuallySet != true) {
            yLimitFailed = yLimitFailedTotal;
        }
        // set scale domain for failed graph
        GC.y_total_failed_sms.domain([0, yLimitFailed]);
        GC.failed_messages_x_axis_range.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));

        d3.selectAll(".redrawElementFailed").remove();
        d3.selectAll("#failedLine10min").remove();
        d3.selectAll("#failedLine1day").remove();

        // Create circles for objects
        const circles = GC.total_failed_sms_graph.selectAll("circle")
            .data(dataFilteredWeek);

        // Remove unwanted points
        circles.exit().remove()

        // Update current Points
        circles
            .attr("cx", d => GC.failed_messages_x_axis_range(new Date(d.datetime)))
            .attr("cy", d => GC.y_total_failed_sms(d.total_errored))

        // Add new points
        circles.enter()
            .append("circle")
            .attr("class", "redrawElementFailed")
            .attr("r", 2)
            .attr("cx", d => GC.failed_messages_x_axis_range(new Date(d.datetime)))
            .attr("cy", d => GC.y_total_failed_sms(d.total_errored))
            .attr("fill", "blue");

        GC.total_failed_sms_graph.selectAll("circle")
            .on("mouseover", (d, i, n) => {
                d3.select(n[i])
                    .transition().duration(100)
                    .attr("r", 8)
                    .attr("fill", "blue")
                // Set x dotted line coords (x1,x2,y1,y2)
                xDottedLine
                    .attr("x1", GC.failed_messages_x_axis_range(new Date(d.datetime)))
                    .attr("x2", GC.failed_messages_x_axis_range(new Date(d.datetime)))
                    .attr("y1", GC.Height)
                    .attr("y2", GC.y_total_failed_sms(d.total_errored))
                // Set y dotted line coords (x1,x2,y1,y2)
                yDottedLine
                    .attr("x1", 0)
                    .attr("x2", GC.failed_messages_x_axis_range(new Date(d.datetime)))
                    .attr("y1", GC.y_total_failed_sms(d.total_errored))
                    .attr("y2", GC.y_total_failed_sms(d.total_errored))
                // Show the dotted line group (style, opaccity)
                dottedLines.style("opacity", 1);
            })
            .on("mouseleave", (d, i, n) => {
                d3.select(n[i])
                    .transition().duration(100)
                    .attr("r", 2)
                    .attr("fill", "blue")
                // Hide the dotted line group (style, opaccity)
                dottedLines.style("opacity", 0);
            }) 

        //Add the X Axis for the total failed sms graph
        GC.total_failed_sms_graph
            .append("g")
            .attr("class", "redrawElementFailed")
            .attr("transform", "translate(0," + GC.Height + ")")
            .call(d3.axisBottom(GC.failed_messages_x_axis_range)
                .ticks(d3.timeDay.every(1))
                .tickFormat(GC.dayDateFormat))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        //Add X axis label for the total failed sms graph
        GC.total_failed_sms_graph
            .append("text")
            .attr("class", "redrawElementFailed")
            .attr(
                "transform",
                "translate(" + GC.Width / 2 + " ," + (GC.Height + GC.Margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text("Time (D:H:M:S)");

        // Add the Y Axis for the total failed sms graph
        GC.total_failed_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementFailed")
            .call(d3.axisLeft(GC.y_total_failed_sms));

        // Total Failed Sms(s) graph title
        GC.total_failed_sms_graph
            .append("text")
            .attr("class", "redrawElementFailed")
            .attr("x", GC.Width / 2)
            .attr("y", 0 - GC.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Failed Messages(s) / day");

        // Label Lines for the total failed sms graph
        GC.total_failed_sms_graph.append("text");

        // Define line paths for total failed sms(s)
        GC.total_failed_line = d3
                .line()
                .curve(d3.curveLinear)
                .x(d => GC.failed_messages_x_axis_range(new Date(d.datetime)))
                .y(d => GC.y_total_failed_sms(d.total_errored));

        // Create line path element for failed line graph
        let total_failed_path = GC.total_failed_sms_graph.append("path");

        // Create dotted line group and append to graph
        const dottedLines = GC.total_failed_sms_graph.append("g")
            .attr("class", "lines")
            .attr("opacity", 0)

        // Create x dotted line and append to dotted line group
        const xDottedLine = dottedLines.append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", 4);

        // Create y dotted line and append to dotted line group
        const yDottedLine = dottedLines.append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", 4);

        // update path data for total failed sms(s)
        total_failed_path
            .data([dataFilteredWeek])
            .attr("class", "line")
            .attr("id", "failedLine10min")
            .attr("fill", "none")
            .style("stroke", "blue")
            .style("stroke-width", 1)
            .attr("d", GC.total_failed_line);
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
        GC.color = d3.scaleOrdinal(color_scheme);
        let colorReceived = d3.scaleOrdinal(color_scheme).domain(GC.receivedKeys),
            colorSent = d3.scaleOrdinal(color_scheme).domain(GC.sentKeys);

        // Total received graph legend
        GC.total_received_sms_graph
            .append("g")
            .attr("class", "receivedLegend")
            .attr(
                "transform",
                `translate(${GC.Width - GC.Margin.right + 110},${GC.Margin.top - 30})`
            );

        let receivedLegend = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(colorReceived)
            .labels(GC.operators);

        d3.select(".receivedLegend").call(receivedLegend);

        // Total sent graph legend
        GC.total_sent_sms_graph
            .append("g")
            .attr("class", "sentLegend")
            .attr(
                "transform",
                `translate(${GC.Width - GC.Margin.right + 110},${GC.Margin.top - 30})`
            );

        let sentLegend = d3
            .legendColor()
            .shapeWidth(12)
            .orient("vertical")
            .scale(colorSent)
            .labels(GC.operators);

        d3.select(".sentLegend").call(sentLegend);
    }

    static updateReceivedChartLimit() {
        // Get the value of the button
        let ylimit = this.value;

        GC.y_total_received_sms_range.domain([0, ylimit]);

        // Add the Y Axis for the total received sms graph
        GC.total_received_sms_graph
            .selectAll(".axisSteelBlue")
            .call(d3.axisLeft(GC.y_total_received_sms_range));

        GC.receivedLayer
            .selectAll("rect")
            .data(d => d)
            .attr("x", d => GC.x(d.data.datetime))
            .attr("y", d => GC.y_total_received_sms_range(d[1]))
            .attr(
                "height",
                d => GC.y_total_received_sms_range(d[0]) - GC.y_total_received_sms_range(d[1])
            )
            .attr("width", GC.Width / Object.keys(data).length);
    }

    static updateSentChartLimit() {
        // Get the value of the button
        let ylimit = this.value;

        GC.y_total_sent_sms_range.domain([0, ylimit]);

        // Add the Y Axis for the total sent sms graph
        GC.total_sent_sms_graph
            .selectAll(".axisSteelBlue")
            .call(d3.axisLeft(GC.y_total_sent_sms_range));

        GC.sentLayer
            .selectAll("rect")
            .data(d => d)
            .attr("x", d => GC.x(d.data.datetime))
            .attr("y", d => GC.y_total_sent_sms_range(d[1]))
            .attr("height", d => GC.y_total_sent_sms_range(d[0]) - GC.y_total_sent_sms_range(d[1]))
            .attr("width", GC.Width / Object.keys(data).length);
    }

    static updateFailedChartLimit() {
        // Get the value of the button
        let yLimit = this.value;

        GC.y_total_failed_sms.domain([0, yLimit]);

        // Add the Y Axis for the total failed sms graph
        GC.total_failed_sms_graph
            .selectAll(".axisSteelBlue")
            .call(d3.axisLeft(GC.y_total_failed_sms))

        // Define line paths for total failed sms(s)
        GC.total_failed_line = d3
                .line()
                .curve(d3.curveLinear)
                .x(d => GC.failed_messages_x_axis_range(new Date(d.datetime)))
                .y(d => GC.y_total_failed_sms(d.total_errored));
    }

    static setLastUpdatedAlert() {
        // Calculate time diff between current and lastUpdateTimeStamp
        let currentTime = new Date(),
            difference_ms = (currentTime.getTime() - GC.lastUpdateTimeStamp.getTime()) / 60000,
            difference_minutes = Math.floor(difference_ms % 60);
        if (difference_minutes > 20) {
            d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", true);
        } else {
            d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", false);
        }
    }

    static clearTimers() {
        if (GC.lastUpdateTimer) {
            clearInterval(GC.lastUpdateTimer);
            GC.lastUpdateTimer = null;
        }
    }

    static draw10MinReceivedGraph(dataFilteredWeek, yLimitReceived) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        if (GC.isYLimitReceivedManuallySet == false) {
            yLimitReceived = d3.max(dataFilteredWeek, d => d.total_received);
        }

        let stackReceived = d3.stack().keys(GC.receivedKeys),
            receivedDataStacked = stackReceived(dataFilteredWeek);

        // set scale domains
        GC.x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
        GC.y_total_received_sms_range.domain([0, yLimitReceived]);

        d3.selectAll(".redrawElementReceived").remove();
        d3.selectAll("#receivedStack").remove();
        d3.selectAll("#receivedStack10min").remove();

        // Add the Y Axis for the total received sms graph
        GC.total_received_sms_graph
            .append("g")
            .attr("id", "axisSteelBlue")
            .attr("class", "redrawElementReceived")
            .call(d3.axisLeft(GC.y_total_received_sms_range));

        let receivedLayer10min = GC.total_received_sms_graph
            .selectAll("#receivedStack10min")
            .data(receivedDataStacked)
            .enter()
            .append("g")
            .attr("id", "receivedStack10min")
            .attr("class", (d, i) => GC.receivedKeys[i])
            .style("fill", (d, i) => GC.color(i));

        receivedLayer10min
            .selectAll("rect")
            .data(dataFilteredWeek => dataFilteredWeek)
            .enter()
            .append("rect")
            .attr("x", d => GC.x(d.data.datetime))
            .attr("y", d => GC.y_total_received_sms_range(d[1]))
            .attr(
                "height",
                d => GC.y_total_received_sms_range(d[0]) - GC.y_total_received_sms_range(d[1])
            )
            .attr("width", GC.Width / Object.keys(dataFilteredWeek).length);

        //Add the X Axis for the total received sms graph
        GC.total_received_sms_graph
            .append("g")
            .attr("class", "redrawElementReceived")
            .attr("transform", "translate(0," + GC.Height + ")")
            .call(d3.axisBottom(GC.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GC.dayDateFormat))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total received sms graph
        GC.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr(
                "transform",
                "translate(" + GC.Width / 2 + " ," + (GC.Height + GC.Margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (D-M-Y)");

        // Total Sms(s) graph title
        GC.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr("x", GC.Width / 2)
            .attr("y", 0 - GC.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Incoming Message(s) / 10 minutes");
    }

    static draw10MinSentGraph(dataFilteredWeek, yLimitSent) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        if (GC.isYLimitSentManuallySet == false) {
            yLimitSent = d3.max(dataFilteredWeek, d => d.total_sent);
        }

        let stackSent = d3.stack().keys(GC.sentKeys),
            sentDataStacked = stackSent(dataFilteredWeek);

        // set scale domains
        GC.x.domain(d3.extent(dataFilteredWeek, d => new Date(d.datetime)));
        GC.y_total_sent_sms_range.domain([0, yLimitSent]);

        // Remove changing chart elements before redrawing
        d3.selectAll(".redrawElementSent").remove();
        d3.selectAll("#sentStack1day").remove();
        d3.selectAll("#sentStack10min").remove();

        // Add the Y Axis for the total sent sms graph
        GC.total_sent_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementSent")
            .call(d3.axisLeft(GC.y_total_sent_sms_range));

        // Create stacks
        let sentLayer10min = GC.total_sent_sms_graph
            .selectAll("#sentStack10min")
            .data(sentDataStacked)
            .enter()
            .append("g")
            .attr("id", "sentStack10min")
            .attr("class", (d, i) => GC.sentKeys[i])
            .style("fill", (d, i) => GC.color(i));

        sentLayer10min
            .selectAll("rect")
            .data(dataFilteredWeek => dataFilteredWeek)
            .enter()
            .append("rect")
            .attr("x", d => GC.x(d.data.datetime))
            .attr("y", d => GC.y_total_sent_sms_range(d[1]))
            .attr("height", d => GC.y_total_sent_sms_range(d[0]) - GC.y_total_sent_sms_range(d[1]))
            .attr("width", GC.Width / Object.keys(dataFilteredWeek).length);

        //Add the X Axis for the total sent sms graph
        GC.total_sent_sms_graph
            .append("g")
            .attr("class", "redrawElementSent")
            .attr("transform", "translate(0," + GC.Height + ")")
            .call(d3.axisBottom(GC.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GC.dayDateFormat))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total sent sms graph
        GC.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr(
                "transform",
                "translate(" + GC.Width / 2 + " ," + (GC.Height + GC.Margin.top + 50) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (D-M-Y)");

        // Total Sms(s) graph title
        GC.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr("x", GC.Width / 2)
            .attr("y", 0 - GC.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Outgoing Message(s) / 10 minutes");
    }

    static drawOneDayReceivedGraph(yLimitReceived) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        let yLimitReceivedTotal = d3.max(GC.dailyReceivedTotal, d => d.total_received);

        if (GC.isYLimitReceivedManuallySet == false) {
            yLimitReceived = yLimitReceivedTotal;
        }

        GC.xMin = d3.min(GC.data, d => new Date(d.day));
        GC.xMax = d3.max(GC.data, d => GC.addOneDayToDate(d.day));
        // set scale domains
        GC.x.domain([GC.xMin, GC.xMax]);
        GC.y_total_received_sms_range.domain([0, yLimitReceived]);

        d3.selectAll(".redrawElementReceived").remove();
        d3.selectAll("#receivedStack10min").remove();
        d3.selectAll("#receivedStack").remove();

        // Add the Y Axis for the total received sms graph
        GC.total_received_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementReceived")
            .call(d3.axisLeft(GC.y_total_received_sms_range));

        GC.receivedLayer = GC.total_received_sms_graph
            .selectAll("#receivedStack")
            .data(GC.receivedDataStackedDaily)
            .enter()
            .append("g")
            .attr("id", "receivedStack")
            .attr("class", (d, i) => GC.receivedKeys[i])
            .style("fill", (d, i) => GC.color(i));

        GC.receivedLayer
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => GC.x(new Date(d.data.day)))
            .attr("y", d => GC.y_total_received_sms_range(d[1]))
            .attr(
                "height",
                d => GC.y_total_received_sms_range(d[0]) - GC.y_total_received_sms_range(d[1])
            )
            .attr("width", GC.Width / Object.keys(GC.dailyReceivedTotal).length);

        //Add the X Axis for the total received sms graph
        GC.total_received_sms_graph
            .append("g")
            .attr("class", "redrawElementReceived")
            .attr("transform", "translate(0," + GC.Height + ")")
            .call(d3.axisBottom(GC.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GC.dayDateFormatWithWeekdayName))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total received sms graph
        GC.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr(
                "transform",
                "translate(" + GC.Width / 2 + " ," + (GC.Height + GC.Margin.top + 65) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (Y-M-D)");

        // Total Sms(s) graph title
        GC.total_received_sms_graph
            .append("text")
            .attr("class", "redrawElementReceived")
            .attr("x", GC.Width / 2)
            .attr("y", 0 - GC.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Incoming Message(s) / day");
    }

    static drawOneDaySentGraph(yLimitSent) {
        // Set Y axis limit to max of daily values or to the value inputted by the user
        let yLimitSentTotal = d3.max(GC.dailySentTotal, d => d.total_sent);

        if (GC.isYLimitSentManuallySet != true) {
            yLimitSent = yLimitSentTotal;
        }

        GC.xMin = d3.min(GC.data, d => new Date(d.day));
        GC.xMax = d3.max(GC.data, d => GC.addOneDayToDate(d.day));
        // set scale domains
        GC.x.domain([GC.xMin, GC.xMax]);
        GC.y_total_sent_sms_range.domain([0, yLimitSent]);

        d3.selectAll(".redrawElementSent").remove();
        d3.selectAll("#sentStack10min").remove();
        d3.selectAll("#sentStack1day").remove();

        // Add the Y Axis for the total sent sms graph
        GC.total_sent_sms_graph
            .append("g")
            .attr("class", "axisSteelBlue")
            .attr("class", "redrawElementSent")
            .call(d3.axisLeft(GC.y_total_sent_sms_range));

        // Create stacks
        GC.sentLayer = GC.total_sent_sms_graph
            .selectAll("#sentStack1day")
            .data(GC.sentDataStackedDaily)
            .enter()
            .append("g")
            .attr("id", "sentStack1day")
            .attr("class", (d, i) => GC.sentKeys[i])
            .style("fill", (d, i) => GC.color(i));

        GC.sentLayer
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => GC.x(new Date(d.data.day)))
            .attr("y", d => GC.y_total_sent_sms_range(d[1]))
            .attr("height", d => GC.y_total_sent_sms_range(d[0]) - GC.y_total_sent_sms_range(d[1]))
            .attr("width", GC.Width / Object.keys(GC.dailySentTotal).length);

        //Add the X Axis for the total sent sms graph
        GC.total_sent_sms_graph
            .append("g")
            .attr("class", "redrawElementSent")
            .attr("transform", "translate(0," + GC.Height + ")")
            .call(d3.axisBottom(GC.x)
                    .ticks(d3.timeDay.every(1))
                    .tickFormat(GC.dayDateFormatWithWeekdayName))
            // Rotate axis labels
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Add X axis label for the total sent sms graph
        GC.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr(
                "transform",
                "translate(" + GC.Width / 2 + " ," + (GC.Height + GC.Margin.top + 65) + ")"
            )
            .style("text-anchor", "middle")
            .text("Date (Y-M-D)");

        // Total Sms(s) graph title
        GC.total_sent_sms_graph
            .append("text")
            .attr("class", "redrawElementSent")
            .attr("x", GC.Width / 2)
            .attr("y", 0 - GC.Margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("text-decoration", "bold")
            .text("Total Outgoing Message(s) / day");
    }

    static updateGraphs(data, projectName) {
        GC.setProperties();

        if (!GC.chartTimeUnit) {
            GC.chartTimeUnit = "10min";
        }

        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        GC.formatData(data);

        // Sort data by date
        data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        // Assign formatted and sorted data to static variable
        GC.data = data;

        let offsetWeek = new Date(),
            offsetMonth = new Date();

        offsetWeek.setDate(offsetWeek.getDate() - GC.TIMEFRAME_WEEK);
        offsetMonth.setDate(offsetMonth.getDate() - GC.TIMEFRAME_MONTH);

        let dataFilteredWeek = GC.data.filter(a => a.datetime > offsetWeek),
            dataFilteredMonth = GC.data.filter(a => a.datetime > offsetMonth);

        // Process Data
        GC.GroupDataByDay(dataFilteredMonth, "received");
        GC.FlattenNestedDataforStacking("received");
        GC.GroupDataByDay(dataFilteredMonth, "sent");
        GC.FlattenNestedDataforStacking("sent");
        GC.stackDataBasedOnOperatorAndDirection();

        GC.setUpGraphLayout();
        GC.setUpGraphLegend();

        // Set default y-axis limits
        let yLimitReceived = d3.max(GC.dailyReceivedTotal, d => d.total_received),
            yLimitReceivedFiltered = d3.max(dataFilteredWeek, d => d.total_received),
            yLimitSent = d3.max(GC.dailySentTotal, d => d.total_sent),
            yLimitSentFiltered = d3.max(dataFilteredWeek, d => d.total_sent),
            yLimitFailed = d3.max(GC.dailyFailedTotal, d => d.total_errored),
            yLimitFailedFiltered = d3.max(dataFilteredWeek, d => d.total_errored); 

        // Draw graphs according to selected time unit
        if (GC.chartTimeUnit == "1day") {
            updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed);
        } else if (GC.chartTimeUnit == "10min") {
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered, yLimitFailedFiltered);
        }

        // Add an event listener to the button created in the html part
        d3.select("#buttonYLimitReceived").on("input", GC.updateReceivedChartLimit);
        d3.select("#buttonYLimitSent")
            .on("input", GC.updateSentChartLimit)
            .attr("transform", `translate(${GC.Width - GC.Margin.right + 100},${GC.Margin.top})`)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "blue")
            .text("Total Failed");
        d3.select("#buttonYLimitFailed").on("input", GC.updateFailedChartLimit)

        // Set y-axis control button value and draw graphs
        function updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered, yLimitFailedFiltered) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceivedFiltered);
            d3.select("#buttonYLimitSent").property("value", yLimitSentFiltered);
            GC.draw10MinReceivedGraph(dataFilteredWeek, yLimitReceivedFiltered);
            GC.draw10MinSentGraph(dataFilteredWeek, yLimitSentFiltered);
            GC.draw10MinFailedGraph(dataFilteredWeek, yLimitFailedFiltered);
        }

        function updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceived);
            d3.select("#buttonYLimitSent").property("value", yLimitSent);
            d3.select("#buttonYLimitFailed").property("value", yLimitFailed);
            GC.drawOneDayReceivedGraph(yLimitReceived);
            GC.drawOneDaySentGraph(yLimitSent);
            GC.drawOneDayFailedGraph(yLimitFailed)
        }

        // Update chart time unit on user selection
        d3.select("#buttonUpdateView10Minutes").on("click", () => {
            GC.chartTimeUnit = "10min";
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered, yLimitFailedFiltered);
        });

        d3.select("#buttonUpdateViewOneDay").on("click", () => {
            GC.chartTimeUnit = "1day";
            updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed);
        });

        // Draw received graph with user-selected y-axis limit
        d3.select("#buttonYLimitReceived").on("input", function() {
            GC.isYLimitReceivedManuallySet = true;
            if (GC.chartTimeUnit == "1day") {
                yLimitReceived = this.value;
                GC.drawOneDayReceivedGraph(yLimitReceived);
            } else if (GC.chartTimeUnit == "10min") {
                yLimitReceivedFiltered = this.value;
                GC.draw10MinReceivedGraph(dataFilteredWeek, yLimitReceivedFiltered);
            }
        });

        // Draw sent graph with user-selected y-axis limit
        d3.select("#buttonYLimitSent").on("input", function() {
            GC.isYLimitSentManuallySet = true;
            if (GC.chartTimeUnit == "1day") {
                yLimitSent = this.value;
                GC.drawOneDaySentGraph(yLimitSent);
            } else if (GC.chartTimeUnit == "10min") {
                yLimitSentFiltered = this.value;
                GC.draw10MinSentGraph(dataFilteredWeek, yLimitSentFiltered);
            }
        });

        // Draw failed graph with user-selected y-axis limit
        d3.select("#buttonYLimitFailed").on("input", function() {
            GC.isYLimitFailedManuallySet = true;
            if (GC.chartTimeUnit == "1day") {
                yLimitFailed = this.value;
                GC.drawOneDayFailedGraph(yLimitFailed);
            } else if (GC.chartTimeUnit == "10min") {
                yLimitFailedFiltered = this.value;
                GC.draw10MinFailedGraph(dataFilteredWeek, yLimitFailedFiltered);
            }
        });

        // Update timestamp of update and reset formatting
        GC.lastUpdateTimeStamp = new Date(
            Math.max.apply(
                null,
                GC.data.map(d => new Date(d.datetime))
            )
        );
        GC.lastUpdateTimeStamp.setMinutes(GC.lastUpdateTimeStamp.getMinutes() + 10);
        GC.lastUpdateTimeStamp = new Date(GC.lastUpdateTimeStamp);

        d3.select("#lastUpdated")
            .classed("text-stale-info", false)
            .text(GC.fullDateFormat(GC.lastUpdateTimeStamp));

        GC.setLastUpdatedAlert();

        if (GC.lastUpdateTimer) {
            clearInterval(GC.lastUpdateTimer);
        }
        GC.lastUpdateTimer = setInterval(GC.setLastUpdatedAlert, 1000);
    }
}
