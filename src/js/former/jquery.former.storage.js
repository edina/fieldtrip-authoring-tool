var Storage = function(){
  this.store = window.localStorage;
}

Storage.prototype.init = function(){
  if (!this.store.editors) this.store.editors = JSON.stringify([]);
}

Storage.prototype.addEditor = function(name, code){
  //var editors = JSON.parse(this.store["editors"])
  var editor = {"name": name, "code": code, "is_synched": false};
  var l = this.store.length+1;
  this.store.setItem(l, JSON.stringify(editor))
  return l;
  //editors.push(editor);
  //this.store["editors"] = JSON.stringify(editors)
}

Storage.prototype.getEditors = function(){
  var renders = new Array();
  for(var i in this.store){
    var editor = JSON.parse(this.store.getItem(i));
    renders.push('<li><a tabindex=-1 href="javascript:void(0)" id="leditor_'+i+'" class="get-local-form">'+editor.name+'</a></li>');
  }
  $("#leditors").after(renders.join(""));
}

Storage.prototype.getEditor = function(id){
  //var editors = JSON.parse(this.store["editors"]);
  for(var i in this.store){
    if(i === id){
      return JSON.parse(this.store.getItem(i)).code;
    }
  }
  return null;
}

Storage.prototype.deleteEditor = function(id){
  for(var i in this.store){
    if(i === id){
      return this.store.removeItem(i);
    }
  }
  return false;
}

Storage.prototype.updateEditor = function(id, name, code, is_synced){
  var editor = {"name": name, "code": code, "is_synched": is_synced};
  this.store.setItem(id, JSON.stringify(editor));
}

Storage.prototype.count = function(){
  return this.store.length;
}