var CheckBoxImplementation = function(target, title, type, elements, names){
  this.target = target;
  this.title = title;
  this.type = type;
  this.elements = elements;
  this.names = names;
}

CheckBoxImplementation.prototype.implement = function(){
  var i = findIForFieldcontain("#"+this.target, '.fieldcontain', this.type);
  var checkboxgroup = new CheckBoxGroup(this.title, i, this.names, 'required');
  $("#"+this.target).append(checkboxgroup.render().join(""));
  appendEditButtons("fieldcontain-checkbox-"+i);

  var form = new OptionsForm (this.type, this.title, i, 'required', this.names, this.elements);
  makeAlertWindow(form.create().join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
  form.enableEvents[this.type](i, this.target);
}

CheckBoxImplementation.prototype.findCheckboxNumber = function(){
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

var CheckBoxGroup = function(title, n, names, required){
  this.title = title;
  this.n = n;
  this.names = names;
  this.required = required;
}

CheckBoxGroup.prototype.render = function(){
  var group = new Array();
  group.push('\n<div class="fieldcontain" id="fieldcontain-checkbox-'+this.n+'">');
  //group.push('\n<div id="chbox'+this.n+'">');
  group.push('\n<fieldset>');
  group.push('\n<legend>'+this.title+'</legend>');
  for(name in this.names){
    ch = this.createCheckbox(name, this.names[name]);
    group = group.concat(ch);
  }
  group.push('\n</fieldset>');
  //group.push('\n</div>\n');
  group.push('\n</div>\n');
  return group;
}

CheckBoxGroup.prototype.createCheckbox = function(n, name){
  var chbox = new CheckBox(name, n, name, this.required);
  return chbox.createCheckbox();
}

var CheckBox = function(name, i, value, required){
  this.name = name;
  this.i = i;
  this.value = value;
  this.required = required;
}

CheckBox.prototype.createCheckbox = function(){
  var text = new Array();
  text.push('\n<label for="form-checkbox-'+this.i+'">'+this.name+'</label>');
  text.push('\n<input name="form-checkbox-'+this.i+'" id="form-checkbox-'+this.i+'" value="'+this.value+'" type="checkbox" '+this.required+'>');
  return text;
}

CheckBox.prototype.createOptionsFormCheckbox = function(){
  return "<input type='text' value='"+this.name+"' name='checkbox-"+this.i+"' id='checkbox-"+this.i+"' class='checkbox'/><a class='btn delete-checkbox' href='javascript:void( 0);'><i class='icon-remove-sign'></i></a>";
}