var Grapher = function(id, data, groups){
  this.id = id;
  this.data = data;
  this.groups = groups;
}

Grapher.prototype.init = function(){
  this.enableGraph();
}

Grapher.prototype.enableGraph = function(){
  $("#"+this.id).click($.proxy(function(){
    if($(event.currentTarget).parent().hasClass('disabled')){
      giveFeedback("You need to filter records by selecting one of your custom editors in order to be able to create graphs!")
    }else{
      this.render();
    }
  }, this));
}

Grapher.prototype.render = function(){
  makeAlertWindow(this.prepareDialog().join(""), "Graph", 900, 600, "graph-dialog", 5000, "middle", "");
  $("#graph-frame").css("float", "left");
  $("#graph-frame").css("width", "500px");
  $("#graph-frame").css("height", "500px");
  $("#graph-data").css("float", "right");
  this.enableGraphCreation(this.prepareData());
  this.enableSaveGraph();
  this.enableGraphTypeChange();
}

/**
 * function for preparing the dialog window where the user can create his
 * graphs
 */
Grapher.prototype.prepareDialog = function(){
  var html = new Array();
  html.push('<div><div id="graph-frame"></div>');
  html.push('<div id="graph-data">');
  html.push('Chart type: <br>\n');
  html.push('<select id="graph-kind">\n');
  html.push('<option value="scatter">Scatterplot</option>\n');
  html.push('<option value="bar">Bar chart</option>\n');
  html.push('<option value="pie">Pie chart</option>\n');
  html.push('</select>\n');
  html.push('<br>');
  html = html.concat(this.prepareAxis('x'));
  html.push('<br>');
  html = html.concat(this.prepareAxis('y'));
  html.push('<br>');
  html = html.concat(this.prepareGroupList());
  html.push('<br>');
  html.push('<button id="create-graph">Create Graph</button>\n');
  html.push('<button id="save-graph">Save Graph</button>\n');
  html.push('</div>\n');
  html.push('</div>\n');
  return html;
}

/**
 * functuon for creating a select menu of the elements tha can be part of
 * the select menu for creating a graph
 */
Grapher.prototype.prepareAxis = function(ax){
  var html = new Array();
  html.push(ax+': <br><select class="graph-parameters" id="parameters-'+ax+'">\n');
  html.push('<option value="i">record name</option>\n');
  for(var i=0; i< this.data[0].fields.length; i++){
    html.push('<option value="'+this.data[0].fields[i].label+'">'+this.data[0].fields[i].label+'</option>');
  }
  html.push('</select>\n');
  return html;
}

Grapher.prototype.prepareGroupList = function(){
  var html = new Array();
  html.push('group by: <br><select class="graph-parameters" id="parameters-group">\n');
  for(var i in this.groups){
    html.push('<option value="'+i+'">'+i+'</option>');
  }
  html.push('</select>\n');
  return html;
}

/**
 * function that enables the action of creating a graph and displaying it on the
 * dialog window.
 */
Grapher.prototype.enableGraphCreation = function(data){
  $("#create-graph").click($.proxy(function(event){
    var xaxis = $("#parameters-x").val();
    var yaxis = $("#parameters-y").val();
    var group = $("#parameters-group").val();
    var type = $("#graph-kind").val();
    $("#graph-frame").empty();
    this.createGraph[type].apply(this, [data, xaxis, yaxis, group]);

  }, this));
}

Grapher.prototype.enableGraphTypeChange = function(){
  $("#graph-kind").change($.proxy(function(event){
    if($(event.currentTarget).val() === "bar"){
      $("#parameters-group").html(this.prepareAxis('y'));
      $("#parameters-y").html('<option value="frequency">frequency</option><option value="mv">mean value</option>');
    }else if($(event.currentTarget).val() === "pie"){
      $("#parameters-group").html(this.prepareAxis('y'));
      $("#parameters-y").html('<option value="frequency">frequency</option>');
    }else{
      $("#parameters-y").html(this.prepareAxis('y'));
      $("#parameters-group").html(this.prepareGroupList());
    }
  }, this));
}

/**
 * function for preparing the data in a format that can be used
 * for d3 library. It basically checks if a value is number
 * and then store it as a number for being used properly
 * in stats graphs
 */
Grapher.prototype.prepareData = function(){
  var data = new Array(), domains = new Array();
  //console.log(this.data)
  for(var i=0; i<this.data.length; i++){
    var obj = new Object();
    obj["i"] = i+1;
    obj["name"] = this.data[i].name;
    for(var j=0; j<this.data[i].fields.length; j++){
      if(!isNaN(parseFloat(this.data[i].fields[j].val))){
        obj[this.data[i].fields[j].label] = parseFloat(this.data[i].fields[j].val);
      }else{
        obj[this.data[i].fields[j].label] = this.data[i].fields[j].val;
      }
      if(i==0){
        var type = this.data[i].fields[j].id.split("-")[1];
        if(type === 'select' || type === 'checkbox' || type === 'radio'){
          domains.push(this.data[i].fields[j].label);
        }
      }
      /*if(this.data[i].fields[j].label === group && i == 0){
        domains.push(this.data[i].fields[j].val);
      }*/
    }
    data.push(obj)
  }
  console.log(data)
  console.log(domains)
  return {"data": data, "domains": domains};
}

Grapher.prototype.createGraph = {
  "scatter": function(data, xaxis, yaxis, group){
    this.createScatterGraph(data, xaxis, yaxis, group);
  },
  "bar": function(data, xaxis, yaxis, group){
    this.createBarChart(data, xaxis, yaxis, group);
  },
  "pie": function(data, xaxis, yaxis, group){
    this.createPieChart(data, xaxis, yaxis, group);
  }
}

Grapher.prototype.createScatterGraph = function(dataobj, xaxis, yaxis, group){
  var data = dataobj.data;
  var margin = 50, width = 400, height = 400;

  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis().scale(x).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left");

  var svg = d3.select("#graph-frame").append("svg")
    .attr("width", width + margin + margin)
    .attr("height", height + margin + margin)
  .append("g")
    .attr("transform", "translate(" + margin + "," + margin + ")");

  data.forEach(function(d) {
    d.sepalLength = +d[xaxis];
    d.sepalWidth = +d[yaxis];
  });

  x.domain(d3.extent(data, function(d) { return d[xaxis]; })).nice();
  y.domain(d3.extent(data, function(d) { return d[yaxis]; })).nice();

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text(xaxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(yaxis)

  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(d[xaxis]); })
      .attr("cy", function(d) { return y(d[yaxis]); })
      .style("fill", function(d) { return color(d[group]); });

  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
}

Grapher.prototype.createBarChart = function(dataobj, xaxis, yaxis, group){
  var grouped = this.convertData(dataobj.data, xaxis, group);
  var data = this.prepareBarData(grouped[xaxis], xaxis, yaxis, dataobj.data.length);

  var margin = 50, width = 400, height = 400;

  if(yaxis == "frequency"){
    var formatPercent = d3.format(".0%");
  }else{
    var formatPercent = d3.format(".2s")
  }

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(formatPercent);

  var svg = d3.select("#graph-frame").append("svg")
      .attr("width", width + margin + margin)
      .attr("height", height + margin + margin)
    .append("g")
      .attr("transform", "translate(" + margin + "," + margin + ")");

  data.forEach(function(d) {
    d.sepalWidth = +d[yaxis];
  });

  x.domain(data.map(function(d) { return d[xaxis]; }));
  y.domain([0, d3.max(data, function(d) { return d[yaxis]; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(yaxis);

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d[xaxis]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d[yaxis]); })
      .attr("height", function(d) { return height - y(d[yaxis]); });
}

Grapher.prototype.createPieChart = function(dataobj, xaxis, yaxis, group){
  var grouped = this.convertData(dataobj.data, xaxis, group);
  var data = this.prepareBarData(grouped[xaxis], xaxis, yaxis, dataobj.data.length);

  var w = 400, h = 400, r = 200, color = d3.scale.category20c();

  var vis = d3.select("#graph-frame")
        .append("svg:svg")              //create the SVG element inside the <body>
        .data([data])                   //associate our data with the document
            .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
            .attr("height", h)
        .append("svg:g")                //make a group to hold our pie chart
            .attr("transform", "translate(" + r + "," + r + ")")    //move the center of the pie chart from 0, 0 to radius, radius

  var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
      .outerRadius(r);

  var pie = d3.layout.pie()           //this will create arc data for us given a list of values
      .value(function(d) { return d[yaxis]; });    //we must tell it out to access the value of each element in our data array

  var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
      .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
      .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
          .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
              .attr("class", "slice");    //allow us to style things in the slices (like text)

  arcs.append("svg:path")
          .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
          .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function

  arcs.append("svg:text")                                     //add a label to each slice
        .attr("transform", function(d) {                    //set the label's origin to the center of the arc
          //we have to make sure to set these before calling arc.centroid
          d.innerRadius = 0;
          d.outerRadius = r;
          return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
      })
      .attr("text-anchor", "middle")                          //center the text on it's origin
      .text(function(d, i) { return data[i][xaxis]; });
}

Grapher.prototype.prepareBarData = function(dat, xaxis, fieldy, length){
  var data = new Array();
  for(var d in dat){
    var obj = new Object();
    obj[xaxis] = d;
    if(fieldy == "frequency"){
      obj[fieldy] = dat[d].length/length;
    }else if(fieldy == "mv"){
      var total = 0;
      for(var i=0;i<dat[d].length;i++){
        total += dat[d][i];
      }
      obj[fieldy] = total/dat[d].length;
    }
    data.push(obj);
  }
  return data;
}

Grapher.prototype.convertData = function(data, fieldx, fieldy){
  var group_data = new Object();
  var new_data = new Array();
  var subobjects = new Object();
  //console.log(this.groups);
  var l = 0;
  for(var i in this.groups){
    //console.log(i)
    for(var j=0; j<this.groups[i].length; j++){
      subobjects[this.groups[i][j]] = [];
    }
    group_data[i] = subobjects;
  }
  //console.log(group_data);
  //console.log(data);
  for(var i=0; i< data.length; i++){
    group_data[fieldx][data[i][fieldx]].push(data[i][fieldy])
  }
  return group_data;
}

Grapher.prototype.enableSaveGraph = function(){
  $("#save-graph").click(function(){
    //console.log($("#graph-frame").html());
    window.localStorage.setItem("graph", $("#graph-frame").html());
  });
}