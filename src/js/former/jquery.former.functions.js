/**************************ALERT WINDOW FUNCTIONS******************************/

/**
 * function for creating an alert modal window with html data from an ajax request
 * @param{String} url: the url from where the html data will come
 * @param{String} title: the title of the modal window
 * @param{integer} wdth: the width of the modal window
 * @param{integer} hght: the height of the modal window
 * @param{String} element: the div name of the modal window
 * @param{String} data: the data that will be send with ajax request
 * @param{integer} zindex: the zindex of the modal window
 */
function makeWindow(url, title, wdth, hght, element, data, zindex, position, buttons){
    var htmlData = getAjaxHtml(url, data);
    makeAlertWindow(htmlData, title, wdth, hght, element, zindex, position, buttons);
}

/**
 * function for creating an alert modal window with ready html
 * @param{String} htmlData: the html data that will be the content of the window
 * @param{String} title: the title of the modal window
 * @param{integer} wdth: the width of the modal window
 * @param{integer} hght: the height of the modal window
 * @param{String} element: the div name of the modal window
 * @param{integer} zindex: the zindex of the modal window
 */
function makeAlertWindow(htmlData, title, wdth, hght, element, zindex, position, buttons){
    if(screen.width < screen.height){
        var width = $(".span9").width();
        var height = wdth;
        position = "right bottom";
    }else{
        var width = wdth;
        var height = hght;
    }
    if($('body').find("#"+element).length==0){
        $('<div id="'+element+'" title="'+title+'"></div>').appendTo($('body'));
        touchScroll('#'+element);
    }
    var div = "#"+element;
    $(div).html(htmlData);
    openWindow(element, title, width, height, zindex, position, buttons);
}

/**
 * function that does a synchronous ajax request for getting htmldata from a url
 * @param{String} url: the url from where the html data will come
 * @param{String} senddata: the data that will be send with ajax request
 * @return{String} htmlData: the html data in a string format
 */
function getAjaxHtml(url, senddata){
    var htmlData = null;
    $.ajax({
        url: url,
        dataType: 'html',
        async: false,
        data: senddata,
        success: function(data) {
            htmlData = data;
        }
    });
    return htmlData;
}

/**
 * function that creates the modal window and opens it
 * @param{String} title: the title of the modal window
 * @param{integer} wdth: the width of the modal window
 * @param{integer} hght: the height of the modal window
 * @param{String} element: the div name of the modal window
 * @param{integer} zindex: the zindex of the modal window
 */
function openWindow(element, title,  wdth, hght, zindex, position, buttons){
    if(zindex == undefined){
        zindex = 9999;
    }
    var div = "#"+element;

    $(div).dialog({
        autoOpen: true,
        height: hght,
        width: wdth,
        zIndex: zindex, 
        modal: true,
        position: position,
        title: title,
        buttons: buttons
    }); 
    
    //$( div ).dialog( "open" );
    return false;
}

function makeDialogButtons(dialog_id, former_id){
    return buttons = {
        "Done": function(){
            $("#"+dialog_id).dialog('close');
        },
        "Preview": function(){
            doPreview("form-content", "iframe");
        }
    };
}


function makeEditDialogButtons(dialog_id, record, oTable, row){
    return buttons = {
        "Save": function(){
            // OLD name
            var oldName = $("#"+dialog_id+" #form-text-hidden-1").val();
            // NEW name
            record.name = $("#"+dialog_id+" #form-text-1").val();

            // Update obj.fields with new values
            for(var i=0; i<record.fields.length; i++){
                var fid = record.fields[i].id;
                var splits = record.fields[i].id.split("-");
                var new_value = getValueFromEditForm(splits[1], dialog_id, fid);

                if(new_value !== undefined){
                    record.fields[i].val = new_value;
                }
            }

            // If the name didn't change
            if(oldName == record.name){
                loading(true);
                success = function(data){
                    $row = $(row);
                    description = findLabel(record.fields, "Description")
                    oTable.fnUpdate(description, $row.index(), 2);
                    $row.focus();
                    loading(false);                    
                };
                error = function(data){
                    console.warn('Error uploading the record')
                    loading(false);
                };
                PCAPI.putRecord(record.name, record, success, error);
            }else{
                loading(true);
                success = function(data){
                    $row = $(row)
                    oTable.fnUpdate(record.name, $row.index(), 1);
                    $(".record-edit", $row).attr("title", record.name);
                    $(".record-delete", $row).attr("title", record.name);
                    $row.focus();
                };
                error = function(data){
                    console.warn('Error uploading the record')
                    loading(false);
                };

                PCAPI.renameRecord(oldName, record, success, error);                
            }
            $("#"+dialog_id).dialog('close');
        },
        "Cancel": function(){
            $("#"+dialog_id).dialog('close');
        }
    };
}

function getValueFromEditForm(type, dialog_id, fid){
  var updateValues = {
    text: function(dialog_id, fid){
      return $("#"+dialog_id+" #"+fid+" input").val();
    },
    textarea: function(dialog_id, fid){
      return $("#"+dialog_id+" #"+fid+" textarea").val();
    },
    checkbox: function(dialog_id, fid){
      return $("#"+dialog_id+" #"+fid+" input[type=checkbox]:checked").val();
    },
    radio: function(dialog_id, fid){
      return $("#"+dialog_id+" #"+fid+" input[type=radio]:checked").val();
    },
    select: function(dialog_id, fid){
      return $("#"+dialog_id+" #"+fid+" select option:selected").val();
    },
    image: function(dialog_id, fid){
      var splits = $("#"+dialog_id+" #"+fid+" img").attr("src").split("/");
      return splits[splits.length-1];
    },
    audio: function(dialog_id, fid){
      var splits = $("#"+dialog_id+" #"+fid+" a").attr("href").split("/");
      return splits[splits.length-1];
    },
    range: function(dialog_id, fid){
      return $("#"+dialog_id+" #"+fid+" input").val();
    },
    track: function(dialog_id, fid){
      return $("#"+dialog_id+" #"+fid+" input").val();
    }
  }
  return updateValues[type](dialog_id, fid);
}

function findIForFieldcontain(div_id, where, type){
  var finds = $(div_id).find($(where));
  //console.log(finds);
  var i = 0;
  if(finds.length > 0){
    for(var k=0; k<finds.length; k++){
      var id = $(finds[k]).attr("id");
      //console.log(id);
      if(id != undefined){
        var splits = id.split("-");
        if(splits[1] === type){
          var j = parseInt(splits[2]);
          if(j>i){
            i=j;
          }
        }
      }
    }
  }
  return i+1;
}

function findHighestElement(id, element, word){
  //var found = $("#"+id).contents().find(element);
  var found = $("#"+id+' '+element);
  var j = 0;
  if(found.length > 0){
    for(f=0; f<found.length; f++){
      var i = parseInt($(found[f]).prop("id").split(word)[1]);
      if(i > j){
        j = i;
      }
    }
  }
  return j;
}

function addEditButtons(id){
    var finds = $("#"+id).find(".fieldcontain");
    for(var i=0;i<finds.length;i++){
      appendEditButtons($(finds[i]).attr("id"));
    }
    $("#my-form").sortable({items: "div.fieldcontain", handle: '.handle'});
}

function appendEditButtons(id){
    $("#"+id).prepend( "<div class='handle'><span class='ui-icon ui-icon-carat-2-n-s'></span></div>" );
    if(id === "fieldcontain-text-1"){
      $("#"+id).append('<div class="fieldButtons"><a class="btn edit-field" href="javascript:void( 0);"><i class="icon-pencil"></i></a></div>');
    }else{
      $("#"+id).append('<div class="fieldButtons"><a class="btn edit-field" href="javascript:void( 0);"><i class="icon-pencil"></i></a><a class="btn delete-field" href="javascript:void( 0);"><i class="icon-remove-sign"></i></a></div>');
  }
}

function removeEdits(){
    $(".handle").remove();
    $(".fieldButtons").remove();
}

function appendFormName(id, name){
    var header = new Array(), body = new Array(), footer = new Array();
    header.push('<h3 id="myModalLabel">Form name</h3>');
    body.push('<div class="fieldWrapper">');
    body.push('<label for="id_formname">Name:</label>');
    body.push('<input type="text" name="formname" id="id_formname" value="'+name+'">');
    body.push('<span id="formname-fbk" style="color: red;"></span>');
    body.push('</div>');
    footer.push('<button class="btn btn-primary" id="give_form_name">Set</button>');
    return makeModalWindow(id, header, body, footer);
}

function appendDeleteDialog(id, name){
    var header = new Array(), body = new Array(), footer = new Array();
    header.push('<h3 id="myModalLabel">Form name</h3>');
    body.push('<p>Do you want to delete record <span id="del_record">'+name+'</span>?</p>');
    body.push('<input type="hidden" name="rec_for_deletion" id="rec_for_deletion" value="'+name+'">');
    footer.push('<button class="btn btn-primary" id="delete_yes">Yes</button> | ');
    footer.push('<button class="btn btn-primary" id="delete_no">No</button>');
    return makeModalWindow(id, header, body, footer);
}

function makeAlertModal(id, msg){
    var header = new Array(), body = new Array(), footer = new Array();
    header.push('<h3 id="myModalLabel">Feedback</h3>');
    body.push('<div class="alert" role="alert">');
    body.push(msg);
    body.push('</div>');
    return makeModalWindow(id, header, body, footer);
}

function makeModalWindow(id, header, body, footer){
    var form = new Array();
    form.push('<div class="modal hide fade" id="'+id+'" tabindex="-1" role="dialog" aria-labelledby="formModalLabel" aria-hidden="true">');
    form.push('<div class="modal-header">');
    form.push('<button type="button" class="close" data-dismiss="modal" aria-hidden="true">x</button>');
    form.push('<h3 id="myModalLabel">');
    form = form.concat(header);
    form.push('</h3>');
    form.push('</div>');
    form.push('<div class="modal-body">');
    form.push('<p>');
    form = form.concat(body);
    form.push('</p></div>');
    form.push('<div class="modal-footer">');
    form = form.concat(footer);
    form.push('</div></div>');
    return form;
}

/**
 * function for fixing the ajax requests for django
 **/
function fixAjax(event, xhr, settings) {
  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  function sameOrigin(url) {
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
  }
  function safeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
  }
}

function limitChars(textid, limit, infodiv){
    var text = $('#'+textid).val();
    var textlength = text.length;
    if(textlength > limit){
        $('#' + infodiv).html('You cannot write more then '+limit+' characters!');
        $('#'+textid).val(text.substr(0,limit));
        return false;
    }else{
        $('#' + infodiv).html('You have '+ (limit - textlength) +' characters left.');
        return true;
    }
}

function previewCode(w, h){
    return ('<iframe id="frame" src="/authoring/mobile.html" style="width: '+w+'px; height: '+h+'px;"></iframe>');
}

function doPreview(id_dragged, id_iframe){
    var w = $("#"+id_dragged).width(), h = $("#"+id_dragged).height();
    $("#"+id_iframe).remove();
    makeAlertWindow(previewCode(w, h), 'Preview', w+60, h+140, id_iframe, 1000, "left");
    
    var $$ = jQuery = null;
    
    var code = $("#"+id_dragged).html();
    
    if($(code).find(".sh_dull").length > 0){
        code = $(".view-code").text();
    }
    
    $("#frame").load(function(){
        $$ = jQuery = window.frames[0].jQuery;
        $$("#home-content").append(code).trigger("create");
        
        var finds = $$("#home-content").find('.button-wrapper');
        for(var i=0;i<finds.length; i++){
            if($$(finds[i]).hasClass("button-camera")){
                $$(finds[i]).replaceWith('<div class="annotate-image"><a href="#"><img src="img/camera.png"></a><br><span class="annotate-image-title">'+$$(finds[i]).find("label").text()+'</span></div>')
            }else{
                $$(finds[i]).replaceWith('<div class="annotate-audio"><a href="#"><img src="img/audio.png"></a><br><span class="annotate-audio-title">'+$$(finds[i]).find("label").text()+'</span></div>')
            }
        }
    });
}

function giveFeedback(msg){
    if($("#feedback").length ===0){
        $("body").append(makeAlertModal("feedback", msg).join(""));
    }else{
        $("#feedback").find('.alert').html(msg);
    }
    $('#feedback').modal('show');
}

function loading(param){
    $("#loader").toggle(param);
    if(param){
        aria.notify("Loading");
    }else{
        aria.notify("Loaded");
    }
}

function simplify_name(title){
    if(title.indexOf(" (") >= 0){
        title = title.split(" (")[0];
    }
    return title;
}

function replaceSpace(title){
    if(title.indexOf(' ') >=0){
        title = title.replace(/ /g, "_")
        //console.log(title)
    }
    return title;
}


/*
    Find a label in the array of fields of a record

    @param{Array} fields
    @param{String} label
    @return{String}
*/
function findLabel(fields, label){
    for(i=0; i< fields.length; i++){
        if(fields[i].label == label){
            return fields[i].val;
        }
    }
}

/*
    Get the keys of a dictionary
*/
function getKeys(dict){
    keys = new Array();
    for(key in dict){
        keys.push(key);
    }
    return keys;
}

//check if it is a touchdevice the device that uses this webapp
function isTouchDevice(){
    try{
        document.createEvent("TouchEvent");
        return true;
    }
    catch(e){
        return false;
    }
};

//function for adding touch event on html elements. It's for old android devices where the scrolling of html elements is not working
function touchScroll(selector) {
    if(isTouchDevice()){
        var scrollStartPosY = 0;
        var scrollStartPosX = 0;
        
        $('body').delegate(selector, 'touchstart', function(e) {
            scrollStartPosY = this.scrollTop + e.originalEvent.touches[0].pageY;
            scrollStartPosX = this.scrollLeft + e.originalEvent.touches[0].pageX;
        });
        
        $('body').delegate(selector, 'touchmove', function(e) {
            if ((this.scrollTop < this.scrollHeight - this.offsetHeight &&
                this.scrollTop + e.originalEvent.touches[0].pageY < scrollStartPosY-5) ||
                (this.scrollTop != 0 && this.scrollTop+e.originalEvent.touches[0].pageY > scrollStartPosY+5)){
                e.preventDefault();
            }
            if ((this.scrollLeft < this.scrollWidth - this.offsetWidth &&
                this.scrollLeft+e.originalEvent.touches[0].pageX < scrollStartPosX-5) ||
                (this.scrollLeft != 0 && this.scrollLeft+e.originalEvent.touches[0].pageX > scrollStartPosX+5)){
                e.preventDefault();
            }
            
            this.scrollTop = scrollStartPosY - e.originalEvent.touches[0].pageY;
            this.scrollLeft = scrollStartPosX - e.originalEvent.touches[0].pageX;
        });
    }
}

function imgError(image) {
    image.onerror = "";
    image.src = image.src.replace("_thumb.", ".");
    //image.src = "img/404-not-found.gif";
    return true;
}