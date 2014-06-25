var TrackAnimator = function(path, name, editor, dialog_id, field_values){
  this.path = path;
  this.name = name;
  this.editor = editor;
  this.dialog_id = dialog_id;
  this.field_values = field_values;
}

RecordRenderer.prototype.render = function(){
  var text1 = {"id": "fieldcontain-text-1", "label": "Title", "val": this.name};
  this.renderField(text1);
  for(var i=0; i<this.field_values.length; i++){
    this.renderField(this.field_values[i]);
  }
  var btn = this.editor.split(".")[0];
  if(btn === "track"){
    btn = "text";
  }
  if(btn.indexOf(" (") >= 0){
    btn = btn.split(" (")[0];
  }
  btn = replaceSpace(btn);
  $("#"+btn.toLowerCase()+"-buttons").remove();
}

RecordRenderer.prototype.renderField = function(value){
  var splits = value.id.split("-");
  var type = splits[1], n = splits[2];
  var element_id = "#form-"+splits[1]+"-"+splits[2];
  this.renderType[type](this.dialog_id, element_id, value, this.name, this.path);
}

RecordRenderer.prototype.renderType = {
  text: function(dialog, el_id, obj, name){
    if(el_id != "#form-text-1"){
      $("#"+dialog+" "+el_id).attr("value", obj.val);
    }else{
      /*$("#"+dialog+" "+el_id).attr("readonly", "readonly");
      $("#"+dialog+" "+el_id).after("read-only")
      $("#"+dialog+" "+el_id).val(name);*/
      
      //for next release in order rename to work
      $("#"+dialog+" "+el_id).after('<input type="hidden" id="form-text-hidden-1" value="'+name+'">');
      $("#"+dialog+" "+el_id).val(name);
    }
  },
  textarea: function(dialog, el_id, obj){
    $("#"+dialog+" "+el_id).val(obj.val);
  },
  checkbox: function(dialog, el_id, obj){
    var splits = new Array();
    splits = obj.val.split(",");
    for(var i=0; i<splits.length; i++){
      $("#"+obj.id).find("input[value="+splits[i]+"]").prop("checked", true);
    }
  },
  radio: function(dialog, el_id, obj){
    $("#"+dialog+" input[value="+obj.val+"]").prop("checked", true);
  },
  select: function(dialog, el_id, obj){
    $("#"+obj.id).find("option[value='"+obj.val+"']").prop("selected", true);
  },
  image: function(dialog, el_id, obj, name, path){
    var splits = path.split("/");
    $("#"+obj.id).html('<img src="/'+splits[0]+'/pcapi/records/'+splits[1]+'/'+splits[2]+'/'+name+'/'+obj.val+'"><br>');
  },
  audio: function(dialog, el_id, obj, name, path){
    var splits = path.split("/");
    $("#"+obj.id).html('<a href="/'+splits[0]+'/pcapi/records/'+splits[1]+'/'+splits[2]+'/'+name+'/'+obj.val+'">'+obj.val+'</a>')
  },
  track: function(){
    return "";
  },
  range: function(dialog, el_id, obj){
    $("#"+dialog+" "+el_id).attr("value", obj.val);
  }
}