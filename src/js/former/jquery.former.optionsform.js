var OptionsForm = function(type, title, placeholder, required, group, elements, value, integ){
  this.type = type;
  this.title =title;
  this.placeholder = placeholder;
  this.required = required;
  this.group = group;
  this.elements = elements;
  this.value = value;
  this.integ = integ;
}

OptionsForm.prototype.enableEvents = {
  text: function(i, target){
    var id = "#form-text-"+i;
    $("#text_title").keyup(function(event){
      $(id).prev().text($(this).val());
      if($("#iframe").dialog("isOpen") == true){
        var $$ = window.frames[0].jQuery;
        $$(id).prev().text($(this).val());
      }
      limitChars('text_title', 20, 'charlimitinfo1');
      changeStatus();
    });
    
    if(i == 1){
      $("#text_prefix").keyup(function(event){
        $(id).attr("value", $(this).val());
        if($("#iframe").dialog("isOpen") == true){
          var $$ = window.frames[0].jQuery;
          $$(id).attr("value", $(this).val());
        }
        changeStatus();
    });
    }
    
    $("#text_placeholder").keyup(function(event){
      $(id).attr("placeholder", $(this).val());
      if($("#iframe").dialog("isOpen") == true){
        var $$ = window.frames[0].jQuery;
        $$(id).attr("placeholder", $(this).val());
      }
      changeStatus();
    });
    
    $(".required").change(function(event){
      if(i == 1){
        $(this).val("true");
        giveFeedback("The first field is always mandatory. You cannot change this field.")
      }else{
        ($(this).val() == "true") ? $(id).attr("required", true) : $(id).removeAttr("required");
        changeStatus();
      }
    });
    
    $(".type").change(function(event){
      $(id).prop("type", $(this).val());
      changeStatus();
    });
    
    $("#text_maxlength").change(function(event){
      if(parseInt($(this).val()) <= 0){
        giveFeedback("The maxlenght has to be a positive integer.")
      }else{
        $(id).attr("maxlength", $(this).val());
        changeStatus();
      }
    });
  },
  textarea: function(i, target){
    var id = "#form-textarea-"+i;
    $("#textarea_title").keyup(function(event){
      $(id).prev().text($(this).val());
      limitChars('textarea_title', 20, 'charlimitinfo1');
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).prev().text($(this).val());
      }
      changeStatus();
    });
    
    $("#textarea_placeholder").keyup(function(event){
      $(id).attr("placeholder", $(this).val());
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).attr("placeholder", $(this).val());
      }
      changeStatus();
    });
    
    $(".required").change(function(event){
      ($(this).val() == "true") ? $(id).attr("required", true) : $(id).removeAttr("required");
      changeStatus();
    });
  },
  checkbox: function(i, target){
    var id = "#fieldcontain-checkbox-"+i;
    var ini = "#form-";
    $("#checkbox_title").keyup(function(event){
      $(id).find('legend').text($(this).val());
      limitChars('checkbox_title', 20, 'charlimitinfo1');
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find('legend').text($(this).val());
      }
      changeStatus();
    });
  
    $(document).on('keyup', '#checkboxes input', function(event){
      var el_id = ini+$(this).attr("id");
      $(id).find(el_id).prev().text($(this).val());
      $(el_id).val($(this).val());
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find(el_id).prev().find(".ui-btn-text").text($(this).val());
        $$(el_id).val($(this).val());
        $$(id).trigger('create');
      }
      changeStatus();
    });
    
    $(".required").change(function(){
      var finds = $(id).find("input:checkbox");
      for(var i=0; i<finds.length;i++){
        ($(this).val() == "true") ? $(finds[i]).attr("required", true) : $(finds[i]).removeAttr("required");
      }
      changeStatus();
    });
  
    $("#add_checkbox").click(function(){
      var i = findHighestElement(target, "input:checkbox", "form-checkbox-");
      i++;
      var required = '';
      ($(".required").val() == "true") ? required = "required" : required = "";
      var chbox = new CheckBox("Checkbox", i, "Checkbox", required);
      $("#checkboxes").append(chbox.createOptionsFormCheckbox());

      $(id).find("fieldset").append(chbox.createCheckbox().join(""));
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find("fieldset").append(chbox.createCheckbox().join(""));
        $$(id).trigger('create');
      }
      changeStatus();
    });
    
    $(document).off('click', '.delete-checkbox')
    $(document).on('click', '.delete-checkbox', function(){
      var form_id = ini+$(this).prev().attr("id");
      $(id).find(form_id).prev().remove();
      $(id).find(form_id).remove();
      
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find(form_id).prev().remove();
        $$(id).find(form_id).remove();
      }
        
      $(this).prev().remove();
      $(this).remove();
      changeStatus();
    });
  },
  radio: function(n, target){
    var id = "#fieldcontain-radio-"+n;
    var ini = "#form-";
    $("#radio_title").keyup(function(event){
      $(id).find('legend').text($(this).val());
      limitChars('radio_title', 20, 'charlimitinfo1');
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find('.ui-controlgroup-label').text($(this).val());
      }
      changeStatus();
    });
  
    $(document).on('keyup', '#radios input', function(event){
      var el_id = ini+$(this).attr("id");
      $(id).find(el_id).prev().text($(this).val());
      $(el_id).val($(this).val());
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find(el_id).prev().find(".ui-btn-text").text($(this).val());
        $$(el_id).val($(this).val());
        //$$(id).trigger('create');
      }
      changeStatus();
    });
    
    $(".required").change(function(){
      var finds = $(id).find("input:radio");
      for(var i=0; i<finds.length;i++){
        ($(this).val() == "true") ? $(finds[i]).attr("required", true) : $(finds[i]).removeAttr("required");
      }
      changeStatus();
    });
  
    $("#add_radio").click(function(){
      var j = id.split("-")[2];
      var i = findHighestElement(target, "input:radio", "form-radio"+j+"-")+1;
      var required = '';
      ($(".required").val() == "true") ? required = "required" : required = "";
      var radio = new Radio("Radio", i, "Radio", required, n);
      $("#radios").append(radio.createOptionsFormRadio());
      $(id).find("fieldset").append(radio.createRadio().join(""));
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find("fieldset").append(radio.createRadio().join(""));
        $$(id).trigger('create');
      }
      changeStatus();
    });
    
    $(document).off('click', '.delete-radio');
    $(document).on('click', '.delete-radio', function(){
      var form_id = ini+$(this).prev().attr("id");
      $(id).find(form_id).prev().remove();
      $(id).find(form_id).remove();
      
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find(form_id).prev().remove();
        $$(id).find(form_id).remove();
      }
      $(this).prev().remove();
      $(this).remove();
      changeStatus();
    });
    
  },
  select: function(i, target){
    var id = "#fieldcontain-select-"+i;
    var sel_id = "#form-select-"+i;
    $("#select_title").keyup(function(event){
      $(id).find('legend').text($(this).val());
      limitChars('select_title', 20, 'charlimitinfo1');
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(id).find('legend').text($(this).val());
      }
      changeStatus();
    });
    
    $(document).off('keyup', '#options input');
    $(document).on('keyup', '#options input', function(event){
      fixOptions(sel_id);
    });
    
    $(".required").change(function(){
      ($(this).val() == "true") ? $(sel_id).attr("required", true) : $(sel_id).removeAttr("required");
      fixOptions(sel_id);
    });
    
    $("#add_option").click(function(){
      var option_i = 0;
      if($("#options").find("input").length > 0){
        option_i = $("#options").find("input")[$("#options").find("input").length-1].id.split("option-")[1];
      }
      option_i++;
      
      var option = new Option("Select", option_i, i, "");
      $("#options").append(option.createOptionsFormOption());
      $(sel_id).append(option.createOption().join(""));
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(sel_id).append(option.createOption().join(""));
      }
      changeStatus();
    });
    
    $(document).off('click', '.delete-option');
    $(document).on('click', '.delete-option', function(){
      $(this).prev().remove();
      $(this).remove();
      fixOptions(sel_id);
    });
    
    function fixOptions(sel_id){
      var options = $('.option');
      var new_options = new Array();
      if($(".required").val() === "true"){
        new_options.push("\n<option value=''></option>");
      }
      //var selected = "";
      for(var i=0; i<options.length; i++){
        var value = $(options[i]).val();
        //if(i==0){
        //  selected = "selected";
        //}
        new_options.push('\n<option value="'+value+'">'+value+'</option>');
        //selected = "";
      }
      $(sel_id).html(new_options.join(""));
      if($("#iframe").dialog("isOpen")==true){
        var $$ = window.frames[0].jQuery;
        $$(sel_id).html(new_options.join(""));
      }
      changeStatus();
    }
  },
  image: function(i){
    enableMedia("image", i)
  },
  audio: function(i){
    enableMedia("audio", i)
  },
  range: function(i, target){
    var id = "#form-range-"+i;
    $("#range_title").keyup(function(event){
      $(id).prev().text($(this).val());
      if($("#iframe").dialog("isOpen") == true){
        var $$ = window.frames[0].jQuery;
        $$(id).prev().text($(this).val());
      }
      changeStatus();
    });
    
    $("#text_step").change(function(event){
      $(id).attr("step", $(this).val());
    });
    
    $("#text_min").change(function(event){
      $(id).prop("min", $(this).val());
    });
    
    $("#text_max").change(function(event){
      $(id).prop("max", $(this).val());
    });
    
    $(".required").change(function(event){
      ($(this).val() == "true") ? $(id).attr("required", true) : $(id).removeAttr("required");
    });
    
    $(".type").change(function(event){
      $(id).prop("type", $(this).val());
    });
  }
}

function changeStatus(){
  if($("#sync_status").hasClass("label-success")){
    $("#sync_status").removeClass("label-success").addClass("label-warning").text("Unsynchronized");
  }
}

function enableMedia(type, i){
  var id = "#form-"+type+"-"+i;
  $("#"+type+"_title").keyup(function(event){
    $(id).next().text($(this).val());
    //limitChars('audio_title', 20, 'charlimitinfo1');
    if($("#iframe").dialog("isOpen")==true){
      var $$ = window.frames[0].jQuery;
      $$(".annotate-"+type+"-title").text($(this).val());
    }
    changeStatus();
  });
  
  $(".required").change(function(event){
    $(".required").val() === "true" ? $(id).attr("required", "required") : $(id).removeAttr("required");
    changeStatus();
  });
}
  
OptionsForm.prototype.create = function(maxlength, step, min, max){
  var form = new Array();
  for(var i=0; i<this.elements.length;i++){
    if(this.elements[i] === this.type){
      form = this.render[this.type].apply(this, [maxlength, this.integ, step, min, max]);
      //(this.title, this.placeholder, this.required, maxlength, step, min, max);
      break;
    }
  }
  return form;
}

OptionsForm.prototype.render = {
  text: function(maxlength, i, step, min, max){
    var form = this.createBasicForm();
    if(i == 1){
      form.push('<div class="element-name">Set Prefix</div><div class="element"><input type="text" name="text_prefix" id="text_prefix" value="'+this.value+'" /></div>');
    }
    form.push('<div class="element-name">Placeholder</div><div class="element"><input type="text" name="text_placeholder" id="text_placeholder" value="'+this.placeholder+'" /></div>');
    form.push('<div class="element-name">Max length</div><div class="element"><input type="number" name="text_maxlength" id="text_maxlength" value="'+maxlength+'" /></div>');
    return form;
  },
  textarea: function(){
    var form = this.createBasicForm();
    form.push('<div class="element-name">Placeholder</div> <div class="element"><input type="text" name="textarea_placeholder" id="textarea_placeholder" value="'+this.placeholder+'" /></div>');
    return form;
  },
  radio: function(){
    var form = this.createBasicForm();
    form.push('<div class="element-name">Elements</div> <div class="accordion">');
    form.push('<div id="radios">'+this.renderGroup(this.type).join("")+'</div>');
    form.push('<button id="add_radio">Add radio</button>');
    return form;
  },
  checkbox: function(){
    var form = this.createBasicForm();
    form.push('<div class="element-name">Elements</div> <div class="accordion">');
    form.push('<div id="checkboxes">'+this.renderGroup(this.type).join("")+'</div>');
    form.push('<button id="add_checkbox">Add checkbox</button>');
    return form;
  },
  select: function(){
    var form = this.createBasicForm();
    form.push('<div class="element-name">Elements</div> <div class="accordion">');
    form.push('<div id="options">'+this.renderGroup(this.type).join("")+'</div>');
    form.push('<button id="add_option">Add option</button>');
    return form;
  },
  image: function(){
    return this.createBasicForm();
  },
  audio: function(g){
    return this.createBasicForm();
  },
  gps: function(title, hidden, required){
    var form = new Array();
    var yes = '', no = '', hidden_yes = '', hidden_no = '';
    if(required == "required"){
      yes = 'selected';
    }else{
      no = 'selected';
    }
    if(hidden == "true"){
      hidden_yes = 'selected';
    }else{
      hidden_no = 'selected';
    }
    form.push("<div class='element-name'>Required</div> <div class='element'><select class='required'><option value='true' "+yes+">Yes</option><option value='false' "+no+">No</option></select></div>");
    form.push("<div class='element-name'>Hidden</div> <div class='element'><select class='hid'><option value='true' "+hidden_yes+">Yes</option><option value='false' "+hidden_no+">No</option></select></div>");
    return form;
  },
  range: function(maxlength, i, step, min, max){
    var form = this.createBasicForm();
    form.push("<div class='element-name'>Step</div><div class='element'><input type='number' name='text_step' id='text_step' value='"+step+"' /></div>");
    form.push("<div class='element-name'>Min value</div><div class='element'><input type='number' name='text_min' id='text_min' value='"+min+"' /></div>");
    form.push("<div class='element-name'>Max value</div><div class='element'><input type='number' name='text_max' id='text_max' value='"+max+"' /></div>");
    
    return form;
  }
}

OptionsForm.prototype.createBasicForm = function(){
  var form = new Array();
  var yes, no = '';
  if(this.required == "required"){
    yes = 'selected';
  }else{
    no = 'selected';
  }
  form.push("<div class='element-name'>Title</div> <div class='element'><input type='text' name='"+this.type+"_title' id='"+this.type+"_title' value='"+this.title+"' /></div>");
  form.push("<div class='element-name'>Required</div> <div class='element'><select class='required'><option value='true' "+yes+">Yes</option><option value='false' "+no+">No</option></select></div>");
  return form;
}

OptionsForm.prototype.renderGroup = function(type){
  if(type == 'select'){
    type = 'option';
  }
  var rendered_group = new Array();
  for(el in this.group){
    rendered_group.push(this.groupInputText(el, type, this.group[el]));
  }
  return rendered_group;
}

OptionsForm.prototype.groupInputText = function(i, type, name){
  if(type != "radio"){
    return "<input type='text' value='"+name+"' name='"+type+'-'+i+"' id='"+type+'-'+i+"' class='"+type+"' /><a class='btn delete-"+type+"' href='javascript:void( 0);'><i class='icon-remove-sign'></i></a>";
  }else{
    return "<input type='text' value='"+name+"' name='"+type+i+"' id='"+type+i+"' class='"+type+"' /><a class='btn delete-"+type+"' href='javascript:void( 0);'><i class='icon-remove-sign'></i></a>";
  }
}