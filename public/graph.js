// GRAPH CONTROLLER
class GraphController {
    static addOneDayToDate(date) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }

    static updateGraphs(data, projectName) {
        const TIMEFRAME_WEEK = 7,
            TIMEFRAME_MONTH = 30;
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
        const Margin = { top: 40, right: 100, bottom: 90, left: 70 },
            Width = 960 - Margin.right - Margin.left,
            Height = 500 - Margin.top - Margin.bottom,
            // Set x and y scales
            x = d3.scaleTime().range([0, Width]),
            failed_messages_x_axis_range = d3.scaleTime().range([0, Width]),
            y_total_received_sms_range = d3.scaleLinear().range([Height, 0]),
            y_total_sent_sms = d3.scaleLinear().range([Height, 0]),
            y_total_failed_sms = d3.scaleLinear().range([Height, 0]);

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
            ],
            color = d3.scaleOrdinal(color_scheme),
            colorReceived = d3.scaleOrdinal(color_scheme).domain(receivedKeys),
            colorSent = d3.scaleOrdinal(color_scheme).domain(sentKeys);

        // set scale domain for failed graph
        y_total_failed_sms.domain([0, d3.max(data, d => d.total_errored)]);
        failed_messages_x_axis_range.domain(d3.extent(data, d => new Date(d.datetime)));

        let yLimitReceived = d3.max(dailyReceivedTotal, d => d.total_received),
            yLimitReceivedFiltered = d3.max(dataFilteredWeek, d => d.total_received),
            yLimitSent = d3.max(dailySentTotal, d => d.total_sent),
            yLimitSentFiltered = d3.max(dataFilteredWeek, d => d.total_sent);

        // Draw graphs according to selected time unit
        if (GraphController.chartTimeUnit == "1day") {
            updateViewOneDay(yLimitReceived, yLimitSent);
        } else if (GraphController.chartTimeUnit == "10min") {
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered);
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

        function updateReceivedChartLimit() {
            // Get the value of the button
            let ylimit = this.value;

            y_total_received_sms.domain([0, ylimit]);

            // Add the Y Axis for the total received sms graph
            total_received_sms_graph
                .selectAll(".axisSteelBlue")
                .call(d3.axisLeft(y_total_received_sms));

            receivedLayer
                .selectAll("rect")
                .data(d => d)
                .attr("x", d => x(d.data.datetime))
                .attr("y", d => y_total_received_sms_range(d[1]))
                .attr(
                    "height",
                    d => y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1])
                )
                .attr("width", Width / Object.keys(data).length);
        }

        function updateSentChartLimit() {
            // Get the value of the button
            let ylimit = this.value;

            y_total_sent_sms.domain([0, ylimit]);

            // Add the Y Axis for the total sent sms graph
            total_sent_sms_graph.selectAll(".axisSteelBlue").call(d3.axisLeft(y_total_sent_sms));

            sentLayer
                .selectAll("rect")
                .data(d => d)
                .attr("x", d => x(d.data.datetime))
                .attr("y", d => y_total_sent_sms(d[1]))
                .attr("height", d => y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]))
                .attr("width", Width / Object.keys(data).length);
        }

        // Add an event listener to the button created in the html part
        d3.select("#buttonYLimitReceived").on("input", updateReceivedChartLimit);
        d3.select("#buttonYLimitSent")
            .on("input", updateSentChartLimit)
            .attr("transform", `translate(${Width - Margin.right + 100},${Margin.top})`)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "blue")
            .text("Total Failed");

        // Set y-axis control button value and draw graphs
        function updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceivedFiltered);
            d3.select("#buttonYLimitSent").property("value", yLimitSentFiltered);
            draw10MinReceivedGraph(yLimitReceivedFiltered);
            draw10MinSentGraph(yLimitSentFiltered);
        }

        function updateViewOneDay(yLimitReceived, yLimitSent) {
            d3.select("#buttonYLimitReceived").property("value", yLimitReceived);
            d3.select("#buttonYLimitSent").property("value", yLimitSent);
            drawOneDayReceivedGraph(yLimitReceived);
            drawOneDaySentGraph(yLimitSent);
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
            y_total_received_sms_range.domain([0, yLimitReceived]);

            d3.selectAll(".redrawElementReceived").remove();
            d3.selectAll("#receivedStack").remove();
            d3.selectAll("#receivedStack10min").remove();

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
                        .ticks(d3.timeDay.every(1))
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
                .text("Date (D-M-Y)");

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

            xMin = d3.min(data, d => new Date(d.day));
            xMax = d3.max(data, d => GraphController.addOneDayToDate(d.day));
            // set scale domains
            x.domain([xMin, xMax]);
            y_total_received_sms_range.domain([0, yLimitReceived]);

            d3.selectAll(".redrawElementReceived").remove();
            d3.selectAll("#receivedStack10min").remove();
            d3.selectAll("#receivedStack").remove();

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
                .attr("width", Width / Object.keys(dailyReceivedTotal).length);

            //Add the X Axis for the total received sms graph
            total_received_sms_graph
                .append("g")
                .attr("class", "redrawElementReceived")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .ticks(d3.timeDay.every(1))
                        .tickFormat(dayDateFormatWithWeekdayName)
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
            y_total_sent_sms.domain([0, yLimitSent]);

            // Remove changing chart elements before redrawing
            d3.selectAll(".redrawElementSent").remove();
            d3.selectAll("#sentStack1day").remove();
            d3.selectAll("#sentStack10min").remove();

            // Add the Y Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "axisSteelBlue")
                .attr("class", "redrawElementSent")
                .call(d3.axisLeft(y_total_sent_sms));

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
                .attr("y", d => y_total_sent_sms(d[1]))
                .attr("height", d => y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]))
                .attr("width", Width / Object.keys(dataFilteredWeek).length);

            //Add the X Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "redrawElementSent")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .ticks(d3.timeDay.every(1))
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
                .text("Date (D-M-Y)");

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

            xMin = d3.min(data, d => new Date(d.day));
            xMax = d3.max(data, d => GraphController.addOneDayToDate(d.day));
            // set scale domains
            x.domain([xMin, xMax]);
            y_total_sent_sms.domain([0, yLimitSent]);

            d3.selectAll(".redrawElementSent").remove();
            d3.selectAll("#sentStack10min").remove();
            d3.selectAll("#sentStack1day").remove();

            // Add the Y Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "axisSteelBlue")
                .attr("class", "redrawElementSent")
                .call(d3.axisLeft(y_total_sent_sms));

            // Create stacks
            let sentLayer = total_sent_sms_graph
                .selectAll("#sentStack1day")
                .data(sentDataStackedDaily)
                .enter()
                .append("g")
                .attr("id", "sentStack1day")
                .attr("class", (d, i) => sentKeys[i])
                .style("fill", (d, i) => color(i));

            sentLayer
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("x", d => x(new Date(d.data.day)))
                .attr("y", d => y_total_sent_sms(d[1]))
                .attr("height", d => y_total_sent_sms(d[0]) - y_total_sent_sms(d[1]))
                .attr("width", Width / Object.keys(dailySentTotal).length);

            //Add the X Axis for the total sent sms graph
            total_sent_sms_graph
                .append("g")
                .attr("class", "redrawElementSent")
                .attr("transform", "translate(0," + Height + ")")
                .call(
                    d3
                        .axisBottom(x)
                        .ticks(d3.timeDay.every(1))
                        .tickFormat(dayDateFormatWithWeekdayName)
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
