import { BarChart } from "../libs/bar_chart.js";

// GRAPH CONTROLLER
export class TrafficGraphsController {
    static addOneDayToDate(date) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }

    static updateGraphs(data, projectName, operators,  MNOColors) {
        const TIMEFRAME_WEEK = 7;
        const TIMEFRAME_MONTH = 30;
        if (!(TrafficGraphsController.tenMinGraphTimeframe && TrafficGraphsController.oneDayGraphTimeframe)) {
            TrafficGraphsController.tenMinGraphTimeframe = TIMEFRAME_WEEK; 
            TrafficGraphsController.oneDayGraphTimeframe = TIMEFRAME_MONTH;
        }
        if (!TrafficGraphsController.chartTimeUnit) 
            TrafficGraphsController.chartTimeUnit = "10min";   
       
        let isYLimitReceivedManuallySet = false,
            isYLimitSentManuallySet = false,
            isYLimitFailedManuallySet = false,
            dayTimeFormat = d3.timeFormat("%H:%M %p"),
            dayDateFormatWithWeekdayName = d3.timeFormat("%Y-%m-%d:%a");

        // Clear previous graphs before redrawing
        d3.selectAll("svg").remove();

        let offsetTenMinGraph = new Date(),
            offsetOneDayGraph = new Date();

        offsetTenMinGraph.setDate(offsetTenMinGraph.getDate() - TrafficGraphsController.tenMinGraphTimeframe);
        offsetOneDayGraph.setDate(offsetOneDayGraph.getDate() - TrafficGraphsController.oneDayGraphTimeframe);
        // Set date offsets to nearest midnight in the past 
        /* The offset dates sometime don't begin at the start of the day; thus they leave 
            the rest of the day messages not to be included in the first bar of graph when
            plotting one day view graphs */
        offsetTenMinGraph.setHours(0,0,0,0)
        offsetOneDayGraph.setHours(0,0,0,0)

        // Set default y-axis limits
        let tenMinGraphFilteredData = data.filter(a => a.datetime > offsetTenMinGraph),
            oneDayGraphFilteredData = data.filter(a => a.datetime > offsetOneDayGraph);

        // Group received data by day
        let dailyReceivedTotal = d3
            .rollup(oneDayGraphFilteredData, v => {
                let receivedData = {};
                operators.forEach(operator => {
                    receivedData[`${operator}_received`] = d3.sum(
                        v,
                        d => d[`${operator}_received`]
                    );
                });
                receivedData["total_received"] = d3.sum(v, d => d.total_received);
                return receivedData;
            }, d => d.day)
        // Convert Map to array of object
        dailyReceivedTotal = Array.from(dailyReceivedTotal, ([key, value]) => ({ key, value }));

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
            .rollup(oneDayGraphFilteredData, v => {
                let sentData = {};
                operators.forEach(operator => {
                    sentData[`${operator}_sent`] = d3.sum(v, d => d[`${operator}_sent`]);
                });
                sentData["total_sent"] = d3.sum(v, d => d.total_sent);
                return sentData;
            }, d => d.day)
        // Convert Map to array of object
        dailySentTotal = Array.from(dailySentTotal, ([key, value]) => ({ key, value }));

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
            .rollup(oneDayGraphFilteredData, v => {
                let failedData = {};
                failedData["total_errored"] = d3.sum(v,d => d.total_errored);
                return failedData;
            }, d => d.day)
        // Convert Map to array of object
        dailyFailedTotal = Array.from(dailyFailedTotal, ([key, value]) => ({ key, value }));

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
            y_total_received_sms_range = d3.scaleLinear().range([Height, 0]),
            y_total_sent_sms_range = d3.scaleLinear().range([Height, 0]);

        const tip = d3
            .select("body")
            .append("div")
            .attr("class", "card")
            .style("padding", "4px") // Add some padding so the tooltip content doesn't touch the border of the tooltip
            .style("position", "absolute") // Absolutely position the tooltip to the body. Later we'll use transform to adjust the position of the tooltip
            .style("left", 0)
            .style("top", 0)
            .style("background", "whitesmoke")
            .style("border-radius", "8px")
            .style("visibility", "hidden");

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
            // Format TimeStamp
            timeFormat = d3.timeFormat("%a %d (%H:%M)");

        let mnoColorScheme = [],
            operatorsWithColorIdentity = Object.keys(MNOColors);

        let firstOperatorWithoutColorIdentity = operators.filter(
            x => !operatorsWithColorIdentity.includes(x))[0];
        let firstOperatorsWithoutColorIdentityIndex = operators.indexOf(firstOperatorWithoutColorIdentity);
        // Assign the value of `other` property of MNOColors to the first operator without color identity
        mnoColorScheme[firstOperatorsWithoutColorIdentityIndex] = MNOColors.other;

        // Generate color scheme based on operators identity
        operators.forEach((operator, index) => {
            if (operatorsWithColorIdentity.includes(operator)) {
                mnoColorScheme[index] = MNOColors[operator];
            }
        });

        let color = d3.scaleOrdinal(mnoColorScheme),
            colorReceived = d3.scaleOrdinal(mnoColorScheme).domain(receivedKeys),
            colorSent = d3.scaleOrdinal(mnoColorScheme).domain(sentKeys);

        let yLimitReceived = d3.max(dailyReceivedTotal, d => d.total_received),
            yLimitReceivedFiltered = d3.max(tenMinGraphFilteredData, d => d.total_received),
            yLimitSent = d3.max(dailySentTotal, d => d.total_sent),
            yLimitSentFiltered = d3.max(tenMinGraphFilteredData, d => d.total_sent),
            yLimitFailed = d3.max(dailyFailedTotal, d => d.total_errored),
            yLimitFailedFiltered = d3.max(tenMinGraphFilteredData, d => d.total_errored); 

        // Draw graphs according to selected time unit
        if (TrafficGraphsController.chartTimeUnit == "1day") {
            updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed);
        } else if (TrafficGraphsController.chartTimeUnit == "10min") {
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
                yLimitReceived = d3.max(tenMinGraphFilteredData, d => d.total_received);
            }

            let stackReceived = d3.stack().keys(receivedKeys),
                receivedDataStacked = stackReceived(tenMinGraphFilteredData);

            // set scale domains
            x.domain(d3.extent(tenMinGraphFilteredData, d => new Date(d.datetime)));
            if (yLimitReceived > 0)
                y_total_received_sms_range.domain([0, yLimitReceived]);

            d3.selectAll(".redrawElementReceived").remove();
            d3.selectAll("#receivedStack").remove();
            d3.selectAll("#receivedStack10min").remove();
            d3.selectAll(".receivedGrid").remove();

            // Group data filtered by week daily and generate tick values for x axis
            let dataFilteredWeekGroupedDaily = d3
                .rollup(tenMinGraphFilteredData, v => {
                    let firstTimestampOfDay = {}
                    firstTimestampOfDay["datetime"] = d3.min(v,d => d.datetime)
                    return firstTimestampOfDay
                }, d => d.day)
            // Convert Map to array of object
            dataFilteredWeekGroupedDaily = Array.from(dataFilteredWeekGroupedDaily, ([key, value]) => ({ key, value }));

            // Flatten nested data
            for (let entry in dataFilteredWeekGroupedDaily) {
                let valueList = dataFilteredWeekGroupedDaily[entry].value;
                for (let key in valueList) {
                    dataFilteredWeekGroupedDaily[entry][key] = valueList[key];
                }
                delete dataFilteredWeekGroupedDaily[entry]["value"];
                delete dataFilteredWeekGroupedDaily[entry]["key"];
            }
            const tickValuesForXAxis = dataFilteredWeekGroupedDaily.map(d => d.datetime);

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

            // Add a clipPath: everything out of this area won't be drawn.
            let clip = total_received_sms_graph.append("defs").append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", Width)
                .attr("height", Height)
                .attr("x", 0)
                .attr("y", 0); 
            // Create the variable: where both the stacked bars and the brush take place
            let sectionWithBrushing = total_received_sms_graph.append('g').attr("clip-path", "url(#clip)");

            // Add the brushing
            let brush = d3.brushX().extent([[0, 0], [Width, Height]]).on("end", updateChart);
            sectionWithBrushing.append("g").attr("class", "brush").call(brush);
        
            let receivedLayer10min = sectionWithBrushing
                .selectAll("#receivedStack10min")
                .data(receivedDataStacked)
                .enter()
                .append("g")
                .attr("id", "receivedStack10min")
                .attr("class", (d, i) => receivedKeys[i])
                .style("fill", (d, i) => color(i));

            receivedLayer10min
                .selectAll("rect")
                .data(tenMinGraphFilteredData => tenMinGraphFilteredData)
                .enter()
                .append("rect")
                .attr("x", d => x(d.data.datetime))
                .attr("y", d => y_total_received_sms_range(d[1]))
                .attr(
                    "height",
                    d => y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1])
                )
                .attr("width", d => {
                    let datetime = new Date(d.data.datetime);
                    datetime.setMinutes(datetime.getMinutes() + 9);
                    return x(datetime) - x(d.data.datetime);
                });

            // Add tooltip for the total received sms graph
            receivedLayer10min
                .selectAll("rect")
                .on("mouseover", (event, d) => {
                    // Get key of stacked data from the selection
                    let operatorNameWithMessageDirection = d3.select(event.currentTarget.parentNode).datum().key,
                        // Get operator name from the key
                        operatorName = operatorNameWithMessageDirection.replace('_received',''),
                        // Get color of hovered rect
                        operatorColor = d3.select(event.currentTarget).style("fill");
                    let receivedMessages = d.data[operatorNameWithMessageDirection],
                        totalReceivedMessages = d.data.total_received,
                        receivedDay = d.data.datetime,
                        // Tooltip with operator name, date, no. of msg(s) & msg percentage in that day.
                        tooltipContent = `<div>${operatorName.charAt(0).toUpperCase() + operatorName.slice(1)}</div>`;
                        tooltipContent += `<div>${receivedMessages} 
                        (${Math.round((receivedMessages/totalReceivedMessages)*100)}%)
                        Message${receivedMessages !== 1 ? 's': ''} at ${dayTimeFormat(new Date(receivedDay))}</div>`;
                    tip.html(tooltipContent)
                        .style("color", operatorColor)
                        .style("font-size", "12px")
                        .style("font-weight", "600")
                        .style("font-family", "'Montserrat', sans-serif")
                        .style("box-shadow", `2px 2px 4px -1px ${operatorColor}`)
                        .style("visibility", "visible");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 0.8);
                })
                .on("mouseout", (event, d) => {
                    tip.style("visibility", "hidden");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 1);
                })
                .on("mousemove", (event, d) => {
                    tip.style("transform", `translate(${event.pageX}px, ${event.pageY - 60}px)`); // We can calculate the mouse's position relative the whole page by using event.pageX and event.pageY.
                })

            //Add the X Axis for the total received sms graph
            let xAxis = total_received_sms_graph
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
            xAxis
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

            // A function that set idleTimeOut to null
            let idleTimeout
            function idled() { idleTimeout = null; }

            // A function that update the chart for given boundaries
            function updateChart(event) {
                // What are the selected boundaries?
                let extent = event.selection;

                // If no selection, back to initial coordinate. Otherwise, update X axis domain
                if (!extent) {
                    if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                    x.domain(d3.extent(tenMinGraphFilteredData, d => new Date(d.datetime)));
                } else {
                    // Update x axis domain
                    x.domain([x.invert(extent[0]), x.invert(extent[1])]);

                    sectionWithBrushing.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                }

                // Update axis 
                xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(timeFormat));

                // Rotate axis labels
                xAxis
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");
                    
                // Redraw the stacked bars
                receivedLayer10min.selectAll("rect")
                    .attr("x", d => x(d.data.datetime))
                    .attr("width", d => {
                        let datetime = new Date(d.data.datetime);
                        datetime.setMinutes(datetime.getMinutes() + 9);
                        return x(datetime) - x(d.data.datetime);
                    });
            } 
        }

        function drawOneDayReceivedGraph(yLimitReceived) {
            // Set Y axis limit to max of daily values or to the value inputted by the user
            let yLimitReceivedTotal = d3.max(dailyReceivedTotal, d => d.total_received);

            if (isYLimitReceivedManuallySet == false) {
                yLimitReceived = yLimitReceivedTotal;
            }

            let xMin = d3.min(dailyReceivedTotal, d => new Date(d.day)),
                xMax = d3.max(dailyReceivedTotal, d => TrafficGraphsController.addOneDayToDate(d.day));
            // set scale domains
            x.domain([xMin, xMax]);
            if (yLimitReceived > 0)
                y_total_received_sms_range.domain([0, yLimitReceived]);

            d3.selectAll(".redrawElementReceived").remove();
            d3.selectAll("#receivedStack10min").remove();
            d3.selectAll("#receivedStack").remove();
            d3.selectAll(".receivedGrid").remove();

            const tickValuesForXAxis = dailyReceivedTotal.map(d => new Date(d.day));
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

            // Values to adjust x and width attributes
            let rightPadding = -2, shiftBarsToRight = 1;
            receivedLayer
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                /* Shift bars to the right 
                 - prevents first bar of graph from overlapping y axis path */
                .attr("x", d => x(new Date(d.data.day)) + shiftBarsToRight)
                .attr("y", d => y_total_received_sms_range(d[1]))
                .attr(
                    "height",
                    d => y_total_received_sms_range(d[0]) - y_total_received_sms_range(d[1])
                )
                /* Reduce the right padding of bars 
                 - Accomodates the shift of the bars to the right so that they don't overlap */
                .attr("width", (Width / Object.keys(dailyReceivedTotal).length) + rightPadding);

            // Add tooltip for the total received sms graph
            receivedLayer
                .selectAll("rect")
                .on("mouseover", (event, d) => {
                    // Get key of stacked data from the selection
                    let operatorNameWithMessageDirection = d3.select(event.currentTarget.parentNode).datum().key,
                        // Get operator name from the key
                        operatorName = operatorNameWithMessageDirection.replace('_received',''),
                        // Get color of hovered rect
                        operatorColor = d3.select(event.currentTarget.parentNode).style("fill");
                    let receivedMessages = d.data[operatorNameWithMessageDirection],
                        totalReceivedMessages = d.data.total_received,
                        // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
                        tooltipContent = `<div>${receivedMessages} 
                        (${Math.round((receivedMessages/totalReceivedMessages)*100)}%)
                        ${operatorName.charAt(0).toUpperCase() + operatorName.slice(1)} 
                        Message${receivedMessages !== 1 ? 's': ''} </div>`;
                    tip.html(tooltipContent)
                        .style("color", operatorColor)
                        .style("font-size", "12px")
                        .style("font-weight", "600")
                        .style("font-family", "'Montserrat', sans-serif")
                        .style("box-shadow", `2px 2px 4px -1px ${operatorColor}`)
                        .style("visibility", "visible");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 0.8);
                })
                .on("mouseout", (event, d) => {
                    tip.style("visibility", "hidden");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 1);
                })
                .on("mousemove", (event, d) => {
                    tip.style("transform", `translate(${event.pageX}px, ${event.pageY - 40}px)`); // We can calculate the mouse's position relative the whole page by using event.pageX and event.pageY.
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
                yLimitSent = d3.max(tenMinGraphFilteredData, d => d.total_sent);
            }

            let stackSent = d3.stack().keys(sentKeys),
                sentDataStacked = stackSent(tenMinGraphFilteredData);

            // set scale domains
            x.domain(d3.extent(tenMinGraphFilteredData, d => new Date(d.datetime)));
            if (yLimitSent > 0)
                y_total_sent_sms_range.domain([0, yLimitSent]);

            // Remove changing chart elements before redrawing
            d3.selectAll(".redrawElementSent").remove();
            d3.selectAll("#sentStack1day").remove();
            d3.selectAll("#sentStack10min").remove();
            d3.selectAll(".sentGrid").remove();

            // Group data filtered by week daily and generate tick values for x axis
            let dataFilteredWeekGroupedDaily = d3
                .rollup(tenMinGraphFilteredData, v => {
                    let firstTimestampOfDay = {}
                    firstTimestampOfDay["datetime"] = d3.min(v,d => d.datetime)
                    return firstTimestampOfDay
                }, d => d.day)
            // Convert Map to array of object
            dataFilteredWeekGroupedDaily = Array.from(dataFilteredWeekGroupedDaily, ([key, value]) => ({ key, value }));

            // Flatten nested data
            for (let entry in dataFilteredWeekGroupedDaily) {
                let valueList = dataFilteredWeekGroupedDaily[entry].value;
                for (let key in valueList) {
                    dataFilteredWeekGroupedDaily[entry][key] = valueList[key];
                }
                delete dataFilteredWeekGroupedDaily[entry]["value"];
                delete dataFilteredWeekGroupedDaily[entry]["key"];
            }
            const tickValuesForXAxis = dataFilteredWeekGroupedDaily.map(d => d.datetime);

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
                .data(tenMinGraphFilteredData => tenMinGraphFilteredData)
                .enter()
                .append("rect")
                .attr("x", d => x(d.data.datetime))
                .attr("y", d => y_total_sent_sms_range(d[1]))
                .attr("height", d => y_total_sent_sms_range(d[0]) - y_total_sent_sms_range(d[1]))
                .attr("width", Width / Object.keys(tenMinGraphFilteredData).length);

            // Add tooltip for the total received sms graph
            sentLayer10min
                .selectAll("rect")
                .on("mouseover", (event, d) => {
                    // Get key of stacked data from the selection
                    let operatorNameWithMessageDirection = d3.select(event.currentTarget.parentNode).datum().key,
                        // Get operator name from the key
                        operatorName = operatorNameWithMessageDirection.replace('_sent',''),
                        // Get color of hovered rect
                        operatorColor = d3.select(event.currentTarget).style("fill");
                    let sentMessages = d.data[operatorNameWithMessageDirection],
                        totalSentMessages = d.data.total_sent,
                        sentDay = d.data.datetime,
                        // Tooltip with operator name, date, no. of msg(s) & msg percentage in that day.
                        tooltipContent = `<div>${operatorName.charAt(0).toUpperCase() + operatorName.slice(1)}</div>`;
                    tooltipContent += `<div>${sentMessages} (${Math.round((sentMessages/totalSentMessages)*100)}%)
                        Message${sentMessages !== 1 ? 's': ''} at ${dayTimeFormat(new Date(sentDay))}</div>`;
                    tip.html(tooltipContent)
                        .style("color", operatorColor)
                        .style("font-size", "12px")
                        .style("font-weight", "600")
                        .style("font-family", "'Montserrat', sans-serif")
                        .style("box-shadow", `2px 2px 4px -1px ${operatorColor}`)
                        .style("visibility", "visible");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 0.8);
                })
                .on("mouseout", (event, d) => {
                    tip.style("visibility", "hidden");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 1);
                })
                .on("mousemove", (event, d) => {
                    tip.style("transform", `translate(${event.pageX}px, ${event.pageY - 60}px)`); // We can calculate the mouse's position relative the whole page by using event.pageX and event.pageY.
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
                xMax = d3.max(dailySentTotal, d => TrafficGraphsController.addOneDayToDate(d.day));
            // set scale domains
            x.domain([xMin, xMax]);
            if (yLimitSent > 0)
                y_total_sent_sms_range.domain([0, yLimitSent]);

            d3.selectAll(".redrawElementSent").remove();
            d3.selectAll("#sentStack10min").remove();
            d3.selectAll("#sentStack1day").remove();
            d3.selectAll(".sentGrid").remove();

            const tickValuesForXAxis = dailySentTotal.map(d => new Date(d.day));
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
            let sentLayer = total_sent_sms_graph
                .selectAll("#sentStack1day")
                .data(sentDataStackedDaily)
                .enter()
                .append("g")
                .attr("id", "sentStack1day")
                .attr("class", (d, i) => sentKeys[i])
                .style("fill", (d, i) => color(i));

            // Values to adjust x and width attributes
            let rightPadding = -2, shiftBarsToRight = 1;
            sentLayer
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                /* Shift bars to the right 
                 - prevents first bar of graph from overlapping y axis path */
                .attr("x", d => x(new Date(d.data.day)) + shiftBarsToRight)
                .attr("y", d => y_total_sent_sms_range(d[1]))
                .attr("height", d => y_total_sent_sms_range(d[0]) - y_total_sent_sms_range(d[1]))
                /* Reduce the right padding of bars 
                 - Accomodates the shift of the bars to the right so that they don't overlap */
                .attr("width", (Width / Object.keys(dailySentTotal).length) + rightPadding);

            // Add tooltip for the total sent sms graph
            sentLayer
                .selectAll("rect")
                .on("mouseover", (event, d) => {
                    // Get key of stacked data from the selection
                    let operatorNameWithMessageDirection = d3.select(event.currentTarget.parentNode).datum().key,
                        // Get operator name from the key
                        operatorName = operatorNameWithMessageDirection.replace('_sent',''),
                        // Get color of hovered rect
                        operatorColor = d3.select(event.currentTarget).style("fill");
                    let sentMessages = d.data[operatorNameWithMessageDirection],
                        totalSentMessages = d.data.total_sent,
                        // Tooltip with operator name, no. of msg(s) & msg percentage in that day.
                        tooltipContent = `<div>${sentMessages} 
                        (${Math.round((sentMessages/totalSentMessages)*100)}%)
                        ${operatorName.charAt(0).toUpperCase() + operatorName.slice(1)} 
                        Message${sentMessages !== 1 ? 's': ''} </div>`;
                    tip.html(tooltipContent)
                        .style("color", operatorColor)
                        .style("font-size", "12px")
                        .style("font-weight", "600")
                        .style("font-family", "'Montserrat', sans-serif")
                        .style("box-shadow", `2px 2px 4px -1px ${operatorColor}`)
                        .style("visibility", "visible");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 0.8);
                })
                .on("mouseout", (event, d) => {
                    tip.style("visibility", "hidden");
                    d3.select(event.currentTarget).transition().duration(10).attr("opacity", 1);
                })
                .on("mousemove", (event, d) => {
                    tip.style("transform", `translate(${event.pageX}px, ${event.pageY - 40}px)`); // We can calculate the mouse's position relative the whole page by using event.pageX and event.pageY.
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
            let oneDayFailedChartData = JSON.parse(JSON.stringify(dailyFailedTotal));
            oneDayFailedChartData.forEach(function(d) {
                d.datetime = new Date(d.day);
                d.value = +d.total_errored;
            })
            // Set Y axis limit to max of daily values or to the value inputted by the user
            let yLimitFailedTotal = d3.max(oneDayFailedChartData, d => d.value);
            if (isYLimitFailedManuallySet != true) {
                yLimitFailed = yLimitFailedTotal;
            }
            // Tick Values for X axis
            const tickValuesForXAxis = oneDayFailedChartData.map(d => new Date(d.datetime));

            let oneDayFailedChartConfig = { setFailedMsgGraphTooltipText: true }
            let xMax = d3.max(oneDayFailedChartData, d => TrafficGraphsController.addOneDayToDate(d.datetime));
            const oneDayFailedChart = new BarChart(
                { element: document.querySelector('.total_failed_sms_graph'), data: oneDayFailedChartData });
            oneDayFailedChart
                .setTitle("Total Failed Message(s) / day")
                .setXAxisLabel("Date (Y-M-D)")
                .setYAxisLabel("No. of Failed Message (s)")
                .setLegendLabel("total_errored")
                .setColorScheme("red")
                .setYLimit(yLimitFailed)
                .setXAxisTickFormat(dayDateFormatWithWeekdayName)
                .setTickValuesForXAxis(tickValuesForXAxis)
                .setXLimitByAddingOneDayDate(xMax)
                .setGridLinesId("failedGrid")
                .setBarsRightPadding()
                .setFactorToShiftBarsToRight()
                .setConfig(oneDayFailedChartConfig)
                .draw();
        }

        function draw10MinFailedGraph(yLimitFailed) {
            let _10minFailedChartData = JSON.parse(JSON.stringify(tenMinGraphFilteredData));
            _10minFailedChartData.forEach(function(d) {
                d.datetime = new Date(d.datetime);
                d.value = +d.total_errored;
            })  
            // Set Y axis limit to max of daily values or to the value inputted by the user
            if (isYLimitFailedManuallySet == false) {
                yLimitFailed = d3.max(_10minFailedChartData, d => d.value);
            }
            // Group data filtered by week daily and generate tick values for x axis
            let dataFilteredWeekGroupedDaily = d3
                .rollup(_10minFailedChartData, v => {
                    let firstTimestampOfDay = {}
                    firstTimestampOfDay["datetime"] = d3.min(v,d => d.datetime)
                    return firstTimestampOfDay
                }, d => d.day)
            // Convert Map to array of object
            dataFilteredWeekGroupedDaily = Array.from(dataFilteredWeekGroupedDaily, ([key, value]) => ({ key, value }));

            // Flatten nested data
            for (let entry in dataFilteredWeekGroupedDaily) {
                let valueList = dataFilteredWeekGroupedDaily[entry].value;
                for (let key in valueList) {
                    dataFilteredWeekGroupedDaily[entry][key] = valueList[key];
                }
                delete dataFilteredWeekGroupedDaily[entry]["value"];
                delete dataFilteredWeekGroupedDaily[entry]["key"];
            }
            const tickValuesForXAxis = dataFilteredWeekGroupedDaily.map(d => d.datetime);

            let _10minDayFailedChartConfig = { setFailedMsgGraphTooltipText: true }
            const _10minFailedChart = new BarChart(
                {element: document.querySelector('.total_failed_sms_graph'), data: _10minFailedChartData });
            _10minFailedChart
                .setTitle("Total Failed Message(s) / 10 minutes")
                .setXAxisLabel("Date (Y-M-D)")
                .setYAxisLabel("No. of Failed Message (s)")
                .setLegendLabel("total_errored")
                .setColorScheme("red")
                .setYLimit(yLimitFailed)
                .setXAxisTickFormat(timeFormat)
                .setTickValuesForXAxis(tickValuesForXAxis)
                .setGridLinesId("failedGrid")
                .setFactorToShiftBarsToRight()
                .setConfig(_10minDayFailedChartConfig)
                .draw();
        }

        // Update chart time unit on user selection
        d3.select("#buttonUpdateView10Minutes").on("click", () => {
            TrafficGraphsController.chartTimeUnit = "10min";
            updateView10Minutes(yLimitReceivedFiltered, yLimitSentFiltered, yLimitFailedFiltered);
        });

        d3.select("#buttonUpdateViewOneDay").on("click", () => {
            TrafficGraphsController.chartTimeUnit = "1day";
            updateViewOneDay(yLimitReceived, yLimitSent, yLimitFailed);
        });

        d3.select("#timeFrame").on("change", function() {
            let timeFrame = this.options[this.selectedIndex].value;
            if (timeFrame == "default") {
                TrafficGraphsController.tenMinGraphTimeframe = TIMEFRAME_WEEK; 
                TrafficGraphsController.oneDayGraphTimeframe = TIMEFRAME_MONTH;
                TrafficGraphsController.updateGraphs(data, projectName, operators, MNOColors)
            } else {
                TrafficGraphsController.tenMinGraphTimeframe = TrafficGraphsController.oneDayGraphTimeframe = timeFrame;
                TrafficGraphsController.updateGraphs(data, projectName, operators, MNOColors)
            }
        })

        // Draw received graph with user-selected y-axis limit
        d3.select("#buttonYLimitReceived").on("input", function() {
            isYLimitReceivedManuallySet = true;
            if (TrafficGraphsController.chartTimeUnit == "1day") {
                yLimitReceived = this.value;
                drawOneDayReceivedGraph(yLimitReceived);
            } else if (TrafficGraphsController.chartTimeUnit == "10min") {
                yLimitReceivedFiltered = this.value;
                draw10MinReceivedGraph(yLimitReceivedFiltered);
            }
        });

        // Draw sent graph with user-selected y-axis limit
        d3.select("#buttonYLimitSent").on("input", function() {
            isYLimitSentManuallySet = true;
            if (TrafficGraphsController.chartTimeUnit == "1day") {
                yLimitSent = this.value;
                drawOneDaySentGraph(yLimitSent);
            } else if (TrafficGraphsController.chartTimeUnit == "10min") {
                yLimitSentFiltered = this.value;
                draw10MinSentGraph(yLimitSentFiltered);
            }
        });

        // Draw failed graph with user-selected y-axis limit
        d3.select("#buttonYLimitFailed").on("input", function() {
            isYLimitFailedManuallySet = true;
            if (TrafficGraphsController.chartTimeUnit == "1day") {
                yLimitFailed = this.value;
                drawOneDayFailedGraph(yLimitFailed);
            }  else if (TrafficGraphsController.chartTimeUnit == "10min") {
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
                difference_minutes = (currentTime.getTime() - lastUpdateTimeStamp.getTime()) / 60000;
            if (difference_minutes > 20) {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", true);
            } else {
                d3.select("#lastUpdated").classed("text-stale-info alert alert-stale-info", false);
            }
        }
        if (TrafficGraphsController.lastUpdateTimer) {
            clearInterval(TrafficGraphsController.lastUpdateTimer);
        }
        TrafficGraphsController.lastUpdateTimer = setInterval(setLastUpdatedAlert, 1000);
    }
    static clearTimers() {
        if (TrafficGraphsController.lastUpdateTimer) {
            clearInterval(TrafficGraphsController.lastUpdateTimer);
            TrafficGraphsController.lastUpdateTimer = null;
        }
    }
}
