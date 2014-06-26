var MapViewer = function(options, base_url){
    this.options = options;
    this.mapdiv = this.options['map-elements'].mapId;
    this.tablediv = this.options['table-elements'].tableId;
    this.oTable;
    this.base_url = base_url;
    this.select_id;
    this.cursor;
    this.features;
}

MapViewer.prototype.init = function(){
    this.initElements();
    this.enableMap();
    this.openDialog();
    this.enableActions();
}

MapViewer.prototype.enableActions = function(){
    this.filterOptionsEnable();
    this.enableFiltering();
    this.enableExpandTable();
    this.clearFiltering();
    this.enableExportingMap();
    this.enableExportRecords();
    this.resizeMap();
    //this.enableHoverCheckbox();
}

//initialise the elements
MapViewer.prototype.initElements = function(){
    //initialise datetime picker
    $("#"+this.options["filter-elements"]["date-s-Id"]).datetimepicker({
        dateFormat: "yymmdd",
        showSecond: true,
        timeFormat: 'HH:mm:ss',
        stepSecond: 10
    });
    $("#"+this.options["filter-elements"]["date-e-Id"]).datetimepicker({
        dateFormat: "yymmdd",
        showSecond: true,
        timeFormat: 'HH:mm:ss',
        stepSecond: 10
    });
    //$("#"+this.options["filter-elements"]["filterId"]).hide();
    //$("#"+this.options["table-elements"]["tableId"]).hide();
}

//expand the filters when the user selects filter in the select menu or not
MapViewer.prototype.filterOptionsEnable = function(){
    $("#"+this.options["filter-elements"]["filter-options"]).change($.proxy(function(event){
        if($(event.currentTarget).val() === "Filter"){
            $("#"+this.options["filter-elements"]["filterId"]).show();
        }else{
            $("#"+this.options["filter-elements"]["filterId"]).hide();
            this.clearFilters();
        }
    }, this));
}

//clear filters
MapViewer.prototype.clearFilters = function(){
    $("#"+this.options["filter-elements"]["editorId"]).val("");
    $("#"+this.options["filter-elements"]["recordId"]).val("");
    $("#"+this.options["filter-elements"]["date-s-Id"]).val("");
    $("#"+this.options["filter-elements"]["date-e-Id"]).val("");
}

//initialize the map
MapViewer.prototype.enableMap = function(){
    //$("#"+this.options["viewer-btn"]).click($.proxy(function(){
        //$("#dialog-map").dialog("open");
        if(!$("#"+this.mapdiv).hasClass("olMap")){
            this.setMap();
        }
    //}, this));
}

//not sure if it's used
MapViewer.prototype.openDialog = function(){
    $("#expand-window").click($.proxy(function(event){
        if($(event.currentTarget).text() === "Expand"){
            $(event.currentTarget).text("Close");
            $("#dialog-map").dialog("open");
            $("#dialog-map").html($("#map-content").html());
            $("#map-content").empty();
            var filter = $("#filter-area").html();
            $("#filter-area").remove();
            $("#map_canvas").after('<div id="filter-area">'+filter+'</div>');
            this.enableActions();
            this.transferMap();
            this.openDialog();
            $("#filter-area").css("float", "right");
        }else{
            $(event.currentTarget).text("Expand");
            $("#dialog-map").dialog("close");
            $("#map-content").html($("#dialog-map").html());
            var filter = $("#filter-area").html();
            $("#filter-area").remove();
            $("#mapviewer-fieldset").append('<div id="filter-area">'+filter+'</div>');
            this.enableActions();
            this.transferMap();
            this.openDialog();
            $("#filter-area").css("float", "left");
        }
    }, this));
}

MapViewer.prototype.transferMap = function(){
    var layers = this.map.getLayersByName("Clusters");
    var strategies = layers[0].strategies;
    var features = layers[0].features;
    layers[0].removeAllFeatures();
    this.destroyMap();
    this.setMap();
    layers = this.map.getLayersByName("Clusters");
    layers[0].addFeatures(features);
}

//set map
MapViewer.prototype.setMap = function(){
    this.map = this.initMap();
}

//destroy map
MapViewer.prototype.destroyMap = function(){
    this.map.destroy();
    $("#"+this.mapdiv).empty();
}

//init map
MapViewer.prototype.initMap = function(){
    var bounds = new OpenLayers.Bounds (0, 0, 700000, 1300000);
    var apikey = "c7d4d08f1734c6e2ea97e554cf67eab709ff0bce6e2f4064ddc67a49";
    var cache = "true"; 
    var attr = "Contains Ordnance Survey data. (c) Crown copyright and database right 20XX. Data provided by Digimap OpenStream, an EDINA, University of Edinburgh Service.";
    var os_options = {
        token: apikey,
        format: "image/png",
        layers: "osopendata",
        cache: cache
    };

    var map = new OpenLayers.Map(this.mapdiv, {controls: [], 
        projection: new OpenLayers.Projection("EPSG:27700"),
        units: "m", 
        maxExtent: bounds,
        resolutions: [1763.889,352.778,176.389,88.194,35.278,26.458,17.639,8.819,3.528,1.764,0.882,0.441]
    });

    var osopenlayer = new OpenLayers.Layer.WMS( 
        "Edina OS OpenData WMS","http://openstream.edina.ac.uk/openstream/wms",
        os_options 
        /*{attribution: attr}*/);
    
    var base_url = this.base_url;
    var findThumbnail = function(param){
        var suffix = param || '';

        // Generate a function for get the right set of icons using a suffix.
        return function(feature){
            var img;

            if(feature.cluster !== undefined && feature.cluster.length > 1){
                if(feature.cluster.length < 10){
                    img = 'cluster1';
                }else if(feature.cluster.length < 20){
                    img = 'cluster1';
                }else{
                    img = 'cluster3';
                }
            }else{
                var record;
                if(feature.cluster){
                    record = feature.cluster[0].attributes;
                }else{
                    record = feature.attributes;
                }

                switch(record.editor){
                    case "text.edtr":
                        img = "textmarker";
                        break;
                    case "image.edtr":
                        img = "imagemarker";
                        break;
                    case "audio.edtr":
                        img = "audiomarker";
                        break;
                    case "track.edtr":
                        img = "routemarker";
                        break;
                    default:
                        img = "custommarker";
                }
            }
            return base_url+"img/"+img+suffix+".png";
        };
    };

    var defaultStyle = new OpenLayers.Style({
        pointRadius: "${radius}",
        'externalGraphic': '${thumbnail}',
        'graphicXOffset': '${offset_x}',
        'graphicYOffset': '${offset_y}',
        label: "${number}"
    }, {
        context: {
            width: function(feature) {
                return (feature.cluster) ? 2 : 1;
            },
            radius: function(feature) {
                var pix = 16;

                // Size for clustered markers
                if(feature.cluster && feature.cluster.length > 1) {
                    pix = Math.min(feature.attributes.count, 10) + pix;
                }
                return pix;
            },
            offset_x: function(feature){
                var x = 16;
                if(feature.cluster && feature.cluster.length > 1){
                    x = Math.min(feature.attributes.count, 10) + x;
                }
                return -x;
            },
            offset_y: function(feature){
                var y = 32;
                if(feature.cluster && feature.cluster.length > 1){
                    y = Math.min(feature.attributes.count, 10) + y - 16;
                }
                return -y;
            },
            thumbnail: findThumbnail(),
            number: function(feature){
                if(feature.cluster && feature.cluster.length > 1){
                    return feature.cluster.length;
                }
                return "";
            }
        }
    }); 


    var selectStyle = new OpenLayers.Style({
        'externalGraphic': '${thumbnail}'
    }, {
        context: {
            thumbnail: findThumbnail('_selected'),
    }});
    
    var clustering = new OpenLayers.Strategy.Cluster();

    var clusters = new OpenLayers.Layer.Vector("Clusters", {
        strategies: [
          //new OpenLayers.Strategy.Fixed()
          clustering
        ],
        styleMap: new OpenLayers.StyleMap({
            "default": defaultStyle,
            "select": selectStyle
        })
    });
    
    gpxFormat = new OpenLayers.Format.GPXExt();

    var gpx = new OpenLayers.Layer.Vector("GPX", {
        style: {strokeColor: "green", strokeWidth: 5, strokeOpacity: 1},
        projection: new OpenLayers.Projection("EPSG:4326"),
        format: gpxFormat
    });
    
    map.addControl(new OpenLayers.Control.Navigation());
    map.addControl(new OpenLayers.Control.PanZoom());
    map.addControl(new OpenLayers.Control.Attribution());
    
    var select = new OpenLayers.Control.SelectFeature(clusters, {hover: false});
    this.select_id = select.id;
    map.addControl(select);
    select.activate();
    clusters.events.on({"featureselected": $.proxy(this.feature_select, this)});
    clusters.events.on({"featureunselected": $.proxy(this.feature_unselect, this)});
    
    map.addLayers([osopenlayer, gpx, clusters]);

    var snap = new OpenLayers.Control.Snapping({
        layer: clusters,
        targets: [gpx],
        greedy: false
    });
    snap.activate();

    // Add panel
    var panel = new OpenLayers.Control.Panel({
                displayClass: "olControlEditingToolbar"
            });
    var draw = new OpenLayers.Control.DrawFeature(clusters,
                                                  OpenLayers.Handler.Point, 
                                                  {persist: true});
    var navigation = new OpenLayers.Control.Navigation({title: "Navigate"});
    panel.addControls([navigation, draw]);
    map.addControl(panel);
    draw.events.register("featureadded", null, $.proxy(this.onFeatureAdded, this));

    if (!map.getCenter()) map.zoomToMaxExtent();
    return map;
};

MapViewer.prototype.onFeatureAdded = function(evt){
    var mapviewer = this;
    var feature = evt.feature;
    var layer = this.map.getLayersByName("Clusters")[0];
    var url = "editors/default/text.edtr";
    var record = {};
    var title = {
                    'id': 'fieldcontain-text-1',
                    'label': 'Title',
                    'val': ''
                };
    var date = new Date(Date.now());
    var coord =  feature.geometry.clone()
                        .transform(new OpenLayers.Projection("EPSG:27700"), new OpenLayers.Projection("EPSG:4326"))
                        .getVertices()[0];
    var point = {};
    var trackLayer = this.map.getLayersByName("GPX")[0];

    point.lat = coord.y;
    point.lon = coord.x;

    record.editor = 'text.edtr';
    record.fields = [title];
    record.name = ''; 
    record.timestamp = date.toISOString();
    record.geofenceId = date.getTime().toString();
    record.point = point;
    record.trackId = trackLayer.features[0].attributes.trackId;
    
    feature.attributes = record;
    feature.data = record;

    $.ajax({
        type: "GET",
        url: url,
        dataType: "html",
        success: function(edit_data){
            //var path = mapviewer.options.version+'/'+mapviewer.options.provider+'/'+oauth;
            var path = '';
            var features = [feature];

            var recorder = new RecordRenderer(path, record.name, record.editor, 
                                              'edit-record-dialog', record.fields);
            var buttons = makeEditDialogButtons('edit-record-dialog', record, mapviewer, features, null);

            makeAlertWindow(edit_data, "Edit", 300, 400, "edit-record-dialog", 1000, "middle", buttons);
            recorder.render();
        }
    });

    // Release the draw control
    evt.object.deactivate();
    layer.redraw();
};

MapViewer.prototype.feature_select = function(evt){
    //$.each(event.featureselectedFeatures)
    for(var i=0; i<evt.feature.cluster.length; ++i) {
        $("#row-"+id).addClass("row_selected");
    }
};

MapViewer.prototype.feature_unselect = function(event){
    $(".row_selected").removeClass('row_selected');
};

MapViewer.prototype.enableFiltering = function(){
    $("#"+this.options["filter-elements"]["filter-btn"]).click($.proxy(function(){
        $("#"+this.options["table-elements"]["tableDiv"]).show();
        //var data = this.prepareFiltersString();
        //console.log($("#"+this.options["filter-elements"]["editorId"]).val())
        this.checkDisabled();
        this.getData(this.prepareFiltersString());
        $("#export-records").removeClass('disabled');
    }, this));
}

MapViewer.prototype.checkDisabled = function(){
    if($("#"+this.options["filter-elements"]["editorId"]).val() != ""){
        $("#"+this.options["map-elements"]["export"]).parent().removeClass('disabled');
        $("#"+this.options["map-elements"]["graph"]).parent().removeClass('disabled');
    }else{
        if(!$("#"+this.options["map-elements"]["export"]).parent().hasClass('disabled')){
            $("#"+this.options["map-elements"]["export"]).parent().addClass('disabled');
        }
        if(!$("#"+this.options["map-elements"]["graph"]).parent().hasClass('disabled')){
            $("#"+this.options["map-elements"]["graph"]).parent().addClass('disabled');
        }
    }
}

MapViewer.prototype.clearFiltering = function(){
    $("#"+this.options["filter-elements"]["clear-btn"]).click($.proxy(function(){
        this.clearFilters();
    }, this));
}

MapViewer.prototype.prepareFiltersString = function(frmt){
    var params = "";
    var filters = new Array();
    var editor = $("#"+this.options["filter-elements"]["editorId"]).val();
    
    if(editor != ""){
        filters.push("editor");
        params += "&id="+editor;
    }
    
    var dateStart = $("#"+this.options["filter-elements"]["date-s-Id"]).val(), dateEnd = $("#"+this.options["filter-elements"]["date-e-Id"]).val();
    
    if(dateStart != ""){
        filters.push("date");
        var splits1 = dateStart.split(" ");
        var splits2 = dateEnd.split(" ");
        params += "&start_date="+splits1[0]+"_"+splits1[1]+"&end_date="+splits2[0]+"_"+splits2[1];
    }
    
    if(frmt != undefined){
        filters.push("format");
        params += "&frmt="+frmt;
    }
    
    var dataString = "";
    if(filters.length > 0){
        dataString = "filter="+filters.join(",")+params;
    }
    return {"dataString": dataString};
}

MapViewer.prototype.getData = function(params){
    loading(true);
    $.ajax({
        type: "GET",
        url: this.buildUrl('records', '/'),
        data: params.dataString,
        dataType: "json",
        success: $.proxy(function(results){
            //console.log(results)
            if(results.error == 1){
                giveFeedback("Something went wrong with your synching. Please try again!");
                //this.clearTableData();
            }else{
                $("#expand-table").parent().removeClass("disabled");
                $("#export-map").parent().removeClass("disabled");
                var group = this.findGroupedData();
                var graph = new Grapher(this.options["map-elements"]["graph"], results.records, group);
                graph.init();
                //save all the record on localStorage for later use when undock/dock record viewer
                if(params.dataString == ""){
                    this.setRecordsForLS(results);
                    //window.localStorage.setItem("records", JSON.stringify(results));
                }
                //console.log(results)
                this.prepareTableDataForEditing(results);
            }
            loading(false);
        }, this)
    });
}

MapViewer.prototype.getSyncCursor = function(){
    var url = this.buildUrl('sync');
    console.debug("Sync download with cursor: " + url);
    $.ajax({
        type: "GET",
        dataType: "json",
        url: url,
        async: false,
        success: $.proxy(function(data){
          this.cursor = data.cursor
        }, this)
    });
}

MapViewer.prototype.syncWithCursor = function(){
    var url = this.buildUrl('sync', '/'+this.cursor);
    console.debug("Sync download with cursor: " + url);
    $.ajax({
        type: "GET",
        dataType: "json",
        url: url,
        success: $.proxy(function(data){
          $.each(data.deleted, $.proxy(function(id, path){
            var splits = path.split("/");
            if(splits.length == 3){
              this.updateRecordsInLS(splits[2]);
            }
          }, this))
          this.prepareTableDataForEditing(this.getRecordsFromLS());
          this.getSyncCursor();
        }, this)
    });
}

MapViewer.prototype.prepareTableDataForEditing = function(results){
    this.prepareTableDataForShowing(results, 'edit');
    this.enableRecordActions();
}

MapViewer.prototype.prepareTableDataForShowing = function(results, state){
    var res = this.prepareManyTableData(results.records, state);
    var l = this.updateFeaturesOnMap(res.features);
    this.initTable(res.table);
    this.filterTableData(l.features);
}

MapViewer.prototype.updateFeaturesOnMap = function(features){
    var layers = this.map.getLayersByName("Clusters");
    layers[0].removeAllFeatures();
    layers[0].addFeatures(features);
    return layers[0];
}

//preparing the object for the table data and the point features
MapViewer.prototype.prepareManyTableData= function(data, state){
    var features = new Array();
    var table_data = new Array();

    // Rearrange the array in order to display it as a tree
    var tracks = new Array();
    var pois = new Array();
    for(var i=0; i<data.length; i++){
        for(key in data[i]){
            if(data[i][key]['editor'] == "track.edtr"){
                tracks.push(data[i]);
            }else{
                track_id = data[i][key]['trackId'];
                if(track_id !== undefined){
                    if(pois[track_id] === undefined){
                        pois[track_id] = new Array();
                    }
                    pois[track_id].push(data[i]);
                }else{
                    console.warn("Not track id for POI: " + key);
                }
            }
            break; // Should be one key only
        }
    }

    data = Array();
    for(var i=0; i<tracks.length; i++){
        key = getKeys(tracks[i])[0];
        track_id = tracks[i][key]['geofenceId'];

        data.push(tracks[i]);
        if(pois[track_id] !== undefined){
            for(var j=0; j<pois[track_id].length; j++){
                data.push(pois[track_id][j]);
            }
        }
    }

    for(var i=0; i<data.length; i++){
        for(key in data[i]){
            var obj = this.prepareSingleTableData(key, data[i][key], i, state);
            table_data.push(obj.data);
            features.push(obj.feature);
        }
    }
    return {"table": table_data, "features": features};
}

MapViewer.prototype.prepareSingleTableData = function(folder, record, i, state){
    record['id'] = i;
    
    point =  new OpenLayers.Geometry.Point(record.point.lon, record.point.lat).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:27700"));
    description = findLabel(record.fields, 'Description') || '';
    feature = new OpenLayers.Feature.Vector(point, record);
    control = '';

    // Add styles for showing and hiding the poi's and the tracks
    styles = new Array();
    styles.push('record');
    if(record.editor == 'track.edtr'){
        styles.push('track', 'collapsed');
        trackId = record.geofenceId;
        buttons = '<button class="record-edit" title="'+folder+'" row="'+i+'" aria-label="Edit the name and the description of a track">Edit</button>';
        // buttons += '<button class="track-animate" title="'+folder+'" row="'+i+'" aria-label="Animate the track path">Animate</button>';
    }else{
        styles.push('poi', 'hidden');
        trackId = record.trackId;
        buttons = '<button class="record-edit" title="'+folder+'" row="'+i+'" aria-label="Edit the name and the description of a memory">Edit</button>';
    }

    data_obj = { 'id': i,
                 'name': folder,
                 'description': description,
                 'date': record.timestamp.split("T")[0],
                 'fields': record.fields,
                 'point' : point,
                 'control': control,
                 'trackId': trackId,
                 'recordId' : record.geofenceId,
                 'styles': styles,
                 'buttons': buttons,
                 'editor' : record.editor
                };

    return {"feature": feature, "data": data_obj};
}


MapViewer.prototype.initTable = function(table_data){
    var header_cols = [{"mData": "control"}, {"mData": "name"}, {"mData": "description"}, {"mData": "date"}, {"mData": "buttons"}];
    if(this.oTable == undefined){
        this.oTable = $("#"+this.options["table-elements"]["tableId"]).dataTable({
            "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
            "sPaginationType": "bootstrap",
            "bPaginate": false,
            "bSort": false,
            "aoColumns": header_cols,
            "aaData": table_data,
            "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
                $nRow = $(nRow);
                $nRow.attr("id", "row-" + aData.id)
                     .attr("tabindex", "0")
                     .attr("role", "row")
                     .attr("trackid", aData.trackId)
                     .attr("recordid", aData.recordId)
                     .attr("record-name", aData.name)
                     .addClass(aData.styles.join(' '));
            },
            "oLanguage": {
                "sInfo": "",
                "sInfoEmpty": "",
                "sInfoFiltered": "",
                "sInfoPostFix": ""
            }
        });
        this.enableTableKeyboardNavigation();
    }else{
        this.oTable.fnClearTable();
        this.oTable.fnAddData(table_data);
    }
}

MapViewer.prototype.enableExpandRow = function(records){
    $(document).off('click', '.record-expand');
    $(document).on('click', '.record-expand', $.proxy(function(event){
        var recordname = event.currentTarget.title;
        var row = $(event.currentTarget).attr("row");
        var nTr = $(event.currentTarget).parents('tr')[0];
        if ( this.oTable.fnIsOpen(nTr) ){
            $(event.currentTarget).text("Expand");
            this.oTable.fnClose(nTr);
        }else{
            $(event.currentTarget).text("Close");
            this.oTable.fnOpen( nTr, this.appendDetails(recordname, records), 'details' );
        }
    }, this));
}

MapViewer.prototype.appendDetails = function(recordname, records){
    var table = new Array();
    table.push('<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">');
    for(var i=0; i<records.length; i++){
        if(records[i].name === recordname){
            for(var j=0; j< records[i].fields.length; j++){
                table.push('<tr><td>'+records[i].fields[j].label+'</td><td>'+records[i].fields[j].val+'</td></tr>');
            }
        }
    }
    table.push('</table>');
    return table.join("");
}

MapViewer.prototype.enableExpandTable = function(){
    $("#expand-table").click($.proxy(function(event){
        if(event.currentTarget.title == "expand"){
            $("#"+this.options["table-elements"]["tableId"]).show();
            var target = $(event.currentTarget);
            target.text("Hide table");
            target.attr("title", "hide");
        }else{
            $("#"+this.options["table-elements"]["tableId"]).hide();
            var target = $(event.currentTarget);
            target.text("Show Table");
            target.attr("title", "expand");
        }
    }, this));
}

MapViewer.prototype.enableRecordActions = function(){
    this.enableRecordEdit();
    this.enableRecordDelete();
    this.enableTrackAnimation();
}


MapViewer.prototype.onEditRecord = function(evt){
    var oauth = this.options.oauth;
    var mapviewer = this;
    var oTable = this.oTable;
    var $row;
    var features = this.features;

    $target = $(evt.currentTarget);
    if($target.is("button")){
        $row = $target.closest('tr.record');
    }else{
        $row = $target;
    }

    var recordName = $row.attr('record-name');

    loading(true);
    $.ajax({
        url: mapviewer.buildUrl('records', '/'+recordName),
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            var editor = data.editor;
            var title = editor.split(".")[0];
            var field_values = data.fields;
            var url = mapviewer.buildUrl('editors', '/'+editor);
            if(editor === "image.edtr" || editor === "audio.edtr" || editor === "text.edtr"){
                url = "editors/default/"+editor;
            }
            if(editor === "track.edtr"){

                url = "editors/default/text.edtr";
                //mapviewer.displayGPX(record, data);
            }
            $.ajax({
                type: "GET",
                url: url,
                dataType: "html",
                success: function(edit_data){
                    var path = mapviewer.options.version+'/'+mapviewer.options.provider+'/'+oauth;
                    var recorder = new RecordRenderer(path, recordName, editor, 'edit-record-dialog', field_values);
                    var buttons = makeEditDialogButtons('edit-record-dialog', data, mapviewer, features, $row.get(0));

                    makeAlertWindow(edit_data, "Edit", 300, 400, "edit-record-dialog", 1000, "middle", buttons);
                    recorder.render();
                    loading(false);
                }
            });
            //need code to open a dialog with which the user will edit the data
        },
        error: function(jqXHR, status, error){
            loading(false);
            giveFeedback(JSON.parse(jqXHR.responseText)["msg"]);
        }
    });
}

MapViewer.prototype.onTrackAnimate = function(){
    loading(true);
    setTimeout(function () {
        loading(false);
    }, 1000);
}

MapViewer.prototype.enableTrackAnimation = function(){
    row = "#"+this.options["table-elements"]["tableId"]+" tbody tr";
    $(document).off('click', '.track-animate');
    $(document).on('click', '.track-animate', $.proxy(this.onTrackAnimate, this));


}

MapViewer.prototype.enableRecordEdit = function(){
    row = "#"+this.options["table-elements"]["tableId"]+" tbody tr";

    $(document).off('click', '.record-edit');
    $(document).on('click', '.record-edit', $.proxy(this.onEditRecord, this));

    $(document).off('edit_record', '.record-edit');
    $(document).on('edit_record', row, $.proxy(this.onEditRecord, this));
}

MapViewer.prototype.enableRecordDelete = function(){
    $(document).off('click', '.record-delete');
    $(document).on('click', '.record-delete', $.proxy(function(event){
        var record = $(event.currentTarget).attr("title");
        this.askForDeletion(record);
    }, this));
}

MapViewer.prototype.displayGPX = function(record, data, callback){
    var style = {
        "strokeColor": "rgb(255, 255, 0)",
        "strokeWidth": 5,
        "strokeOpacity": 1
    }

    var gpx;
    var style;
    var trackId = data.geofenceId;
    for(var i=0; i<data.fields.length; i++){
        if(data.fields[i]["id"].indexOf("fieldcontain-track") !== -1){
            style = data.fields[i]["style"];
            gpx =data.fields[i]["val"];
            break; // One gpx only
        }
    }

    if(gpx !== undefined){
        $.ajax({
            type: "GET",
            url: this.buildUrl('records', '/'+record+'/'+ gpx),
            dataType: "xml",
            success: $.proxy(function(gpx_data){
                var in_options = {
                    'internalProjection': this.map.baseLayer.projection,
                    'externalProjection': new OpenLayers.Projection("EPSG:4326")
                };
                var layers = this.map.getLayersByName("GPX");
                var gpx_format = new OpenLayers.Format.GPXExt(in_options);
                var gpx_features = gpx_format.read(gpx_data);
                gpx_features[0].attributes.trackId = trackId;

                layers[0].removeAllFeatures();
                layers[0].style = style;
                layers[0].addFeatures(gpx_features);
                // center to the middle of the whole GPX track
                this.map.zoomToExtent(layers[0].getDataExtent());
                if(callback !== undefined && typeof(callback) === "function")
                    callback();
            }, this)
        });
    }
}

MapViewer.prototype.onRowSelected = function(event){
    // Unselect the row selected and select the new and toggle aria-selected attribute
    this.oTable.$('tr.row_selected')
               .removeClass('row_selected')
               .attr('aria-selected', false);

    $(event.currentTarget).addClass('row_selected')
                .attr('aria-selected', true)
                .focus();

    //Center the map
    var recordId = parseInt(event.currentTarget.id.split("-")[1]);
    var feature = findFeaturesByAttribute(this.features, 'id', recordId);

    if(feature !== null){
        this.map.setCenter(feature.geometry.bounds.getCenterLonLat(), 11);
        this.displayGPX(feature.attributes.name, feature.attributes);
    }
};

/* 
    Find the track to which the element belongs in the table
    @returns a jquery element
*/
MapViewer.prototype._findClosestTrack = function(node){
    // Find the closest record
    
    $node = $(node);

    if($node.is("td")){
        $row = $node.parent('.record');
    }else{
        $row = $node;
    }

    trackid = $row.attr('trackid');

    // Find the closest track
    if($row.is('.record.track')){
        $track = $row;
    }else{
        $track = $row.siblings('.record.track[trackid="' + trackid + '"]');
    }

    return $track;
}

MapViewer.prototype.onRowExpanded = function(evt){
    var ariaMsg = '';
 
    $track = this._findClosestTrack(evt.currentTarget)

    trackName = $track.attr('record-name');

    if(!$track.is('.expanded')){
        // Collapse any other track expanded
        $track.siblings('.track')
              .removeClass('expanded')
              .addClass('collapsed')
              .attr('aria-expanded', 'false');     

        $track.siblings('.poi:not([trackid="' + trackid + '"])')
              .addClass('hidden');

        // Expand this track
        $track.removeClass('collapsed')
              .addClass('expanded')
              .attr('aria-expanded', 'true');

        $pois = $track.siblings('[trackid="' + trackid + '"]');
        $pois.removeClass('hidden');
    
        switch(n = $pois.length){
            case 0:
                ariaMsg = "No memories associated to " + trackName + " track.";
            break;
            case 1:
                ariaMsg = "Showing " + n + " memory for " + trackName + " track.";
            break;
            default:
                ariaMsg = "Showing " + n + " memories for " + trackName + " track.";
            break;
        }
        aria.notify(ariaMsg);
    }
}

MapViewer.prototype.onRowCollapsed = function(evt){
    // If click in the control find the row
    $track = this._findClosestTrack(evt.currentTarget)

    trackName = $track.attr('record-name');

    if($track.is('.expanded')){
        // Collapse it
        $track.removeClass('expanded')
              .addClass('collapsed');

        // Collapse children
        $track.siblings('[trackid="' + trackid + '"]')
              .addClass('hidden'); 
        aria.notify("Hiding memories for " + trackName + " track.")
    }
}

MapViewer.prototype.filterTableData = function(features){
    // Store the features for manipulate the map later
    this.features = features;

    row = "#"+this.options["table-elements"]["tableId"]+" tbody tr";
    first_cell = row + ".track td:first-child";

    // Bind the click event on the table to onRowSelected event
    $(document).off('click', row);
    $(document).on('click', row, $.proxy(this.onRowSelected, this));

    // Bind the row_selected event to onRowSelected event
    $(document).off('row_selected', row);
    $(document).on('row_selected', row, $.proxy(this.onRowSelected, this));

    // Bind the row_selected event to onRowExpanded event
    $(document).off('row_expanded', row);
    $(document).on('row_expanded', row, $.proxy(this.onRowExpanded, this));

    // Bind the row_selected event to onRowExpanded event
    $(document).off('rowCollapsed', row);
    $(document).on('rowCollapsed', row, $.proxy(this.onRowCollapsed, this));

    // Click the plus/minus symbol
    plus = row + ".track.collapsed td:first-child";
    $(document).off('click', plus);
    $(document).on('click', plus, $.proxy(this.onRowExpanded, this));

    minus = row + ".track.expanded td:first-child";
    $(document).off('click', minus);
    $(document).on('click', minus, $.proxy(this.onRowCollapsed, this));

}

MapViewer.prototype.enableTableKeyboardNavigation = function(){

    $(document).off('keyup', document);
    $(document).on('keyup', document, $.proxy(function(evt){
        var $table;
        var $target = $(evt.target);

        table_selector = "#" + this.options["table-elements"]["tableId"];    

        // Ignore events not related to the table or the record
        if($target.is(table_selector)){
            $table = $target;
        }else if($target.is(table_selector + ' tr.record'))
            $table = $target.closest(table_selector);
        else{
            return;
        }

        switch(evt.keyCode){
            case 40: // Down
                $row = $('.row_selected', $table);
                if($row.length == 0){
                    $('tbody tr:first', $table).trigger('row_selected');
                }else{
                    if(!$row.is(':last-child')){
                        $row.nextAll('.record:not( .hidden)')
                            .first()
                            .trigger('row_selected');
                    }
                }
            break;
            case 38: // Up
                $row = $('.row_selected', $table);
                if($row.length == 0){
                    $('tbody tr:last', $table).trigger('row_selected');
                }
                else{
                    if($row.index() > 0){
                        $row.prevAll('.record:not( .hidden)')
                            .first()
                            .trigger('row_selected');
                    }
                }
            break;
            case 61: // Plus
            case 107: // Plus Numpad
                $row = $('.row_selected', $table);
                $row.trigger('row_expanded', true);
            break;
            case 173: // Minus
            case 109: // Minus Numpad
                $row = $('.row_selected', $table);
                $row.trigger('rowCollapsed', false);
            break;
            case 13: // Enter
                $row = $('.row_selected', $table);
                $row.trigger('edit_record');
            break;
        }
    }, this));
}

MapViewer.prototype.clearTableData = function(){
    $("#"+this.options["table-elements"]["clear-btn"]).click(function(){
        $(".row_selected").removeClass('row_selected');
    });
}

MapViewer.prototype.enableExportingMap = function(){
    $("#"+this.options["map-elements"]["export"]).click($.proxy(function(event){
        if($(event.currentTarget).parent().hasClass('disabled')){
            giveFeedback("You need to filter records firstly in order to be able to export map!")
        }else{
            var map_code = this.createMapCode();
            this.uploadFile("map.html", "maps", map_code.join(""))
        }
    }, this));
}


MapViewer.prototype.createMapCode = function(){
    var mapcode = new Array();
    var records = window.localStorage.getItem("records");
    var graph = window.localStorage.getItem("graph");
    //console.log(JSON.parse(records))
    mapcode.push('<!DOCTYPE html>\n');
    mapcode.push('<html>\n');
    mapcode.push('<head>\n');
    mapcode.push('<meta charset=\"utf-8\">\n');
    mapcode.push('<link href="'+this.base_url+'css/former.css" rel="stylesheet" type="text/css">\n');
    mapcode.push('<link href="'+this.base_url+'css/bootstrap.min.css" rel="stylesheet" type="text/css">\n');
    mapcode.push('<link href="'+this.base_url+'css/bootstrap-responsive.min.css" rel="stylesheet" type="text/css">');
    mapcode.push('<link href="'+this.base_url+'css/DT_bootstrap.css" rel="stylesheet" type="text/css">');
    mapcode.push('<script type=\"text/javascript\" src=\"http://code.jquery.com/jquery-1.8.3.min.js\"></script>\n');
    mapcode.push('<script type=\"text/javascript\" src=\"'+this.base_url+'js/OpenLayers.js\"></script>\n');
    mapcode.push('<script type="text/javascript" src="http://fieldtripgb.edina.ac.uk/authoring/js/proj4js-compressed.js"></script>\n');
    mapcode.push('<script type=\"text/javascript\">\n');
    mapcode.push('Proj4js.defs[\"EPSG:27700\"] = \"+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs\";\n');
    mapcode.push('</script>\n');
    mapcode.push('<script src="http://d3js.org/d3.v3.min.js"></script>');
    mapcode.push('<script type="text/javascript" src="'+this.base_url+'js/jquery.dataTables.min.js"></script>\n');
    mapcode.push('<script type="text/javascript" src="'+this.base_url+'js/DT_bootstrap.js"></script>\n');
    mapcode.push('<script type=\"text/javascript\" src=\"'+this.base_url+'js/former/jquery.former.functions.js\"></script>\n');
    mapcode.push('<script type=\"text/javascript\" src=\"'+this.base_url+'js/former/jquery.former.mapviewer.js\"></script>\n');
    mapcode.push('<script type=\"text/javascript\">\n');
    mapcode.push('var records = '+records+';\n');
    //mapcode.push('console.log(records);\n');
    mapcode.push('$(document).ready(function(){\n');
    mapcode.push('  $("#map_canvas").width($(window).width());\n');
    mapcode.push('  $("#map_canvas").height(0.45*$(window).height());\n');
    mapcode.push('  var options = {\n');
    mapcode.push('    \"oauth\": "'+this.options.oauth+'",\n');
    mapcode.push('    \"table-elements\": {\n');
    mapcode.push('    \"tableDiv\": \"myTable\",\n');
    mapcode.push('    \"tableId\": \"example\",\n');
    mapcode.push('    \},\n');
    mapcode.push('    \"map-elements\": {\n');
    mapcode.push('    \"mapId\": \"map_canvas\",\n');
    mapcode.push('    \"export\": \"export-table\"\n');
    mapcode.push('    \}\n');
    mapcode.push('  \}\n');
    mapcode.push('  var mapviewer = new MapViewer(options, "'+this.base_url+'");\n');
    mapcode.push('  mapviewer.setMap();\n');
    mapcode.push('  var params = {"dataString": ""};');
    mapcode.push('  mapviewer.prepareTableDataForShowing(records, "show");\n');
    mapcode.push('  mapviewer.enableExpandRow(records.records);\n');
    //mapcode.push('  mapviewer.enableHoverCheckbox();\n');
    mapcode.push('});\n');
    mapcode.push('</script>\n');
    mapcode.push('</head>\n');
    mapcode.push('<body>\n');
    //mapcode.push('<p>Hover functionality: <input type="checkbox" name="enable-hover" id="enable-hover" checked="checked" /></li></p>\n');
    mapcode.push('<div id=\"map_canvas\" aria-hidden="true"></div>\n');
    mapcode.push('<div id="myTable" style="clear: both;" >\n');
    mapcode.push('<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered" id="example">\n')
    mapcode.push('<thead><tr><th>A/A</th><th>Record</th><th>Editor</th><th>Expand</th></tr></thead></table>\n');
    mapcode.push('</div>\n');
    mapcode.push(graph);
    mapcode.push('</body>\n');
    mapcode.push('</html>\n');
    return mapcode;
}

//not used
MapViewer.prototype.readAndUploadFile = function(filename){
  $.ajax({
    url: filename,
    dataType: "text",
    success: $.proxy(function(data){
      var splits = filename.split("/")
      var name = splits[splits.length-1];
      this.uploadFile(name, data);
    }, this)
  });
}

MapViewer.prototype.uploadFile = function(name, fld, senddata){
    loading(true);
    var oauth = this.options.oauth;
    var mapviewer = this;
    $.ajax({
        url: '/'+this.options.version+'/pcapi/fs/'+this.options.provider+'/'+oauth+'/'+fld+'/'+name,
        type: 'PUT',
        data: senddata,
        success: function(data) {
            $.ajax({
                url: this.buildUrl('export', '/'+fld+'/'+name),
                dataType: 'json',
                success: function(urldata){
                    giveFeedback('Your map has been created. Follow the <a href="'+urldata.url+'" target="blank">url</a> in order to check it. The url expires at '+urldata.expires);
                    loading(false);
                }
            });
        },
        error: function(jqXHR, textStatus, errorThrown){
            loading(false);
            giveFeedback("There was an error with your synchronization with dropbox.");
        }
    });
}

/**
 * function for checking if there are any checkboxes, radios or select menus. The
 * field that belongs to one of the above categories is going to becaome part of
 * the groups object in order to be used as grouping value in the graphs.
 */
MapViewer.prototype.findGroupedData = function(){
    var grouped = new Object();
    var editor = $("#"+this.options["filter-elements"]["editorId"]).val();
    if(editor != "" && editor != "text.edtr" && editor != "image.edtr" && editor != "audio.edtr"){
        $.ajax({
            type: "GET",
            url: this.buildUrl('editors', '/'+editor),
            dataType: "html",
            async: false,
            success: $.proxy(function(data){
                var finds = $(data).find(".fieldcontain")
                for(var i=0;i<finds.length; i++){
                    var splits = finds[i].id.split("-");
                    var type = splits[1];
                    if(type === "select" || type === "checkbox" || type === "radio"){
                        var values = this.getGroupValues(finds[i], type, splits[2])
                        var id = $(finds[i]).find('legend').text();
                        grouped[id] = values;
                    }
                }
            }, this)
        });
    }
    //console.log(grouped)
    return grouped;
}

MapViewer.prototype.getGroupValues = function(data, type, n){
    var element = type;
    if(type === "select"){
        element = "option";
    }
    var values = new Array();
    $(data).find("#form-"+type+"-"+n+" "+element).each(function(){
        if($(this).val() != ""){
            values.push($(this).val());
        }
    });
    return values;
}

MapViewer.prototype.enableExportRecords = function(){
    $("#export-records").click($.proxy(function(){
        var params = this.prepareFiltersString($("#export-format").val())
        window.open(this.buildUrl('records', '/?'+params.dataString));
    }, this));
}

MapViewer.prototype.askForDeletion = function(name){
    if($("#deleteModal").length === 0){
        $("body").append(appendDeleteDialog("deleteModal", name).join(""));
    }else{
        $("#del_record").text(name);
        $("#rec_for_deletion").val(name);
    }
    this.enableDeleteAction();
    $('#deleteModal').modal('show');
}

MapViewer.prototype.enableDeleteAction = function(){
    var record = $("#rec_for_deletion").val();
    $(document).off('click', '#delete_yes');
    $(document).on('click', '#delete_yes', $.proxy(function(){
        $.ajax({
            type: "DELETE",
            url: this.buildUrl('records', '/'+record),
            dataType: "json",
            success: $.proxy(function(data){
                $('#deleteModal').modal('hide');
                giveFeedback("Your record "+record+" was deleted!");
                //this.getData(this.prepareFiltersString());
                if(this.cursor == undefined){
                    this.getSyncCursor();
                }
                this.syncWithCursor();
            }, this)
        });
    }, this));
  
    $("#delete_no").click(function(){
        $('#deleteModal').modal('hide');
    });
}

MapViewer.prototype.getRecordsFromLS = function(){
    return JSON.parse(window.localStorage.getItem("records"));
}

MapViewer.prototype.setRecordsForLS = function(data){
    window.localStorage.setItem("records", JSON.stringify(data));
}

MapViewer.prototype.removeRecordsForLS = function(data){
    window.localStorage.removeItem("records");
}

MapViewer.prototype.updateRecordsInLS = function(record){
    var data = this.getRecordsFromLS();
    for(var i=0; i<data.records.length;i++){
        //console.log(editor, data.records[i].editor)
        if(record == data.records[i].name){
            data.records.splice(i, 1);
        }
    }
    this.removeRecordsForLS();
    this.setRecordsForLS(data);
}

MapViewer.prototype.resizeMap = function(){
    $(window).resize($.proxy(function() {
        // add the stuff here to execute the your slider again;
        if(this.map){
            this.map.updateSize();
        }
    }, this));
}

MapViewer.prototype.buildUrl = function(path, record){
    var url = '/'+this.options.version+'/pcapi/'+path+'/'+this.options.provider+'/'+this.options.oauth;
    if(record){
        url = url+record;
    }
    return url;
}
