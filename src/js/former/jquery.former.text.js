var TextImplementation = function(target, title, type, elements, value, step, min, max, maxlength){
  this.target = target;
  this.title = title;
  this.type = type;
  this.elements = elements;
  this.value = value;
  this.step = step;
  if(this.step != undefined){
    this.type = "range";
  }
  this.min = min;
  this.max = max;
  this.maxlength = maxlength;
}

TextImplementation.prototype.implement = function(){
  var text = new Text(this.title, this.type, 'required', 'Placeholder', this.value, this.step, this.min, this.max, this.maxlength);
  var i = findIForFieldcontain("#"+this.target, '.fieldcontain', this.type);
  $("#"+this.target).append(text.render(i).join(""));
  appendEditButtons("fieldcontain-"+this.type+"-"+i);
  
  var form = new OptionsForm (this.type, this.title, 'Placeholder', 'required', null, this.elements, "", i);
  makeAlertWindow(form.create(this.maxlength, this.step, this.min, this.max).join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
  form.enableEvents[this.type](i, this.target);
}

/**
 * object Text for creating the elemnt text in the form
 * @param{String} name: the String of the label
 * @param{String} n: the increasing integer for each text field
 * @param{String} type: the type of the text (e.g. range, telephone, number etc)
 * @param{String} required: the attribute for making the element mandatory for filling it
 * @param{String} placeholder: the html5 attribute of having a text inside the field before the user focus on it
 * @param{String} value: the value of the text
 * @param{Integer} step: the value of the step on the range
 * @param{Integer} min: the minimum value of the range (if the type is range)
 * @param{Integer} max: the maximum value of the range (if the type is range)
 */
var Text = function(name, type, required, placeholder, value, step, min, max, maxlength){
  this.name = name;
  //this.n = n;
  this.type = type;
  this.required = required;
  this.placeholder = placeholder;
  this.value = value;
  this.step = step;
  this.min = min;
  this.max = max;
  this.maxlength = maxlength;
}

/**
 * function for rendering the html from the Text object
 * @param{integer}: the increasing number of the fieldcontain of the form
 */
Text.prototype.render = function(i){
  var text = new Array();
  text.push('\n<div class="fieldcontain" id="fieldcontain-'+this.type+'-'+i+'">');
  text.push('\n<label for="form-'+this.type+'-'+i+'">'+this.name+'</label>');
  var min = "", max = "", step = "";
  if(this.min !=  undefined && this.max != undefined){
    min = "min='"+this.min+"'";
    max = "max='"+this.max+"'";
    step = "step='"+this.step+"'";
  }
  text.push('\n<input name="form-'+this.type+'-'+i+'" id="form-'+this.type+'-'+i+'" type="'+this.type+'"  '+this.required+' '+step+' '+min+' '+max);
  if(this.value != "" && this.value!=undefined){
    text.push('value="'+this.value+'"');
  }
  if(this.placeholder != "" && this.placeholder!=undefined){
    text.push('placeholder="'+this.placeholder+'"');
  }
  if(this.maxlength != "" && this.maxlength!=undefined){
    text.push('maxlength="'+this.maxlength+'"');
  }
  text.push(">");
  text.push('\n</div>\n');
  return text;
}