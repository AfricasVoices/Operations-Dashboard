import { DataController } from "./data_controller.js";

export class TrafficMetricsController {
    static updateTotals(metrics) {
        let { data, dateRange, projectCollection: projectName, operators } = metrics;

        flatpickr("#datetime-picker", {
            mode: "range",
            maxDate: "today",
            dateFormat: "Y-m-d",
            defaultDate: [...dateRange],
            onChange: function (selectedDates, dateStr, instance) {
                if (selectedDates.length > 1) {
                    DataController.projectTrafficDataMetrics(
                        projectName,
                        TrafficMetricsController.updateTotals,
                        selectedDates
                    );
                }
            },
        });

        let totalReceived = d3.sum(data, (d) => d.total_received),
            totalSent = d3.sum(data, (d) => d.total_sent);

        d3.select("#project-name").text(projectName);
        d3.select("#total-received").text(totalReceived.toLocaleString());
        d3.select("#total-sent").text(totalSent.toLocaleString());

        const metricsTable = document.getElementById("operator-metrics");
        while (metricsTable.firstChild) {
            metricsTable.removeChild(metricsTable.firstChild);
        }
        let html = "<tr>%operator_metrics%</tr>";
        operators.forEach((operator) => {
            let tableData = `<td>${operator}</td>
                <td>${d3.sum(data, (d) => d[`${operator}_received`]).toLocaleString()}</td>
                <td>${d3.sum(data, (d) => d[`${operator}_sent`]).toLocaleString()}</td>`;
            let newHtml = html.replace("%operator_metrics%", tableData);
            metricsTable.insertAdjacentHTML("beforeend", newHtml);
        });
        metricsTable.insertAdjacentHTML(
            "afterbegin",
            "<th>Operators</th><th>Incoming</th><th>Outgoing</th>"
        );
    }

    static displayATCredits(data) {
        const node = d3.select("#AT-units-bal");
        if (typeof data == "string") {
            node.text(data);
            return;
        }
        if (Array.isArray(data) && data.length) {
            let { balance } = data[0];
            let [currency, amount] = balance.split(" ");
            let { language } = navigator;
            node.text(
                `${Number(amount).toLocaleString(language, { style: "currency", currency })}`
            );
        } else {
            node.text("No Data Available") 
        }
    }
}
