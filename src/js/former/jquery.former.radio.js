var RadioImplementation = function(target, title, type, elements, names){
  this.target = target;
  this.title = title;
  this.type = type;
  this.elements = elements;
  this.names = names;
}

RadioImplementation.prototype.implement = function(){
  
  //var i = findIForFieldcontain("#"+this.target, '.fieldcontain', 'radio');
  //var j = findHighestElement(this.target, ".fieldcontain", "fieldcontain-radio-");
  var i = findHighestElement(this.target, '.fieldcontain', 'fieldcontain-radio-')+1;
  var j = findHighestElement(this.target, "input:radio", "form-radio"+j+"-");
  var radiogroup = new RadioGroup(this.title, i, this.names, 'required');
  $("#"+this.target).append(radiogroup.render().join(""));
  appendEditButtons("fieldcontain-radio-"+i);
  
  var form = new OptionsForm (this.type, this.title, i, 'required', this.names, this.elements);
  makeAlertWindow(form.create().join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
  form.enableEvents[this.type](i, this.target);
}

RadioImplementation.prototype.findRadioNumber = function(){
  var found = $("#"+id).contents().find(element);
  var j = 0;
  if(found.length > 0){
    for(f=0; f<found.length; f++){
      var i = $(found[f]).prop("id").split(word)[1];
      if(i > j){
        j = i;
      }
    }
  }
  return j;
}

var RadioGroup = function(title, i, names, required){
  this.title = title;
  this.i = i;
  this.names = names;
  this.required = required;
}

RadioGroup.prototype.render = function(){
  var group = new Array();
  group.push('\n<div class="fieldcontain" id="fieldcontain-radio-'+this.i+'">');
  group.push('\n<fieldset data-role="controlgroup">');
  group.push('\n<legend>'+this.title+'</legend>');
  for(name in this.names){
    ch = this.createRadio(this.i, name, this.names[name]);
    group = group.concat(ch);
  }
  group.push('\n</fieldset>');
  group.push('\n</div>\n');
  return group;
}

RadioGroup.prototype.createRadio = function(number_of_field, n, name){
  var splits = n.split("-")
  var radio = new Radio(name, splits[1], name, this.required, splits[0]);
  return radio.createRadio();
}

var Radio = function(name, i, value, required, n){
  this.name = name;
  this.i = i;
  this.value = value;
  this.required = required;
  this.n = n;
}

Radio.prototype.createRadio = function(){
  var text = new Array();
  text.push('\n<label for="form-radio'+this.n+'-'+this.i+'">'+this.name+'</label>');
  text.push('\n<input name="form-radio'+this.n+'" id="form-radio'+this.n+'-'+this.i+'" value="'+this.value+'" type="radio" '+this.required+'>');
  return text;
}

Radio.prototype.createOptionsFormRadio = function(){
  return "<input type='text' value='"+this.name+"' name='radio"+this.n+"-"+this.i+"' id='radio"+this.n+"-"+this.i+"' class='radio'/><a class='btn delete-radio' href='javascript:void( 0);'><i class='icon-remove-sign'></i></a>";
}