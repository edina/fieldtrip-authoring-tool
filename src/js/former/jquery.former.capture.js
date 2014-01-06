var Capture = function(name, label, n, accept, required, capture, hidden){
  this.name = name;
  this.label = label;
  this.n = n;
  this.accept = accept;
  this.required = required;
  this.capture = capture;
  this.hidden = hidden;
}

Capture.prototype.render = function(){
  var text = new Array();
  var field = "image";
  if(this.capture === "microphone"){
    field = "audio";
  }
  text.push('\n<div class="fieldcontain" id="fieldcontain-'+field+'-'+this.n+'">');
  text.push('\n<div class="button-wrapper button-'+this.capture+'">');
  var hidden = "";
  if(this.capture === 'gps'){
    hidden = "hide='"+this.hidden+"'";
  }
  text.push('\n<input name="form-'+this.name+'-1" id="form-'+this.name+'-1" type="file" accept="'+this.accept+'" capture="'+this.capture+'" '+this.required+' '+hidden+' class="'+this.capture+'" />');
  text.push('\n<label for="form-'+this.name+'-1">'+this.label+'</label>');
  text.push('\n</div>');
  text.push('\n</div>\n');
  return text;
}