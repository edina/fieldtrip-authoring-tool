var GPSStepsImplementation = function(target, title, n, type, elements, value, step, min, max){
  this.target = target;
  this.title = title;
  this.n = n;
  this.type = type;
  this.elements = elements;
  this.value = value;
  this.step = step;
  if(this.step != undefined){
    this.type = "range";
  }
  this.min = min;
  this.max = max;
}

GPSStepsImplementation.prototype.implement = function(){
  if($("#"+this.target).find("input[name='gps_steps0']").length===0){
    var text = new Text(this.title, this.n, this.type, 'gps_steps','', '', this.value, this.step, this.min, this.max);
    var i = findIForFieldcontain("#"+this.target, '.fieldcontain');
    $("#"+this.target).append(text.render(i).join(""));
    appendEditButtons("fieldcontain-"+i);
    
    var form = new OptionsForm (this.type, this.title, 'Placeholder', 'required', null, this.elements);
    makeAlertWindow(form.create(this.type, this.step, this.min, this.max).join(""), 'Options', 300, 500, 'options-dialog', 1000);
    form.enableEvents[this.type]("#text"+this.n);
  }else{
    $("body").append(makeAlertModal("feedback", "You can only add one GPS button once!"));
    $("#feedback").modal("show");
  }
}