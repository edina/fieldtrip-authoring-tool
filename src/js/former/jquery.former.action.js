
  var Action = function(options, target, elements){
    this.options = options;
    //this.id = id;
    this.target = target;
    this.elements = elements;
  }

  Action.prototype.addElement = function(element){
    for(option in this.options){
      if(this.options[option][1] == element){
        this.myActions[option](this.target, this.options[option][0], this.elements);
        return false;
      }
    }
    return true;
  };

  Action.prototype.myActions = {
    textAction : function(target, element, elements){
      var textimplementation = new TextImplementation(target, "Title", element, elements, "", null, null, null, 10);
      textimplementation.implement();
    },
    textareaAction : function(target, element, elements){
      var textAreaimplementation = new TextAreaImplementation(target, "Description", element, elements);
      textAreaimplementation.implement();
    },
    checkboxAction : function(target, element, elements){
      var i = findHighestElement(target, "input:checkbox", element+"-");
      i++;
      var checkboxes = new Object();
      checkboxes[i] = "Checkbox";
      var checkboximplementation = new CheckBoxImplementation(target, "Choose", element, elements, checkboxes);
      checkboximplementation.implement();
    },
    radioAction : function(target, element, elements){
      var i = findHighestElement(target, ".fieldcontain", "fieldcontain-radio-");
      var j = findHighestElement(this.target, "input:radio", "form-radio"+i+"-");
      i++;
      var radios = new Object();
      radios[i+"-1"] = "Radio";
      var radioimplementation = new RadioImplementation(target, "Choose", element, elements, radios);
      radioimplementation.implement();
    },
    selectAction : function(target, element, elements){
      var i = findHighestElement(target, "select", element+"-");
      i++;
      var options = new Object();
      options[i] = "Select";
      var optionsimplementation = new OptionsImplementation(target, "Choose", element, elements, options);
      optionsimplementation.implement();
    },
    photoAction : function(target, element, elements){
      var photoimplementation = new PhotoImplementation(target, "image", "Take", element, elements);
      photoimplementation.implement();
    },
    audioAction : function(target, element, elements){
      var audioimplementation = new AudioImplementation(target, "audio", "Record", element, elements);
      audioimplementation.implement();
    },
    gpsAction : function(target, elements){
      var gpsimplementation = new GPSImplementation(target, "poiCapture", "gps", elements);
      gpsimplementation.implement();
    },
    rangeAction : function(target, element, elements){
      var textimplementation = new TextImplementation(target, "Range", element, elements, "", 1, 0, 10, 10);
      textimplementation.implement();
    }
  }