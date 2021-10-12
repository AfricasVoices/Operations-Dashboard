import { TrafficGraphsController } from "../controllers/traffic_graphs_controller.js";

function plotSingleReceivedMsgGraph(ReceivedMsgGraph, transition = true) {
    let layer;
    if (TrafficGraphsController.chartTimeUnit == "1day") {
        layer = ReceivedMsgGraph.receivedLayer;
    }
    if (TrafficGraphsController.chartTimeUnit == "10min") {
        layer = ReceivedMsgGraph.receivedLayer10min;
    }

    ReceivedMsgGraph.class_keep = ReceivedMsgGraph.clickedLegend;
    ReceivedMsgGraph.idx = ReceivedMsgGraph.legendIdentityArray.indexOf(ReceivedMsgGraph.class_keep);

    // Erase all but selected bars by setting opacity to 0
    for (let i = 0; i < ReceivedMsgGraph.legendIdentityArray.length; i++) {
        if (ReceivedMsgGraph.legendIdentityArray[i] != ReceivedMsgGraph.class_keep) {
            if (!transition) {
                d3.selectAll(`.${ReceivedMsgGraph.legendIdentityArray[i]}`).style("opacity", 0);
            } else {
                d3.selectAll(`.${ReceivedMsgGraph.legendIdentityArray[i]}`)
                    .transition()
                    .duration(1000)
                    .style("opacity", 0);
            }
        }
    }

    // Lower the bars to start on x-axis
    ReceivedMsgGraph.y_orig = []; // to store original y-posn
    layer.selectAll("rect")._groups[ReceivedMsgGraph.idx].forEach(function (d, i, n) {
        // Get height and y posn of base bar and selected bar
        let h_keep = d3.select(d).attr("height");
        let y_keep = d3.select(d).attr("y");
        // Store y_base in array to restore plot
        ReceivedMsgGraph.y_orig.push(y_keep);

        let h_base, y_base;
        layer.selectAll("rect")._groups[0].forEach(function (d, i, n) {
            h_base = d3.select(d).attr("height");
            y_base = d3.select(d).attr("y");
        });

        let h_shift = h_keep - h_base;
        let y_new = y_base - h_shift;

        // Reposition selected bars
        if (!transition) {
            d3.select(d).attr("y", y_new);
        } else {
            d3.select(d).transition().ease(d3.easeBounce).duration(1000).delay(750).attr("y", y_new);
        }
    });
    return ReceivedMsgGraph;
}

function restoreReceivedMsgGraphPlot(ReceivedMsgGraph) {
    let layer;
    if (TrafficGraphsController.chartTimeUnit == "1day") {
        layer = ReceivedMsgGraph.receivedLayer;
    }
    if (TrafficGraphsController.chartTimeUnit == "10min") {
        layer = ReceivedMsgGraph.receivedLayer10min;
    }

    layer.selectAll("rect")._groups[ReceivedMsgGraph.idx].forEach(function (d, i, n) {
        d3.select(d).transition().duration(1000).attr("y", ReceivedMsgGraph.y_orig[i]);
    });

    //restore opacity of erased bars
    for (let i = 0; i < ReceivedMsgGraph.legendIdentityArray.length; i++) {
        if (ReceivedMsgGraph.legendIdentityArray[i] != ReceivedMsgGraph.class_keep) {
            d3.selectAll(`.${ReceivedMsgGraph.legendIdentityArray[i]}`)
                .transition()
                .duration(1000)
                .delay(750)
                .style("opacity", 1);
        }
    }
}

function plotSingleSentMsgGraph(SentMsgGraph, transition = true) {
    let layer;
    if (TrafficGraphsController.chartTimeUnit == "1day") {
        layer = SentMsgGraph.sentLayer;
    }
    if (TrafficGraphsController.chartTimeUnit == "10min") {
        layer = SentMsgGraph.sentLayer10min;
    }

    SentMsgGraph.class_keep = SentMsgGraph.clickedLegend;
    SentMsgGraph.idx = SentMsgGraph.legendIdentityArray.indexOf(SentMsgGraph.class_keep);

    // Erase all but selected bars by setting opacity to 0
    for (let i = 0; i < SentMsgGraph.legendIdentityArray.length; i++) {
        if (SentMsgGraph.legendIdentityArray[i] != SentMsgGraph.class_keep) {
            if (!transition) {
                d3.selectAll(`.${SentMsgGraph.legendIdentityArray[i]}`).style("opacity", 0);
            } else {
                d3.selectAll(`.${SentMsgGraph.legendIdentityArray[i]}`).transition().duration(1000).style("opacity", 0);
            }
        }
    }

    // Lower the bars to start on x-axis
    SentMsgGraph.y_orig = []; // to store original y-posn
    layer.selectAll("rect")._groups[SentMsgGraph.idx].forEach(function (d, i, n) {
        // Get height and y posn of base bar and selected bar
        let h_keep = d3.select(d).attr("height");
        let y_keep = d3.select(d).attr("y");
        // Store y_base in array to restore plot
        SentMsgGraph.y_orig.push(y_keep);

        let h_base, y_base;
        layer.selectAll("rect")._groups[0].forEach(function (d, i, n) {
            h_base = d3.select(d).attr("height");
            y_base = d3.select(d).attr("y");
        });

        let h_shift = h_keep - h_base;
        let y_new = y_base - h_shift;

        // Reposition selected bars
        if (!transition) {
            d3.select(d).attr("y", y_new);
        } else {
            d3.select(d).transition().ease(d3.easeBounce).duration(1000).delay(750).attr("y", y_new);
        }
    });
    return SentMsgGraph;
}

function restoreSentMsgGraphPlot(SentMsgGraph) {
    let layer;
    if (TrafficGraphsController.chartTimeUnit == "1day") {
        layer = SentMsgGraph.sentLayer;
    }
    if (TrafficGraphsController.chartTimeUnit == "10min") {
        layer = SentMsgGraph.sentLayer10min;
    }

    layer.selectAll("rect")._groups[SentMsgGraph.idx].forEach(function (d, i, n) {
        d3.select(d).transition().duration(1000).attr("y", SentMsgGraph.y_orig[i]);
    });

    //restore opacity of erased bars
    for (let i = 0; i < SentMsgGraph.legendIdentityArray.length; i++) {
        if (SentMsgGraph.legendIdentityArray[i] != SentMsgGraph.class_keep) {
            d3.selectAll(`.${SentMsgGraph.legendIdentityArray[i]}`)
                .transition()
                .duration(1000)
                .delay(750)
                .style("opacity", 1);
        }
    }
}

export { plotSingleReceivedMsgGraph, restoreReceivedMsgGraphPlot, plotSingleSentMsgGraph, restoreSentMsgGraphPlot };
