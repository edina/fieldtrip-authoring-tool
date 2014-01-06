var GPSImplementation = function(target, title, n, type, elements){
  this.target = target;
  this.title = title;
  this.n = n;
  this.type = type;
  this.elements = elements;
}

GPSImplementation.prototype.implement = function(){
  var capture = new Capture(this.title, 'record', this.n, 'application/gpx+xml', 'required', 'gps', '', 'false');
  var i = findIForFieldcontain("#"+this.target, '.fieldcontain');
  $("#"+this.target).append(capture.render(i).join(""));
  appendEditButtons("fieldcontain-"+i);
  
  var form = new OptionsForm (this.type, this.title, 'false', 'required', null, this.elements);
  makeAlertWindow(form.create(this.type).join(""), 'Options', 300, 500, 'options-dialog', 1000);
  form.enableEvents[this.type]("#"+this.title+this.n);
}
