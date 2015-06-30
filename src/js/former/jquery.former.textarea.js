var TextAreaImplementation = function(target, title, type, elements){
  this.target = target;
  this.title = title;
  this.type = type;
  this.elements = elements;
}

TextAreaImplementation.prototype.implement = function(){
  var textarea = new TextArea(this.title, 'required', 'Placeholder');
  var i = findIForFieldcontain("#"+this.target, '.fieldcontain', this.type);
  $("#"+this.target).append(textarea.render(i).join(""));
  appendEditButtons("fieldcontain-textarea-"+i);

  var form = new OptionsForm (this.type, this.title, 'Placeholder', 'required', null, this.elements);
  makeAlertWindow(form.create().join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
  form.enableEvents[this.type](i, this.target);
}

var TextArea = function(name, required, placeholder){
  this.name = name;
  this.required = required;
  this.placeholder = placeholder;
}

TextArea.prototype.render = function(i){
  var text = new Array();
  text.push('\n<div class="fieldcontain" id="fieldcontain-textarea-'+i+'">');
  text.push('\n<label for="form-textarea-'+i+'">'+this.name+'</label>');
  text.push('\n<textarea name="form-textarea-'+i+'" id="form-textarea-'+i+'" placeholder="'+this.placeholder+'" '+this.required+' readonly="readonly" ></textarea>');
  text.push("\n</div>\n");
  return text;
}