export class CodingProgressTableController {
    static updateCodingProgressTable(codingProgressData) {
        let data = codingProgressData.data,
            lastUpdate = codingProgressData.lastUpdate;

        // Set last updated timestamp in UI
        d3.select("#last-update").text(lastUpdate);

        // Default sorting and column filter information
        if (!CodingProgressTableController.sortInfoArray)
            CodingProgressTableController.sortInfoArray = [{ column: "Done", order: "ascending" }];

        if (!CodingProgressTableController.keyword) CodingProgressTableController.keyword = "";

        // Track checkbox state
        if (!CodingProgressTableController.selectedColumns) {
            CodingProgressTableController.selectedColumns = [];
            d3.selectAll("input[type=checkbox]").property("checked", true);
        } else {
            d3.selectAll(".form-check-label").each(function () {
                let text = this.innerText.trim();
                if (!CodingProgressTableController.selectedColumns.includes(text)) {
                    d3.select(this.previousElementSibling).property("checked", true);
                }
            });
        }

        // Latest sorting information
        let sortInfo = CodingProgressTableController.sortInfoArray.slice(-1)[0];

        // Invoke `transform` function with column to be sorted on page load
        transform(sortInfo.column);

        // Function used to generate coding progress table
        function transform(column, updatedSortInfo = "") {
            if (typeof updatedSortInfo === "object") sortInfo = updatedSortInfo;

            d3.select("tbody").selectAll("tr").remove();
            d3.select("thead").selectAll("tr").remove();

            // Table Header
            d3.select("thead").append('tr')
                .attr("class", "table-heading")
                .selectAll("th")
                .data(CodingProgressTableController.jsonToArray(data[0]))
                .enter()
                .append("th")
                .on("click", (event, d) => {
                    CodingProgressTableController.saveSortInfo(d[0]);
                    let latestSortInfo = CodingProgressTableController.sortInfoArray.slice(-1)[0];
                    transform(d[0], latestSortInfo);
                })
                .text((d) => d[0]);

            // Table Rows
            let tr = d3.select("tbody").selectAll("tr")
                .data(data)
                .enter().append("tr")
                .sort((a, b, order = sortInfo.order) => a == null || b == null ? 0 : 
                    typeof a[column] === "string" && typeof b[column] === "string" ? 
                        CodingProgressTableController.stringCompare(a[column], b[column], order) :
                        CodingProgressTableController.sortingTieBreakers(
                            a[column], b[column], a["Dataset"], b["Dataset"], order)
                );

            // Table Cells
            let td = tr.selectAll("td")
                .data(d => CodingProgressTableController.jsonToArray(d, "td"))
                .enter().append("td")
            
            // Filter Dataset column from columns & append text to td
            td.filter((d, i) => d[0] !== "Dataset" && i !== 0)
            .attr('class', d => Number.isInteger(d[1]) ? "integer" : 
                Math.ceil(d[1]) === d[1] ? "float" : "dash")
            .text(d => Number.isNaN(d[1]) ? "-" : 
                    Number.isInteger(d[1]) ? ["Done", "WS %", "NC %"].includes(d[0]) ? `${d[1]}%` : d[1].toLocaleString() :
                    ["Done", "WS %", "NC %"].includes(d[0]) ? `${d[1].toFixed(2)}%` : d[1].toFixed(2))

            // Select Dataset Column, create a link & append text to td
            td.filter((d, i) => d[0] === "Dataset" && i === 0)
                .append("a")
                .attr("href", d => `https://web-coda.firebaseapp.com/?dataset=${d[1]}`)
                .attr("target", "_blank")
                .text((d) => d[1]);

            // Filter table to remain with "Done" column
            td.filter((d, i) => d[0] === "Done").each((d, i, n) => {
                // Select Table Row
                let parentNode = d3.select(n[i].parentNode);
                // Select Table Data and access data bound to the node
                let tableData = d3.select(n[i]).data()[0][1];
                if (parseFloat(tableData) === 0) {
                    parentNode.attr("class", "coding-notstarted");
                } else if (parseFloat(tableData) > 0 && parseFloat(tableData) <= 25) {
                    parentNode.attr("class", "coding-below25");
                } else if (parseFloat(tableData) > 25 && parseFloat(tableData) <= 50) {
                    parentNode.attr("class", "coding-above25");
                } else if (parseFloat(tableData) > 50 && parseFloat(tableData) <= 75) {
                    parentNode.attr("class", "coding-above50");
                } else if (parseFloat(tableData) > 75 && parseFloat(tableData) < 100) {
                    parentNode.attr("class", "coding-above75");
                } else {
                    parentNode.attr("class", "coding-complete");
                }
            });

            // Attach event listeners to columns' checkbox & ability to filter table
            d3.selectAll("input[type=checkbox]").on("change", (event, d) => {
                if (d3.select(event.currentTarget).property("checked")) {
                    CodingProgressTableController.selectedColumns = CodingProgressTableController.selectedColumns.filter(
                        e => e !== event.currentTarget.nextElementSibling.innerText.trim());
                    transform(column, sortInfo.order)
                } else {
                    CodingProgressTableController.selectedColumns.push(event.currentTarget.nextElementSibling.innerText.trim())
                    transform(column, sortInfo.order)
                }
            });

            // Enable the ability to filter table by selected keyword in dropdown menu 
            d3.select("#keyword").on("change", (event, d) => {
                CodingProgressTableController.keyword = event.currentTarget.options[event.currentTarget.selectedIndex].innerText.trim(); 
                transform(column, sortInfo.order);
            });

            // Enable the ability to filter table by user's keyword input
            let searchInputNode = document.getElementById("input-keyword");
            d3.select("button#search").on("click", () => {
                let value = searchInputNode.value.trim();
                if (value) {
                    CodingProgressTableController.keyword = value;
                    transform(column, sortInfo.order);
                } else {
                    alert("Enter keyword...");
                }
            });
            searchInputNode.addEventListener("keydown", function onEvent(event) {
                if (event.key === "Enter") {
                    let value = searchInputNode.value.trim();
                    if (value) {
                        CodingProgressTableController.keyword = value;
                        transform(column, sortInfo.order);
                    } else {
                        alert("Enter keyword...");
                    }
                }
            });

            // View all datasets on clicking `view all` button
            d3.select("button#reset").on("click", () => {
                CodingProgressTableController.keyword = "";
                transform(column, sortInfo.order);
                // Reset select value to default
                let options = document.querySelectorAll("#keyword option");
                for (const option of options) {
                    option.selected = option.defaultSelected;
                }
            });

            // Hide `view all` button if all datasets are being displayed
            if (CodingProgressTableController.keyword) {
                d3.select("button#reset").style("display", "block");
            } else if (CodingProgressTableController.keyword == "") {
                d3.select("button#reset").style("display", "none");
            }
        }
    }

    static saveSortInfo(column) {
        let sortInfo = {},
            previousColumnSorted,
            previousSortOrder;
        sortInfo["column"] = column;
        previousColumnSorted = CodingProgressTableController.sortInfoArray.slice(-1)[0].column;
        previousSortOrder = CodingProgressTableController.sortInfoArray.slice(-1)[0].order;
        if (column == previousColumnSorted) {
            if (previousSortOrder == "ascending") {
                sortInfo["order"] = "descending";
            } else {
                sortInfo["order"] = "ascending";
            }
        } else {
            sortInfo["order"] = "ascending";
        }
        CodingProgressTableController.sortInfoArray.push(sortInfo);
    }

    static stringCompare(a, b, order) {
        if (order === "ascending") return a.localeCompare(b, "en", { sensitivity: "base" });
        return b.localeCompare(a, "en", { sensitivity: "base" });
    }

    static sortNumber(a, b, order) {
        if (order === "ascending") return a - b || isNaN(a) - isNaN(b);
        return b - a || isNaN(b) - isNaN(a);
    }

    static sortingTieBreakers(a, b, a1, b1, order) {
        // Sort table by number, then alphabetically (as a tie-breaker)
        if (order === "ascending") {
            return (
                CodingProgressTableController.sortNumber(a, b, order) ||
                CodingProgressTableController.stringCompare(a1, b1, order)
            );
        }
        return (
            CodingProgressTableController.sortNumber(a, b, order) ||
            CodingProgressTableController.stringCompare(a1, b1, order)
        );
    }

    static jsonKeyValueToArray = (k, v) => [k, v];

    static jsonToArray(json, tableSection = "") {
        let arr = [];
        for (const key in json) {
            // Filter columns
            if (CodingProgressTableController.selectedColumns.includes(key)) { continue }
            // Filter rows
            if (tableSection == "td") {
                if (CodingProgressTableController.keyword != "") {
                    const terms = CodingProgressTableController.keyword.split(/_|-| /).map(v => v.toLowerCase()),
                        dataset = json["Dataset"].toLowerCase(),
                        filter_result = terms.every(term => dataset.includes(term));
                    if (!filter_result) continue
                }
            }
            if (json.hasOwnProperty(key)) {
                arr.push(CodingProgressTableController.jsonKeyValueToArray(key, json[key]));
            }
        }
        return arr;
    }
}
