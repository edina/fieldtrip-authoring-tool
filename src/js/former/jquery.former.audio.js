var AudioImplementation = function(target, title, label, type, elements){
  this.target = target;
  this.title = title;
  this.label = label;
  this.type = type;
  this.elements = elements;
}

AudioImplementation.prototype.implement = function(){
  if($("#"+this.target).find(".microphone").length===0){
    var i = findIForFieldcontain("#"+this.target, '.fieldcontain', 'audio');
    var capture = new Capture(this.title, this.label, i, 'audio/*', 'required', 'microphone', '');

    $("#"+this.target).append(capture.render().join(""));
    appendEditButtons("fieldcontain-audio-"+i);

    var form = new OptionsForm (this.type, this.label, 'Placeholder', 'required', null, this.elements);
    makeAlertWindow(form.create().join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
    form.enableEvents[this.type](1, this.target);
  }else{
    giveFeedback("You can only add one photo button once!");
  }

}
