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


function makeEditDialogButtons(dialogId, record, mapviewer, features, row, callback){
    if(typeof(callback) !== 'function'){
        callback = function(){};
    }

    var buttons = [];

    var saveButton = {
        'text': 'Save',
        'class': 'save-button',
        'click': function(){
            var dialogDiv = "#"+dialogId;

            // Get all the values from the form as records in an array
            var formFields = $.map($('.fieldcontain', dialogDiv), function(div){
                                    return getFieldFromEditForm(dialogId, div.id);
                                });

            // Create an inverse index for the actual fields in the record
            var fieldsIndex = {};
            for(var i = 0; i < record.fields.length; i++){
                fieldsIndex[record.fields[i].id] = i;
            }

            // Update the record with the new values
            for(var i=0; i<formFields.length; i++){
                var j = fieldsIndex[formFields[i].id];
                if(j === undefined){
                    record.fields.push(formFields[i]);
                }else{
                    // Change only the val ?
                    record.fields[j].val = formFields[i].val;
                }
            }

            // OLD name
            var oldName = $("#form-text-hidden-1", dialogDiv).val();
            // NEW name
            record.name = $("#form-text-1", dialogDiv).val();


            var success = function(data){
                $row = $(row);
                var index = $row.index();
                var description = findLabel(record.fields, "Description");

                // if its a new record
                if(row === null){
                    var nRecords = mapviewer.oTable.fnGetData().length;
                    var data_obj = mapviewer.prepareSingleTableData(record.name, record, nRecords, '');
                    var index = mapviewer.oTable.fnAddData(data_obj.data)[0];
                }else{
                    // Update the table
                    mapviewer.oTable.fnUpdate(record.name, index, 1, false);
                    mapviewer.oTable.fnUpdate(description, index, 2, false);

                    // Update the table elements
                    $row.attr('record-name', record.name);
                    $(".record-edit", $row).attr("title", record.name);
                    $(".record-delete", $row).attr("title", record.name);
                }
                // Update the feature in the map
                //features[0].cluster[index].attributes = record;
                //features[0].cluster[index].attributes.id = index;

                loading(false);
                $("#"+dialogId).dialog('close');
                callback(true);
            };
            var error = function(data){
                console.warn('Error uploading the record')
                loading(false);
                $("#"+dialogId).dialog('close');
                callback(false);
            };

            // If record is new or the name didn't change
            if(oldName === '' || oldName == record.name){
                loading(true);
                PCAPI.putRecord(record.name, record, success, error);
            }else{
                loading(true);
                PCAPI.renameRecord(oldName, record, success, error);
            }
        }
    };

    var cancelButton = {
            'text': 'Cancel',
            'class': 'cancel-button',
            'click': function(){
                $("#"+dialogId).dialog('close');
                callback(false);
            }
    };

    buttons.push(saveButton, cancelButton);
    return buttons;
}

/*
*   Get a record from the edit form
*   @param{String} dialogId div id of the dialog
*   @param{String} fieldId: div id of the field
*   @return{Object} return a field (id, val, label)
*/
function getFieldFromEditForm(dialogId, fieldId){
    var type;
    var fieldDiv;
    var val;
    var field = {};

    type = fieldId.split("-")[1];
    fieldDiv = "#" + dialogId + " #"+ fieldId;
    field.id = fieldId;
    field.label = $("label", fieldDiv).text();

    switch(type){
        case 'text':
        case 'range':
        case 'track':
            val = $("input", fieldDiv).val();
            break;
        case 'textarea':
            val = $("textarea", fieldDiv).val();
            break;
        case 'checkbox':
            val = $("input[type=checkbox]:checked", fieldDiv).val();
            break;
        case 'radio':
            val = $("input[type=radio]:checked", fieldDiv).val();
            break;
        case 'select':
            val = $("select option:selected", fieldDiv).val();
            break;
        case 'image':
            var splits = $("img", fieldDiv).attr("src").split("/");
            val = splits[splits.length-1];
            break;
        case 'audio':
            var splits = $("audio", fieldDiv).attr("src").split("/");
            val = splits[splits.length-1];
            break;
    }
    field.val = val;
    return field;
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

function loading(param, ariamsg){
    $("#loader").toggle(param);
    if(param){
        aria.notify(ariamsg || "Loading");
    }else{
        aria.notify(ariamsg || "Loaded");
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

/*
    Find a feature by attribute in an array of features
    or array of clustered features
*/
function findFeaturesByAttribute(features, attr, value){
    var feature = null;
    for(var j=0; j<features.length; j++){
        // If it is a cluster, iterate over the clustered features
        if(features[j].cluster !== undefined){
            for(var i=0; i<features[j].cluster.length; i++){
                if(features[j].cluster[i].attributes[attr] === value){
                    feature = features[j].cluster[i];
                    break;
                }
            }
        }else if(features[j].attributes[attr] === value){
                feature = features[j];
        }
        if(feature !== null){
            break;
        }
    }
    return feature;
}

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

/* polyfill for old IE */
if ( !Date.prototype.toISOString ) {
  ( function() {

    function pad(number) {
      if ( number < 10 ) {
        return '0' + number;
      }
      return number;
    }

    Date.prototype.toISOString = function() {
      return this.getUTCFullYear() +
        '-' + pad( this.getUTCMonth() + 1 ) +
        '-' + pad( this.getUTCDate() ) +
        'T' + pad( this.getUTCHours() ) +
        ':' + pad( this.getUTCMinutes() ) +
        ':' + pad( this.getUTCSeconds() ) +
        '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
        'Z';
    };

  }() );
}

/* String.startsWith polyfill */
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (searchString, position) {
      position = position || 0;
      return this.lastIndexOf(searchString, position) === position;
    }
  });
}

/*
    Add formated data method to String
    Use: "{0} {1}".format('hello', 'world')
*/

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

/* Tile to Long/Lat functions from the openstreetmap wiki */

function lonlat2tile(lon, lat, zoom){
    var tile = {};
    tile.x = lon2tile(lon, zoom);
    tile.y = lat2tile(lat, zoom);
    tile.z = zoom;
    return tile;
}

function tile2lonlat(x, y, zoom){
    var point = {};
    point.lon = tile2lon(x, zoom);
    point.lat = tile2lat(y, zoom);
    point.zoom = zoom;
    return point;
}

function lon2tile(lon, zoom) {
    return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}

function lat2tile(lat, zoom)  {
    return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}

function tile2lon(x, zoom) {
    return ((x / Math.pow(2,zoom) * 360) - 180);
}

function tile2lat(y, zoom) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,zoom);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

/*  Get the closest zoom in Open Street Map to given scale
    http://wiki.openstreetmap.org/wiki/Zoom_levels
*/

function getOSMZoom(resolution, latitude){
    //6378137.0 * 2 * pi / 256 = 156543.034 meters/pixel
    var zoom = Math.log((156543.034 * Math.cos(latitude*Math.PI/180)) / resolution) / Math.log(2);
    return Math.ceil(zoom);
}

function imgError(image) {
    image.onerror = "";
    image.src = image.src.replace("_thumb.", ".");
    //image.src = "img/404-not-found.gif";
    return true;
}