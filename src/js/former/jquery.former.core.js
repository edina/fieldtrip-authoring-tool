/*!
 * jQuery lightweight plugin authoring tool
 * Original author: @panterz
 * Further changes, comments: @panterz
 */


// the semi-colon before the function invocation is a safety 
// net against concatenated scripts and/or other plugins 
// that are not closed properly.
;(function($, window, document, undefined){

  //the default options in case of not being initialized
    var defaults = {
        select_id: "",
        code_id: "",
        sizes: ["240x320", "320x480", "480x800", "600x1024"],
        form_elements_id: "",
        choices: {
            "textAction": ["text", "Text"],
            "radioAction": ["single", "One choice"],
            "checkboxAction": ["multiple", "Multiple choices"],
            "selectAction": ["select", "Select menu"],
            "sliderAction": ["slider", "Slider"],
            "textareaAction": ["textarea", "Textarea"],
            "photoAction": ["image", "Photo"],
            "audioAction": ["audio", "Audio"],
            "buttonAction": ["btn", "Button"]
        }
    };
  
  //the 
    var BuildFormer = function(element, options){
        this.element = element;
        this.options = $.extend(defaults, options || {});
        this.$element = $(element);
        this.id = this.$element.attr("id");
        this.is_built = false;
        this.version = this.options.version;
        this.provider = this.options.provider;
        this.image_pages = undefined;
    }
  
    BuildFormer.prototype.defaults = {
        mainmenu_id: "",
        editmenu_id: "",
        sizes: ["240x320", "320x480", "480x800", "600x1024"],
        form_elements_id: "",
        choices: {
            "textAction": ["text", "Text"],
            "radioAction": ["single", "One choice"],
            "checkboxAction": ["multiple", "Multiple choices"],
            "selectAction": ["select", "Select menu"],
            "sliderAction": ["slider", "Slider"],
            "textareaAction": ["textarea", "Textarea"],
            "photoAction": ["image", "Photo"],
            "audioAction": ["audio", "Audio"],
            "buttonAction": ["btn", "Button"]
        }
    }
  
    //initialize function
    BuildFormer.prototype.init = function(){
        var config = this.options;
        var main_menu = $("#"+config.mainmenu_id);
        var editmenu_id = $("#"+ config.editmenu_id);
        
        //add html for the main menu
        main_menu.html(this.createMainMenu().join(""));
        this.enableTooltips();
        //and enable all the buttons
        this.enableMainMenuEvents();
    
        //load the editors from dropbox
        this.loadEditors();
        //and the example ones
        this.loadGalleryForms();
    
        //load the home page
        //this.loadHomePage();
    
        //hide the edit elements initially
        this.showEditElements("map", false);
    
        //add html for the edit menu
        editmenu_id.find('.container').append(this.createEditMenu().join(""));
        $("#screen").html(this.createSelectMenu().join(""));
        $("#edit-buttons").html(this.createCodeMenu().join(""));
        this.createElementsMenu();
        //and enable events
        this.enableSelectMenuEvents();
        this.enableCodeMenuEvents();
        //the events of dragging, dropping, sorting, editing and deleting the elements
        this.enableEvents();
    
        return this;
  };
  
    BuildFormer.prototype.createMainMenu = function(){
        var menu = new Array();
        menu.push('<li><a href="javascript:void(0)" id="home" class="menu-item">Home</a></li>');
        menu.push('<li class="active"><a href="javascript:void(0)" rel="tooltip" data-placement="bottom" data-original-title="Click here to see your memories" id="my-records" class="menu-item">Memories Viewer</a></li>');
        menu.push('<li><a href="mailto:edina@ed.ac.uk" class="menu-item">Contact</a></li>');
        return menu;
    }
  
    BuildFormer.prototype.enableTooltips = function(){
        $("#create-form").tooltip();
        $("#my-editors").tooltip();
        $("#example-editors").tooltip();
        $("#my-records").tooltip();
    }
  
    //the events relating to the buttons of the create main menu
    BuildFormer.prototype.enableMainMenuEvents = function(){
        $(".menu-item").click(function(){
            $('#mainmenu .active').removeClass('active');
            $(this).parent().addClass("active");
        });
    
        this.enableHomeEvent();
        this.enableCreateFormEvent();
        this.enableMapViewer();
        this.importEvent();
        this.enableImageViewer();
        this.enableLayersEvent();
    }
  
    //the event of the home button, it hides all the edit menus and shows the home content
    BuildFormer.prototype.enableHomeEvent = function(){
        $("#home").click($.proxy(function(){
            this.clearAll();
            this.showEditElements("home", false);
        }, this));
    }
    
    //the event of the home button, it hides all the edit menus and shows the home content
    BuildFormer.prototype.enableLayersEvent = function(){
        $("#layers").click($.proxy(function(){
            $("#dialog-upload").dialog("open");
        }, this));
        
        var file;
        var url = this.buildUrl("tiles", "/")

        // Set an event listener on the Choose File field.
        $('#fileselect').bind("change", function(e) {
            var files = e.target.files || e.dataTransfer.files;
            // Our file var now holds the selected file
            file = files[0];
        });
    
        // This function is called when the user clicks on Upload to Parse. It will create the REST API request to upload this image to Parse.
        $('#uploadbutton').click(function() {
            var serverUrl = url + file.name;
            loading(true);
            $.ajax({
                type: "POST",
                beforeSend: function(request) {
                    request.setRequestHeader("X-Parse-Application-Id", 'MY-APP-ID');
                    request.setRequestHeader("X-Parse-REST-API-Key", 'MY-REST-API-ID');
                    request.setRequestHeader("Content-Type", file.type);
                },
                url: serverUrl,
                data: file,
                processData: false,
                contentType: false,
                success: function(data) {
                    alert("File was uploaded");
                    loading(false);
                },
                error: function(data) {
                    var obj = jQuery.parseJSON(data);
                    alert(obj.error);
                    loading(false);
                }
            });
        });
    }
  
    //event for creating a form from scratch
    BuildFormer.prototype.enableCreateFormEvent = function(){
        $("#create-form").click($.proxy(function(){
            this.showEditElements("form", true);
            this.clearAll();
            this.createMandatoryElement();
            this.enableActionButtons(true, true, false);
        }, this));
    }
  
    //event for giving name to a new form or an existing one
    BuildFormer.prototype.enableGiveFormName = function(){
        $("#give_form_name").click($.proxy(function(){
            var name = $.trim($("#id_formname").val());
            if(name != "text" && name != "image" && name != "track" && name != "audio"){
                if($("#form_title").text().length ===0){
                    this.appendTitle(name, false);
                    this.enableEditTitleButton();
                }else{
                    if($("#form_title").text() != $("#id_formname").val()){
                        this.updateSyncStatus(false);
                    }
                    $("#form_title").text(name);
                }
                $('#formModal').modal('hide');
                $("#formname-fbk").text("");
            }else{
                $("#formname-fbk").text("This name is used by the default editors of Authoring Tool. You need to use a different one!")
            }
        }, this));
    }
  
    //map viewer
    BuildFormer.prototype.enableMapViewer = function(){
        var oauth = this.options.oauth;
        //var bformer = this;
    
        var options = {
            "provider": this.provider,
            "version": this.version,
            "oauth": this.options.oauth,
            "viewer-btn": "my-records",
            "filter-elements": {
                "filter-options": "filter-data",
                "filterId": "filters",
                "date-s-Id": "date-start",
                "date-e-Id": "date-end",
                "editorId": "by-editor",
                "recordId": "by-record",
                "filter-btn": "filter-records",
                "clear-btn": "clear-records"
            },
            "table-elements": {
                "tableDiv": "myTable",
                "tableId": "example",
                "clear-btn": "clear-table"
            },
            "map-elements": {
                "mapId": "map_canvas",
                "export": "export-map",
                "graph": "graph"
            }
        }
        var base_url = $(location).attr('href').split("?")[0];
        var mapviewer = new MapViewer(options, base_url);
        mapviewer.init();
    
        $("#my-records").click($.proxy(function(){
            this.clearAll();
            this.showEditElements("map", false);
            $("#options-dialog").remove();
        }, this))
    }
    
    /**
     * function for displaying the images on the viewer
     */
    BuildFormer.prototype.enableImageViewer = function(){
        var bformer = this;
        var pages = this.image_pages;
        //after clicking the btn
        $("#image-view").click($.proxy(function(){
            loading(true);
            //get all images in url format
            $.ajax({
                type: "GET",
                url: this.buildUrl("records", "/assets/images/"),
                data: "frmt=url",
                dataType: "json",
                success: function(data){
                    loading(false);
                    //find the the width of the screen
                    var w = 0.90*$(window).width();
                    var h = 0.50*$(window).height();
                    /*if(pages){
                        var size=0;
                        for(var key in pages){
                            size += pages[key].length;
                        }
                        if(size != data.records.length){
                            makeWindow('viewer.html', 'Image Viewer', w, h, "image-window", null, 2000, "middle");
                            bformer.createImageViewer(data.records, pages);
                        }else{
                            $("#image-window").dialog("open");
                        }
                    }else{*/
                        makeWindow('viewer.html', 'Image Viewer', w, h, "image-window", null, 2000, "middle");
                        pages = new Object();
                        bformer.createImageViewer(data.records, pages);
                    //}
                    
                    
                }
            });
        }, this));
    }
    
    BuildFormer.prototype.createImageViewer = function(records, pages){
        var urls = new Array();
        //number of pages
        var pages_n = 0;
        for(var i=0; i<records.length;i++){
            //the name of th record
            var title = records[i].split("/")[0];
            //the url of the image
            var url = this.buildUrl("records", "/")+records[i];
            //the thumb url of the image
            var thumb_url = this.buildUrl("records", "/")+records[i].replace(".", "_thumb.");
            urls.push('<div class="img-item"><a rel="gallery-'+pages_n+'" href="'+url+'" class="swipebox" title="'+title+'"><img src="'+thumb_url+'" onerror="imgError(this);" class="img_thumb"><p>'+title+'</p></a></div>');
            
            //if we are at the last record and is less than ten then make a new page
            if(records.length == i+1){
                pages_n++;
                pages["page"+pages_n] = urls;
            }else if((i+1) % 10 == 0){ //if we had 10 records change page
                pages_n++;
                pages["page"+pages_n] = urls;
                urls = new Array();
            }
        }
        //build paginator
        $("#pagination").jPaginator({
            nbPages: pages_n,
            selectedPage:1,
            nbVisible:6,
            marginPx:4,
            overBtnLeft:'#test2_o_left',
            overBtnRight:'#test2_o_right',
            maxBtnLeft:'#test2_m_left',
            maxBtnRight:'#test2_m_right',
            withAcceleration:false,
            minSlidesForSlider:5,
            onPageClicked: function(a,num) {
                //add the thumbs on the dialog
                $("#thumbs").html(pages["page"+num].join(""));
                $(".swipebox").swipebox();
            }
        });
        
        var download_url = this.buildUrl("records", "/assets/images/?frmt=zip");
        $("#download_images").html('<a href="'+download_url+'" target="blank" class="btn">Download images</a>');
    }
    
    //the dialog for uploadig an edtr
    BuildFormer.prototype.importEvent = function(){
        var code = new Array();
        code.push('<div class="fieldWrapper">');
        code.push('<label for="id_file">File:</label>');
        code.push('<input type="file" name="file" id="id_file" />');
        code.push('</div>');
        code.push('<div class="fieldWrapper">');
        code.push('<div class="warning"></div>');
        code.push('</div>');
        $("#import").click($.proxy(function(){
            makeAlertWindow(code.join(""), "Import", 600, 400, "import-dialog", 1000, "middle");
            this.enableImportEvent();
        }, this));
    }
  
  //the event for getting the content and editing it with authoring tool
  BuildFormer.prototype.enableImportEvent = function(){
    var bformer = this;
    
    $("#id_file").change(function(event){
      var f = event.target.files[0];
      var splits = f.name.split(".");
      if(splits[1] === "edtr"){
        if (window.File && window.FileReader && window.FileList && window.Blob) {
          // Great success! All the File APIs are supported.
          var r = new FileReader();
          r.onload = function(e){
            var contents = e.target.result;
            
            bformer.appendExistingEditor(contents, false, splits[0]);
          }
          r.readAsText(f)
          $("#import-dialog").dialog("close");
        } else {
          $('.warning').html('The File APIs are not fully supported in this browser. So you cannot import an editor file from your local filesystem.');
        }
      }else{
        $('.warning').html('The extension of the file should be edtr.')
      }
    });
  }
  
  //loading the editors from dropbox
    BuildFormer.prototype.loadEditors = function(){
        //dropbox editors
        var bformer = this;
        loading(true);
        $.ajax({
            url: this.buildUrl('auth'),
            type: "GET",
            success: function(response){
                if(response.state == 1){
                    $("#user-section").show();
                    $(".username").text(response.name);
                    $.ajax({
                        type: "GET",
                        url: bformer.buildUrl("editors", "/"),
                        dataType: "json",
                        success: function(data){
                            var form_links = new Array();
                            var by_editor = new Array();
                            var editors = data.metadata;
                            by_editor.push('<option value="" selected="selected">All</option>');
                            by_editor.push('<option value="text.edtr">text.edtr</option>');
                            by_editor.push('<option value="image.edtr">image.edtr</option>');
                            by_editor.push('<option value="audio.edtr">audio.edtr</option>');
                            if(editors != undefined){
                                for(var i=0; i<editors.length; i++){
                                    var name = editors[i].split("/")[2];
                                    form_links.push('<li><a tabindex="-1" href="javascript: void(0)" class="get-form" title="'+name+'">'+name+'</a></li>');
                                    by_editor.push('<option value="'+name+'">'+name+'</option>');
                                }
                            }
                        
                            $(".get-form").remove();
                            $("#deditors").after(form_links.join(""));
                            $("#by-editor").html(by_editor.join(""));
                            loading(false);
                        
                            $(".get-form").click(function(){
                                var title = this.title.split(".")[0];
                                loading(true);
                                $.ajax({
                                    type: "GET",
                                    url: bformer.buildUrl("editors", "/"+this.title),
                                    dataType: "text",
                                    success: function(data){
                                        bformer.appendExistingEditor(data, true, title);
                                        bformer.enableActionButtons(false, false, false);
                                        loading(false);
                                    },
                                    error: function(jqXHR, status, error){
                                        loading(false);
                                        giveFeedback("The editor is not valid.");
                                    }
                                });
                            });
                        }
                    });
                }else{
                    loading(false);
                    giveFeedback("You need to refresh your page. The session with dropbox has problems!");
                }
            }
        });
    }
    
    //loading the example editors
    BuildFormer.prototype.loadGalleryForms = function(){
        $.getJSON('editors/gallery.json', $.proxy(function(data){
            var items = [];
            for(var i=0; i<data.metadata.length; i++){
                items.push('<li><a href="javascript:void(0)" class="get-example-form" title="'+data.metadata[i].split(".")[0]+'">'+data.metadata[i]+'</a></li>');
            }
            $("#editors-gallery").append(items.join(""));
            this.enableLoadExampleEditor();
        }, this));
    }
  
    //enable the events of the button for selecting an example form
    BuildFormer.prototype.enableLoadExampleEditor = function(){
        $(".get-example-form").click($.proxy(function(event){
            var bformer = this;
            var title = event.currentTarget.title;
            $.ajax({
                url: 'editors/'+title+".edtr",
                data: 'html',
                success: function(data){
                    bformer.appendExistingEditor(data, false, title);
                    bformer.enableActionButtons(true, false, false);
                }
            });
        }, this));
    }
    
    //load home page
    BuildFormer.prototype.loadHomePage = function(){
        this.$element.after('<div id="home-content"></div>');
        $.ajax({
            url: "home.html",
            dataType: "html",
            success: function(data){
                $("#home-content").append(data);
            }
        });
    }
  
    //html for the edit banner
    BuildFormer.prototype.createEditMenu = function(){
        var menu = new Array();
        menu.push('<ul class="nav" id="edit-buttons"></ul>');
        menu.push('<ul class="nav" id="screen"></ul>');
        return menu;
    }
    
    //html for the select menu
    BuildFormer.prototype.createSelectMenu = function(){
        var select = new Array();
        select.push('<li id="fat-menu" class="dropdown">');
        select.push('<a href="javascript:void(0)" id="rotation" role="button" class="dropdown-toggle" data-toggle="dropdown">Rotation <b class="caret"></b></a>');
        select.push('<ul class="dropdown-menu" role="menu" aria-labelledby="rotation">');
        select.push('<li><a tabindex="-1" href="javascript: void(0)" class="rotation" id="hor">Horizontally</a></li>');
        select.push('<li><a tabindex="-1" href="javascript: void(0)" class="rotation" id="ver">Vertically</a></li>');
        select.push('</ul>');
        select.push('</li>');
        select.push('<li id="size-screen" class="dropdown">');
        select.push('<a href="javascript:void(0)" id="sizes-screen" role="button" class="dropdown-toggle" data-toggle="dropdown">Size screen <b class="caret"></b></a>');
        select.push('<ul class="dropdown-menu" role="menu" aria-labelledby="sizes" id="select-sizes">');
        for(size in this.options.sizes){
            select.push("<li><a tabindex='-1' href='javascript: void(0)' title='"+this.options.sizes[size]+"' class='device-width'>"+this.options.sizes[size]+"</li>");
        }
        select.push("</ul>");
        select.push('</li>');
        select.push('<li id="actions" class="dropdown">');
        select.push('<a href="javascript:void(0)" id="save-actions" role="button" class="dropdown-toggle" data-toggle="dropdown">Actions <b class="caret"></b></a>');
        select.push('<ul class="dropdown-menu" role="menu" aria-labelledby="sizes" id="save-actions-list">');
        select.push('<li><a href="javascript:void(0)" id="save" class="btn">Update</a></li>');
        select.push('<li><a href="javascript:void(0)" id="delete" class="btn" role="button">Delete</a></li>');
        select.push('<li><a href="javascript:void(0)" id="synch" class="btn" role="button">Save</a></li>');
        return select;
    };
    
    //all the events relating to the select menu buttons
    BuildFormer.prototype.enableSelectMenuEvents = function(){
        var element = this.$element;
        var oauth = this.options.oauth;
        $(".device-width").click(function(){
          var values = $(this).attr("title").split("x");
          element.width(values[0]).height(values[1]);
        });
        
        $(".rotation").click(function(){
          var h = element.height();
          var w = element.width();
          if($(this).attr("id") === "hor"){
            if(w < h){
              element.width(h);
              element.height(w);
            }
          }else{
            if(w > h){
              element.width(h);
              element.height(w);
            }
          }
        });
        
        $("#save").click($.proxy(function(){
            var bformer = this;
            if($("#form_title").text().length === 0){
                //give feedback here with a modal window
                //giveFeedback("You need to give a name your form in order to synchronize it!");
                this.showFormName();
            }else{
                var text_code = this.prepareCode();
                loading(true);
                $.ajax({
                    url: bformer.buildUrl("editors", '/'+encodeURIComponent($("#form_title").text()+'.edtr')),
                    type: 'PUT',
                    data: text_code.join(""),
                    success: function(data) {
                        giveFeedback("Your form has been uploaded");
                        bformer.loadEditors();
                        bformer.addEditButtons();
                        bformer.updateSyncStatus(true);
                        loading(false);
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        loading(false);
                        giveFeedback("There was an error with your synchronization with dropbox.");
                    }
                });
            }
        }, this));
        
        $("#synch").click($.proxy(function(){
            var bformer = this;
            if($("#form_title").text().length === 0){
                //give feedback here with a modal window
                //giveFeedback("You need to give a name your form in order to synchronize it!");
                this.showFormName();
            }else{
                var text_code = this.prepareCode();
                loading(true);
                $.ajax({
                    url: bformer.buildUrl("editors", '/'+encodeURIComponent($("#form_title").text()+'.edtr')),
                    type: 'POST',
                    cache: false,
                    data: text_code.join(""),
                    success: function(data) {
                        if(data.error == 0){
                            giveFeedback("Your form has been uploaded");
                            bformer.loadEditors();
                            //bformer.clearAll();
                            //bformer.createMandatoryElement();
                            bformer.updateSyncStatus(true);
                        }else{
                            giveFeedback(data.msg);
                        }
                        loading(false);
                    }
                });
            }
        }, this));
        
        $("#delete").click($.proxy(function(){
            var bformer = this;
            loading(true);
            $.ajax({
                url: bformer.buildUrl('editors', '/'+escape($("#form_title").text()+'.edtr')),
                type: 'DELETE',
                success: function(data) {
                    giveFeedback("Your form has been deleted");
                    bformer.loadEditors();
                    bformer.clearAll();
                    bformer.createMandatoryElement();
                    loading(false);
                },
                error: function(jqXHR, textStatus, errorThrown){
                    loading(false);
                    giveFeedback("There was an error with your synchronization with dropbox.");
                }
            });
        }, this));
    };
  
    //html for code menu
    BuildFormer.prototype.createCodeMenu = function(){
        var code = new Array();
        code.push('<li class="dropdown">');
        code.push('<a href="javascript:void(0)" role="button" class="dropdown-toggle" data-toggle="dropdown">Mode <b class="caret"></b></a>');
        code.push('<ul class="dropdown-menu" role="menu">');
        code.push('<li><a href="javascript:void(0)" id="edit">Edit</a></li>');
        code.push('<li><a href="javascript:void(0)" id="preview">Preview</a></li>');
        code.push('<li><a href="javascript:void(0)" id="code">Code</a></li>');
        code.push('</ul>');
        code.push('</li>');
        return code;
    }
  
    //the events related to the code menu buttons
    BuildFormer.prototype.enableCodeMenuEvents = function(){
        $("#code").click($.proxy(function(event){
            var code = $(".view-code").text();
            if(!$(event.currentTarget).hasClass("active") && code === ""){
                this.removeEdits();
                var form = this.$element.html();
                this.$element.html("<pre class='view-code'></pre>");
                $(".view-code").text(form);
                this.$element.width(600);
                this.$element.height(600);
                $("pre.view-code").snippet("html", {style:"dull", showNum:false, menu:true});
            }
        }, this));
      
        $("#edit").click($.proxy(function(){
            var code = $(".view-code").text();
            if(code != ""){
                this.$element.html($(".snippet-textonly").text());
            }
            this.addEditButtons();
            $(".fieldcontain").removeClass('fieldcontain_preview');
        }, this));
    
        $("#preview").click($.proxy(function(){
            doPreview(this.id, "iframe");
        }, this));
    }
  
    BuildFormer.prototype.prepareCode = function(){
        var code = "";
        var rand_number = Math.floor(Math.random()*1100);
        var name = $("#form_title").text();
        if($(".view-code").text() === ""){
            this.removeEdits();
            code = this.$element.html();
            this.appendEditButtons();
        }else{
            code = $(".snippet-textonly").text();
        }
        //get rid of readonly
        var i = $(code).find('input[type="text"]').length;
        i = i+$(code).find('textarea').length;
        for(var j=0;j<i;j++){
            code = code.replace('readonly="readonly"', '');
        }
        code = code.replace('"', '\"');
        var text_code = new Array();
        text_code.push('<form id=\"form'+rand_number+'\" data-ajax=\"false\">\n')
        text_code.push(code);
        name = replaceSpace(simplify_name(name));
        text_code.push('\n<div id=\"'+name.toLowerCase()+'-buttons\" class=\"fieldcontain ui-grid-a\">');
        text_code.push('\n<div class=\"ui-block-a\">');
        text_code.push('\n<input type=\"submit\" name=\"record\" id=\"'+rand_number+'_record\" value=\"Save\">');
        text_code.push('\n</div>');
        text_code.push('\n<div class="ui-block-b">');
        text_code.push('\n<input type=\"button\" name=\"cancel\" id=\"'+rand_number+'_cancel\" value=\"Cancel\">');
        text_code.push('\n</div>');
        text_code.push('\n</div>');
        text_code.push('\n</form>');
        return text_code;
    }
  
    BuildFormer.prototype.createElementsMenu = function(){
        var elements = new Array();
        for(option in this.options.choices){
            //elements.push('<li class="dragging-element former-box"><span class="box" id="'+this.options.choices[option][0]+'">'+this.options.choices[option][1]+'</span></li>');
            elements.push('<li class="dragging-element former-box"><a href="javascript:void(0)" class="btn btn-primary btn-large" id="'+this.options.choices[option][0]+'">'+this.options.choices[option][1]+'<i class="icon-chevron-right"></i></a></li>');
        }
        $("#"+this.options.form_elements_id).append(elements.join(""));
    };
  
    BuildFormer.prototype.createMandatoryElement = function(){
        var finds = this.$element.find(".fieldcontain");
        if(finds.length == 0){
            var choices = this.options.choices;
            var elements = this.getElements();
            var action = new Action(choices, this.id, elements);
            action.addElement("Text");
            //$(this.element).append(firstelement.join(""));
        }
        this.addEditButtons();
    }
  
    //enable the events for dragging, dropping, sorting, editing and deleting elements
    BuildFormer.prototype.enableEvents = function() {
        this.enableDragging();
        this.enableDropping();
        this.enableSorting();
        this.enableDeleteFieldcontain();
        this.enableEditFieldcontain();
    }
  
    BuildFormer.prototype.enableDragging = function(){
        $("#"+this.options.form_elements_id+" li").draggable({
            appendTo: "body",
            helper: "clone",
            iframeFix: true,
            start: function(event, ui){
            }
        });
    }
  
    BuildFormer.prototype.enableDropping = function(){
        var el = this.id;
        var choices = this.options.choices;
        var elements = this.getElements();
        var bformer = this;
        this.$element.droppable({
            activeClass: "ui-state-default",
            hoverClass: "ui-state-hover",
            accept: ":not(.ui-sortable-helper)",
            drop: function(event, ui){
                var action = new Action(choices, bformer.id, bformer.getElements());
                action.addElement(ui.draggable.children().text());
                bformer.updateSyncStatus(false);
                if($("#iframe").length > 0){
                    $("#iframe").remove();
                }
            }
        });
    }
  
    BuildFormer.prototype.enableSorting = function(){
        var bformer = this;
        $("#"+this.id).sortable({items: "div.fieldcontain", handle: '.handle', change: function(event, ui){
            bformer.updateSyncStatus(false);
        }});
    }
    
    BuildFormer.prototype.enableDeleteFieldcontain = function(){
        var bformer = this;
        $(document).off('click', '.delete-field');
        $(document).on('click', '.delete-field', function(){
            $(this).parent().parent().remove();
            $("#options-dialog").remove();
            bformer.updateSyncStatus(false);
            if($("#iframe").length > 0){
                $("#iframe").remove();
            }
        });
    }
  
    BuildFormer.prototype.enableEditFieldcontain = function(){
        $(document).off('click', '.edit-field');
        $(document).on('click', '.edit-field', $.proxy(function(event){
            var id = $(event.currentTarget).parent().parent().attr("id");
            this.enableEditing(id);
        }, this));
    }
    
    
    BuildFormer.prototype.clearAll = function(){
        this.$element.html("");
        $("#form_title").html("");
    }
    
    BuildFormer.prototype.enableActionButtons = function(save, del, saveas){
        $("#save").toggleClass("disabled", save);
        $("#synch").toggleClass("disabled", saveas);
        $("#delete").toggleClass("disabled", del);
    }
  
  /**
   * function for showing/hiding different pages of the app (home, map viewer, form editor)
   * @state: variable for showing which page to show/hide
   * @dialogNameState: variable for showing the form for giving name to a new form
   **/
    BuildFormer.prototype.showEditElements = function(state, dialogNameState){
        if(state === "form"){
            $("#home-content").hide('fast');
            $("#map-content").hide('fast');
            //$("#help-fieldset").hide('fast');
            $("#f_title").show('fast');
            $("#mapviewer-fieldset").hide("fast");
            $("#export-fieldset").hide("fast");
            $("#elements-fieldset").show('fast');
            this.initializeFrameSize();
            this.$element.show('fast');
            $("#"+this.options.editmenu_id).show('fast');
            $("#"+this.options.form_elements_id).show('fast');
        }else{
            this.$element.hide('fast');
            $("#elements-fieldset").hide('fast');
            $("#f_title").hide('fast');
            $("#"+this.options.editmenu_id).hide('fast');
            $("#"+this.options.form_elements_id).hide('fast');
            if(state === "home"){
                $("#map-content").hide('fast');
                $("#mapviewer-fieldset").hide("fast");
                $("#export-fieldset").hide("fast");
                $("#home-content").show('fast');
                $("#logout-paragraph").show("fast");
            }else{
                $("#home-content").hide("fast");
                $("#mapviewer-fieldset").show("fast");
                $("#export-fieldset").show("fast");
                $("#map-content").show("fast");
            }
        }
        
        if(dialogNameState === true){
            this.showFormName("");
        }
    }
    
    BuildFormer.prototype.showFormName = function(name){
        if($("#formModal").length === 0){
            $("body").append(appendFormName("formModal", name).join(""));
            this.enableGiveFormName();
        }
        $('#formModal').modal('show');
    }
  
    //enable edit mode of buildformer
    BuildFormer.prototype.appendExistingEditor = function(data, sync, title){
        this.showEditElements("form", false);
        var ndata = $(data);
        //var titl = ndata.attr('title');
        //$("#f_title").html('<h3>Title: <span id="form_title">'+title+'</span></h3>  <button type="button" id="edit-f-title" class="btn btn-primary btn-small">Edit</button>');
        this.appendTitle(title, sync);
        title = simplify_name(title);
        var cleared_data = ndata.find('.fieldcontain');
        $("#"+this.id).html(cleared_data);
        $("#"+this.id).find('input[type="text"]').attr("readonly", "readonly");
        $("#"+this.id).find('textarea').attr("readonly", "readonly");
        title = replaceSpace(title);
        $('#'+title.toLowerCase()+'-buttons').remove();
        this.addEditButtons();
    }
  
    //initialize the size of the frame where the elements will be dragged
    BuildFormer.prototype.initializeFrameSize = function(){
        var initial_size = this.options.sizes[1].split("x");
        this.$element.width(initial_size[0]).height(initial_size[1]);
    }
    
    BuildFormer.prototype.enableEditing = function(id){
        var bformer = this;
        var splits = id.split("-");
        var type = splits[1];
        var i = splits[2];
        var searcher = new Searcher(id, type, $);
        var results = searcher.search();
        var optionsForm = new OptionsForm(type, results.title, results.placeholder, results.required, results.group, bformer.getElements(), results.value, i);
        
        if(type === "range"){
            makeAlertWindow(optionsForm.create(null, results.range[0], results.range[1], results.range[2]).join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
        }else if(type === "text"){
            makeAlertWindow(optionsForm.create(results.maxlength).join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
        }else{
            makeAlertWindow(optionsForm.create().join(""), 'Options', 260, 400, 'options-dialog', 1000, "right", makeDialogButtons('options-dialog', this.target));
        }
        optionsForm.enableEvents[type](i, this.id)
    }
  
    BuildFormer.prototype.getElements = function(){
        var elements = new Array();
        for(choice in this.options.choices){
            elements.push(this.options.choices[choice][0])
        }
        return elements;
    }

    BuildFormer.prototype.addEditButtons = function(){
        var finds = this.$element.find(".fieldcontain");
        for(var i=0;i<finds.length;i++){
            if(finds[i].id != ""){
                var splits = $(finds[i]).attr("id").split("-");
                if(splits[1] === "text" && splits[2] === "1"){
                    this.appendEditButtons($(finds[i]).attr("id"));
                }else{
                    this.appendEditDeleteButtons($(finds[i]).attr("id"));
                }
            }
        }
        this.enableEditTitleButton();
        this.enableSorting();
    }
  
    BuildFormer.prototype.enableEditTitleButton = function(){
        $("#edit-f-title").click($.proxy(function(){
            this.showFormName($("#form_title").text());
        }, this));
    }
  
    BuildFormer.prototype.appendEditButtons = function(id){
        $("#"+id).prepend( "<div class='handle'><span class='ui-icon ui-icon-carat-2-n-s'></span></div>" );
        $("#"+id).append('<div class="fieldButtons"><a class="btn edit-field" href="javascript:void( 0);"><i class="icon-pencil"></i></a></div>');
    }
  
    BuildFormer.prototype.appendEditDeleteButtons = function(id){
        $("#"+id).prepend( "<div class='handle'><span class='ui-icon ui-icon-carat-2-n-s'></span></div>" );
        $("#"+id).append('<div class="fieldButtons"><a class="btn edit-field" href="javascript:void( 0);"><i class="icon-pencil"></i></a><a class="btn delete-field" href="javascript:void( 0);"><i class="icon-remove-sign"></i></a></div>');
    }

    BuildFormer.prototype.removeEdits = function(){
        $(".handle").remove();
        $(".fieldButtons").remove();
    }
    
    BuildFormer.prototype.appendTitle = function(title, sync){
        $("#f_title").html('<strong style="font-size: 20px;">Title: <span id="form_title">'+title+'</span></strong>  <button type="button" id="edit-f-title" class="btn btn-primary btn-small">Edit</button>  <span id="sync_status" class="label"></span>');
        this.updateSyncStatus(sync);
    }
  
    BuildFormer.prototype.updateSyncStatus = function(sync){
        if(sync == true){
            $("#sync_status").removeClass("label-warning").addClass("label-success").text("Synchronized");
        }else{
            $("#sync_status").removeClass("label-success").addClass("label-warning").text("Unsynchronized");
        }
    }
    
    BuildFormer.prototype.buildUrl = function(path, ext){
        var url = '/'+this.version+'/pcapi/'+path+'/'+this.provider+'/'+this.options.oauth;
        if(ext){
            url = url+ext;
        }
        return url;
    }
    
    BuildFormer.defaults = BuildFormer.prototype.defaults;
        $.fn.buildformer = function(options){
            return this.each(function(){
            new BuildFormer( this, options ).init();
        });
    }
    
    window.BuildFormer = BuildFormer;

})(jQuery, window, document);
