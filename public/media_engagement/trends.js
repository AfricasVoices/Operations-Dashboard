//Perform Authentication then update data 
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
      console.log("Attempting to bind: " + user.email)
      const mediadb = firebase.firestore();
      const settings = { timestampsInSnapshots: true };
      mediadb.settings(settings);
      var data = [];
      var offset = new Date()
      timerange = 30
      offset.setDate(offset.getDate() - timerange)
      var iso = d3.utcFormat("%Y-%m-%dT%H:%M:%S+%L");
      offsetString = iso(offset)

      mediadb.collection('/metrics/rapid_pro/IMAQAL/').where("datetime", ">", offsetString).onSnapshot(res => {
          console.log(res)
          // Update data every time it changes in firestore
          res.docChanges().forEach(change => {

              const doc = { ...change.doc.data(), id: change.doc.id };

              switch (change.type) {
                  case 'added':
                      data.push(doc);
                      break;
                  case 'modified':
                      const index = data.findIndex(item => item.id == doc.id);
                      data[index] = doc;
                      break;
                  case 'removed':
                      data = data.filter(item => item.id !== doc.id);
                      break;
                  default:
                      break;
              }
          });
          update(data);
          console.log(data)
      });
      console.log('Bind Successful');
  } else {
      window.location.replace('auth.html')
  }
});
const TIMEFRAME_WEEK = 7;
const TIMEFRAME_MONTH = 30;
var chartTimeUnit = "10min";
var isYLimitReceivedManuallySet = false;
var isYLimitSentManuallySet = false;

const update = (data) => {
  let operators = new Set()

  // var dayDateFormat = d3.timeFormat("%Y-%m-%d")	
  var dayDateFormat = d3.timeFormat('%b-%Y');

  // format the data  
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

  // if button == received
  itemsNotFormatted = dailyReceivedTotal
  console.log(dailyReceivedTotal[1])

  function convertToCSV(objArray) {
      var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
      var str = '';
  
      for (var i = 0; i < array.length; i++) {
          var line = '';
          for (var index in array[i]) {
              if (line != '') line += ','
  
              line += array[i][index];
          }
  
          str += line + '\r\n';
      }
  
      return str;
  }

  function exportCSVFile(headers, items, fileTitle) {
      if (headers) {
          items.unshift(headers);
      }
  
      // Convert Object to JSON
      var jsonObject = JSON.stringify(items);
  
      var csv = convertToCSV(jsonObject);
  
      var exportedFilenmae = fileTitle + '.csv' || 'export.csv';
  
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) { // IE 10+
          navigator.msSaveBlob(blob, exportedFilenmae);
      } else {
          var link = document.createElement("a");
          if (link.download !== undefined) { // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", exportedFilenmae);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      }
  }
  
  var headers = {
      // model: 'Phone Model'.replace(/,/g, ''), // remove commas to avoid errors
      type: "type",
      day: "Day",
      NC: "NC_IMAQAL",
      telegram: "telegram_IMAQAL",
      hormud: "hormud_IMAQAL",
      nationlink: "nationlink_IMAQAL",
      somnet: "somnet_IMAQAL",
      somtel: "somtel_IMAQAL",
      telesom: "telesom_IMAQAL",
      golis: "golis_IMAQAL",
      total: "total_IMAQAL",
  };

  var itemsFormatted = [];

  // format the data
  itemsNotFormatted.forEach((item) => {
      itemsFormatted.push({
          type: "IMAQAL",
          day: item.day,
          NC: item.NC_received,
          telegram: item.telegram_received,
          hormud: item.hormud_received,
          nationlink: item.nationlink_received,
          somnet: item.somnet_received,
          somtel: item.somtel_received,
          telesom: item.telesom_received,
          golis: item.golis_received,
          total: item.total_received,
          // model: item.model.replace(/,/g, ''), // remove commas to avoid errors
      });
  });

  var fileTitle = 'trends'; // or 'my-unique-title'

  document.querySelector("#download_data").addEventListener('click', function() {
    exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download
  });
}


// set the dimensions and margins of the graph
var margin = {top: 20, right: 50, bottom: 30, left: 50},
    width = 1250 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

// parse the date / time
var parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the lines
var valueline = d3.line().x(d => x(d.Day)).y(d => y(d.NC_IMAQAL));
var valueline2 = d3.line().x(d => x(d.Day)).y(d => y(d.telegram_IMAQAL));
var valueline3 = d3.line().x(d => x(d.Day)).y(d => y(d.hormud_IMAQAL));
var valueline4 = d3.line().x(d => x(d.Day)).y(d => y(d.golis_IMAQAL));
var valueline5 = d3.line().x(d => x(d.Day)).y(d => y(d.nationlink_IMAQAL));
var valueline6 = d3.line().x(d => x(d.Day)).y(d => y(d.somnet_IMAQAL));
var valueline7 = d3.line().x(d => x(d.Day)).y(d => y(d.somtel_IMAQAL));
var valueline8 = d3.line().x(d => x(d.Day)).y(d => y(d.telesom_IMAQAL));

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var svg2 = d3.select("#chart2").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");


// Get the data
d3.csv("trends.csv", function(error, data) {
  if (error) throw error;

  // format the data
  data.forEach(function(d) {
      d.Day = new Date(d.Day);
      d.NC_IMAQAL = +d.NC_IMAQAL;
	  d.telegram_IMAQAL = +d.telegram_IMAQAL;
      d.hormud_IMAQAL = +d.hormud_IMAQAL;
      d.golis_IMAQAL = +d.golis_IMAQAL;
      d.nationlink_IMAQAL = +d.nationlink_IMAQAL;
      d.somnet_IMAQAL = +d.somnet_IMAQAL;
      d.somtel_IMAQAL = +d.somtel_IMAQAL;
      d.telesom_IMAQAL = +d.telesom_IMAQAL;
  });

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) { return d.Day; }));
  y.domain([0, d3.max(data, function(d) {
      return Math.max(d.NC_IMAQAL, d.telegram_IMAQAL,
        d.hormud_IMAQAL, d.golis_IMAQAL, d.nationlink_IMAQAL, d.somnet_IMAQAL,
        d.somtel_IMAQAL, d.telesom_IMAQAL); })]);

  // Add the valuelines path.
  svg.append("path").data([data]).style("stroke", "black").attr("class", "line").attr("d", valueline);
  svg.append("path").data([data]).attr("class", "line").style("stroke", "red").attr("d", valueline2);
  svg.append("path").data([data]).attr("class", "line").style("stroke", "blue").attr("d", valueline3);
  svg.append("path").data([data]).attr("class", "line").style("stroke", "green").attr("d", valueline4);
  svg.append("path").data([data]).attr("class", "line").style("stroke", "brown").attr("d", valueline5);
  svg.append("path").data([data]).attr("class", "line").style("stroke", "yellow").attr("d", valueline6);
  svg.append("path").data([data]).attr("class", "line").style("stroke", "purple").attr("d", valueline7);
  svg.append("path").data([data]).attr("class", "line").style("stroke", "orange").attr("d", valueline8);

  // Add the X Axis
  svg.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));

  // Add the Y Axis
  svg.append("g").call(d3.axisLeft(y));

    // Handmade legend
    svg.append("circle").attr("cx",1100).attr("cy",40).attr("r", 8).style("fill", "black")
    svg.append("circle").attr("cx",1100).attr("cy",60).attr("r", 8).style("fill", "red")
    svg.append("circle").attr("cx",1100).attr("cy",80).attr("r", 8).style("fill", "blue")
    svg.append("circle").attr("cx",1100).attr("cy",100).attr("r", 8).style("fill", "green")
    svg.append("circle").attr("cx",1100).attr("cy",120).attr("r", 8).style("fill", "brown")
    svg.append("circle").attr("cx",1100).attr("cy",140).attr("r", 8).style("fill", "yellow")
    svg.append("circle").attr("cx",1100).attr("cy",160).attr("r", 8).style("fill", "purple")
    svg.append("circle").attr("cx",1100).attr("cy",180).attr("r", 8).style("fill", "orange")
    svg.append("text").attr("x", 1010).attr("y", 45).text("NC").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 1010).attr("y", 65).text("telegram").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 1010).attr("y", 85).text("hormud").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 1010).attr("y", 105).text("golis").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 1010).attr("y", 125).text("nationlink").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 1010).attr("y", 145).text("somnet").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 1010).attr("y", 165).text("somtel").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 1010).attr("y", 185).text("telesom").style("font-size", "15px").attr("alignment-baseline","middle")

});


// Get the data
d3.csv("trends.csv", function(error, data) {
    if (error) throw error;
  
    // format the data
    data.forEach(function(d) {
        d.Day = new Date(d.Day);
        d.NC_IMAQAL = +d.NC_IMAQAL;
        d.telegram_IMAQAL = +d.telegram_IMAQAL;
        d.hormud_IMAQAL = +d.hormud_IMAQAL;
        d.golis_IMAQAL = +d.golis_IMAQAL;
        d.nationlink_IMAQAL = +d.nationlink_IMAQAL;
        d.somnet_IMAQAL = +d.somnet_IMAQAL;
        d.somtel_IMAQAL = +d.somtel_IMAQAL;
        d.telesom_IMAQAL = +d.telesom_IMAQAL;
    });
  
    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.Day; }));
    y.domain([0, d3.max(data, function(d) {
        return Math.max(d.NC_IMAQAL, d.telegram_IMAQAL,
          d.hormud_IMAQAL, d.golis_IMAQAL, d.nationlink_IMAQAL, d.somnet_IMAQAL,
          d.somtel_IMAQAL, d.telesom_IMAQAL); })]);
  
    // Add the valuelines path.
    svg2.append("path").data([data]).style("stroke", "black").attr("class", "line").attr("d", valueline);
    svg2.append("path").data([data]).attr("class", "line").style("stroke", "red").attr("d", valueline2);
    svg2.append("path").data([data]).attr("class", "line").style("stroke", "blue").attr("d", valueline3);
    svg2.append("path").data([data]).attr("class", "line").style("stroke", "green").attr("d", valueline4);
    svg2.append("path").data([data]).attr("class", "line").style("stroke", "brown").attr("d", valueline5);
    svg2.append("path").data([data]).attr("class", "line").style("stroke", "yellow").attr("d", valueline6);
    svg2.append("path").data([data]).attr("class", "line").style("stroke", "purple").attr("d", valueline7);
    svg2.append("path").data([data]).attr("class", "line").style("stroke", "orange").attr("d", valueline8);
  
    // Add the X Axis
    svg2.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));
  
    // Add the Y Axis
    svg2.append("g").call(d3.axisLeft(y));
  
      // Handmade legend
      svg2.append("circle").attr("cx",1100).attr("cy",40).attr("r", 8).style("fill", "black")
      svg2.append("circle").attr("cx",1100).attr("cy",60).attr("r", 8).style("fill", "red")
      svg2.append("circle").attr("cx",1100).attr("cy",80).attr("r", 8).style("fill", "blue")
      svg2.append("circle").attr("cx",1100).attr("cy",100).attr("r", 8).style("fill", "green")
      svg2.append("circle").attr("cx",1100).attr("cy",120).attr("r", 8).style("fill", "brown")
      svg2.append("circle").attr("cx",1100).attr("cy",140).attr("r", 8).style("fill", "yellow")
      svg2.append("circle").attr("cx",1100).attr("cy",160).attr("r", 8).style("fill", "purple")
      svg2.append("circle").attr("cx",1100).attr("cy",180).attr("r", 8).style("fill", "orange")
      svg2.append("text").attr("x", 1010).attr("y", 45).text("NC").style("font-size", "15px").attr("alignment-baseline","middle")
      svg2.append("text").attr("x", 1010).attr("y", 65).text("telegram").style("font-size", "15px").attr("alignment-baseline","middle")
      svg2.append("text").attr("x", 1010).attr("y", 85).text("hormud").style("font-size", "15px").attr("alignment-baseline","middle")
      svg2.append("text").attr("x", 1010).attr("y", 105).text("golis").style("font-size", "15px").attr("alignment-baseline","middle")
      svg2.append("text").attr("x", 1010).attr("y", 125).text("nationlink").style("font-size", "15px").attr("alignment-baseline","middle")
      svg2.append("text").attr("x", 1010).attr("y", 145).text("somnet").style("font-size", "15px").attr("alignment-baseline","middle")
      svg2.append("text").attr("x", 1010).attr("y", 165).text("somtel").style("font-size", "15px").attr("alignment-baseline","middle")
      svg2.append("text").attr("x", 1010).attr("y", 185).text("telesom").style("font-size", "15px").attr("alignment-baseline","middle")
  
  });