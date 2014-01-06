var Searcher = function(id, type, target){
  this.id = id;
  this.type = type;
  this.target = target;
}

Searcher.prototype.search = function(){
  //console.log(this.type)
  return this.searchTypes[this.type].apply(this);
}

Searcher.prototype.searchTypes = {
  checkbox: function(){
    return this.getGroupResults();
  },
  radio: function(){
    return this.getGroupResults();
  },
  select: function(){
    var find = this.target("#"+this.id).find("option");
    var title = this.target("#"+this.id).find("legend").text();
    var required = this.target("#"+this.id).find("select").attr("required");
    var placeholder = "";
    var group = new Object();
    
    var i = 0;
    if(required != undefined){
      i=1;
    }
    for(i; i<find.length; i++){
      group[i] = $(find[i]).val();
    }
    //return [title, placeholder, required, group];
    return {"title": title, "placeholder": placeholder, "required": required, "group": group};
  },
  textarea: function(){
    var find = this.target("#"+this.id).find("textarea");
    var title = this.target("#"+this.id).find("label").text();
    var placeholder = $(find).attr("placeholder");
    var required = $(find).attr("required");
    //return [this.type, title, placeholder, required];
    return {"title": title, "placeholder": placeholder, "required": required, "group": null};
  },
  text: function(){
    var find = this.target("#"+this.id).find("input");
    var title = this.target("#"+this.id).find("label").text();
    //var text_type = $(find).prop("type");
    var placeholder = $(find).attr("placeholder");
    //var type = this.type;
    var maxlength = $(find).attr("maxlength");
    var required = $(find).attr("required");
    var val = $(find).val();
    //return [this.type, title, placeholder, required, text_type, null, el_id, null, null, null, maxlength];
    return {"title": title, "placeholder": placeholder, "required": required, "group": null, "maxlength": maxlength, "value": val};
  },
  range: function(){
    var find = this.target("#"+this.id).find("input");
    var title = this.target("#"+this.id).find("label").text();
    var required = $(find).attr("required");
    var min = $(find).attr("min");
    var max = $(find).attr("max");
    var step = $(find).attr("step");
    console.log(step)
    //return [this.type, title, null, required, text_type, null, el_id, step, min, max, null];
    return {"title": title, "placeholder": null, "required": required, "group": null, "range": [step, min, max]};
  },
  image: function(){
    return this.getMediaElements();
  },
  audio: function(){
    return this.getMediaElements();
  }
}

Searcher.prototype.getMediaElements = function(){
  var find = this.target("#"+this.id).find("input:file");
  var el_id = $(find).attr("id");
  var required = $(find).attr("required");
  var placeholder = $(find).attr("hide");
  var capture = $(find).attr("capture");
  var title = $(find).next().text();
  //return [this.type, title, placeholder, required, null, null, el_id, null, null, null, null];
  return {"title": title, "placeholder": placeholder, "required": required, "group": null};
}

Searcher.prototype.getGroupResults = function(){
  //var el_id = this.target("#"+this.id).children().next().attr("id")
  var find = this.target("#"+this.id).find("input:"+this.type);
  var title = this.target("#"+this.id).find("legend").text()
  var placeholder = "";
  var required;
  var group = new Object();
  
  for(var i=0;i<find.length;i++){
    required = $(find[i]).attr("required");
    if(this.type != "radio"){
      group[$(find[i]).attr("id").split(this.type+"-")[1]] = $("#"+this.id).find("#"+$(find[i]).attr("id")).prev().text();
    }else{
      group[$(find[i]).attr("id").split(this.type)[1]] = $("#"+this.id).find("#"+$(find[i]).attr("id")).prev().text();
    }
  }
  return {"title": title, "placeholder": placeholder, "required": required, "group": group};
}
