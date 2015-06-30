var PhotoImplementation = function(target, title, label, type, elements){
  this.target = target;
  this.title = title;
  this.label = label;
  this.type = type;
  this.elements = elements;
}

PhotoImplementation.prototype.implement = function(){
  if($("#"+this.target).find(".camera").length===0){
    var i = findIForFieldcontain("#"+this.target, '.fieldcontain', 'image');
    var capture = new Capture(this.title, this.label, i, 'image/png', 'required', 'camera');
    $("#"+this.target).append(capture.render().join(""));
    appendEditButtons("fieldcontain-image-"+i);

    var form = new OptionsForm (this.type, this.label, 'Placeholder', 'required', null, this.elements);
    makeAlertWindow(form.create().join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
    form.enableEvents[this.type](1, this.target);
  }else{
    giveFeedback("You can only add one photo button once!");
  }
}
