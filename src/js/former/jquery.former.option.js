var OptionsImplementation = function(target, title, type, elements, names){
  this.target = target;
  this.title = title;
  this.type = type;
  this.elements = elements;
  this.names = names;
}

OptionsImplementation.prototype.implement = function(){
  var i = findIForFieldcontain("#"+this.target, '.fieldcontain', 'select');
  var optionsgroup = new OptionsGroup(this.title, i, this.names, 'required');
  $("#"+this.target).append(optionsgroup.render().join(""));
  appendEditButtons("fieldcontain-select-"+i);

  var form = new OptionsForm (this.type, this.title, i, 'required', this.names, this.elements);
  //makeAlertWindow(form.render["checkbox"](this.title, this.n, 'required', form.renderOptiones()).join(""), 'Options', 300, 500, 'options-dialog', 1000);
  makeAlertWindow(form.create(form.renderGroup('option')).join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
  form.enableEvents[this.type](i, this.target);
}

OptionsImplementation.prototype.findOptionNumber = function(){
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

var OptionsGroup = function(title, n, names, required){
  this.title = title;
  this.n = n;
  this.names = names;
  this.required = required;
}

OptionsGroup.prototype.render = function(){
  var group = new Array();
  group.push('\n<div class="fieldcontain" id="fieldcontain-select-'+this.n+'">');
  //group.push('\n<div id="select-'+this.n+'">');
  group.push('\n<fieldset>');
  group.push('\n<legend>'+this.title+'</legend>');
  group.push('\n<select id="form-select-'+this.n+'" required>');
  group.push('\n<option value=""></option>');
  for(name in this.names){
    ch = this.createOption(this.n, name, this.names[name]);
    group = group.concat(ch);
  }
  group.push('\n</select>');
  group.push('\n</fieldset>');
  //group.push('\n</div>\n');
  group.push('\n</div>\n');
  return group;
}

OptionsGroup.prototype.createOption = function(select_i, option_i, name){
  var option = new Option(name, option_i, select_i);
  return option.createOption();
}

var Option = function(name, option_i, select_i){
  this.name = name;
  this.option_i = option_i;
  this.select_i = select_i;
}

Option.prototype.createOption = function(){
  var text = new Array();
  text.push('\n<option value="'+this.name+'">'+this.name+'</option>');
  return text;
}

Option.prototype.createOptionsFormOption = function(){
  return "<input type='text' value='"+this.name+"' name='option-"+this.option_i+"' id='option-"+this.option_i+"' class='option'/><a class='btn delete-option' href='javascript:void( 0);'><i class='icon-remove-sign'></i></a>";
}