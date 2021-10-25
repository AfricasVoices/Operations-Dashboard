const plotSingleOperator = (graph, layer, transitionDuration) => {
    graph.class_keep = graph.clickedLegend;
    graph.idx = graph.legendIdentityArray.indexOf(graph.class_keep);

    // Erase all but selected bars by setting opacity to 0
    for (let i = 0; i < graph.legendIdentityArray.length; i++) {
        if (graph.legendIdentityArray[i] != graph.class_keep) {
            d3.selectAll(`.${graph.legendIdentityArray[i]}`)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 0);
        }
    }

    // Lower the bars to start on x-axis
    graph.y_orig = []; // to store original y-posn
    layer.selectAll("rect")._groups[graph.idx].forEach(function (d, i, n) {
        // Get height and y posn of base bar and selected bar
        let h_keep = d3.select(d).attr("height");
        let y_keep = d3.select(d).attr("y");
        // Store y_base in array to restore plot
        graph.y_orig.push(y_keep);

        let h_base, y_base;
        layer.selectAll("rect")._groups[0].forEach(function (d, i, n) {
            h_base = d3.select(d).attr("height");
            y_base = d3.select(d).attr("y");
        });

        let h_shift = h_keep - h_base;
        let y_new = y_base - h_shift;

        // Reposition selected bars
        d3.select(d).transition()
            .ease(d3.easeBounce)
            .duration(transitionDuration)
            .delay(transitionDuration/3.3).attr("y", y_new);
    });
    return graph;
};

const restorePlot = (graph, layer) => {
    layer.selectAll("rect")._groups[graph.idx].forEach(function (d, i, n) {
        d3.select(d).transition().duration(500).attr("y", graph.y_orig[i]);
    });

    //restore opacity of erased bars
    for (let i = 0; i < graph.legendIdentityArray.length; i++) {
        if (graph.legendIdentityArray[i] != graph.class_keep) {
            d3.selectAll(`.${graph.legendIdentityArray[i]}`).transition().duration(500).delay(150).style("opacity", 1);
        }
    }
};

const cellOverHandler = (target, graph) => {
    let legendHovered = d3.select(target).datum().replace(/\s/g, "");
    if (graph.activeLink === "0") d3.select(target).style("cursor", "pointer");
    else {
        if (graph.activeLink === legendHovered) {
            d3.select(target).style("cursor", "pointer");
        } else d3.select(target).style("cursor", "auto");
    }
};

const cellClickHandler = (target, graph, layer) => {
    graph.clickedLegend = d3.select(target).datum().replace(/\s/g, ""); // to control legend selections
    if (graph.activeLink === "0") {
        //nothing selected, turn on this selection
        graph.activeLink = graph.clickedLegend;
        graph.clickedNode = target;

        let operatorsLegend = d3.select(target.parentNode).selectAll("rect");
        operatorsLegend.each(function (legend) {
            let cell = d3.select(this).datum().replace(/\s/g, "");
            graph.legendIdentityArray.push(cell);
            if (cell !== graph.clickedLegend) {
                d3.select(this).style("opacity", 0.5);
            } else if (cell == graph.clickedLegend) {
                d3.select(this).style("stroke", "black").style("stroke-width", 2);
            }
        });
        graph = plotSingleOperator(graph, layer, 500);
    } else {
        //deactivate
        if (graph.activeLink === graph.clickedLegend) {
            //active square selected; turn it OFF
            graph.activeLink = "0"; //reset

            let operatorsLegend = d3.select(target.parentNode).selectAll("rect");
            operatorsLegend.each(function (legend) {
                let cell = d3.select(this).datum().replace(/\s/g, "");
                if (cell !== graph.clickedLegend) {
                    d3.select(this).style("opacity", 1);
                }
                if (cell == graph.clickedLegend) {
                    d3.select(this).style("stroke", "none");
                }
            });
            //restore plot to original
            restorePlot(graph, layer);
        }
    } //end graph.activeLink check
    return graph;
};

const resetSelectedLegend = (graphs) => {
    let updatedGraphs = [];
    graphs.forEach(function (graph) {
        if (graph.clickedNode) {
            let operatorsLegend2 = d3.select(graph.clickedNode.parentNode).selectAll("rect");
            operatorsLegend2.each(function (legend) {
                let cell = d3.select(this).datum().replace(/\s/g, "");
                if (cell !== graph.clickedLegend) {
                    d3.select(this).style("opacity", 1);
                }
                if (cell == graph.clickedLegend) {
                    d3.select(this).style("stroke", "none");
                }
            });
        }
        graph.activeLink = "0";
        updatedGraphs.push(graph);
    });
    return updatedGraphs;
};

export { plotSingleOperator, cellOverHandler, cellClickHandler, resetSelectedLegend };
