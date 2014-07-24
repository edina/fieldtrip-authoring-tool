/*
  Extension for generating location files, a new layer and tool are inserted
  in the map and a form control is inserted in the DOM.

  @param map An instance of a openlayers map
  @param selector A div where the control will be inserted
*/

var LocationFile = function(map, selector, options){
    var defaults = {
        minRadius: 100,
        olToolBarClass: 'olLocationFileToolBar',
        olToolClass: 'olLocationFileDrawFeature'
    };

    this.options = $.extend(defaults, options);
    this.map = map;
    this.controlSelector = selector;
    this.layer = null;
    this.control = null;
    this.panel = null;
    this.initMap();
    this.initDomControls();
};

LocationFile.prototype.initDomControls = function(){
    this.initLocationControl();
    this.initSpinnerControl();

    var layer = this.layer;
    var locationFile = this;
    $('#create-location').click(function(){
        var feature = layer.features[0];
        locationFile.generateFile(feature);
    });
};

LocationFile.prototype.initMap = function(){
    var map = this.map;
    var layer = new OpenLayers.Layer.Vector("Location", {visible: true});
    var options = this.options;

    var controlOptions = {
            displayClass: options.olToolClass,
            handlerOptions: {
                sides: 4,
                irregular:true,
                persistent: false
            },
            type: OpenLayers.Control.TYPE_TOGGLE,
            eventListeners: {
                'activate': this.onDrawLocationActivate,
                'deactivate': this.onDrawLocationDeactivate
            }
        };

    var panel = new OpenLayers.Control.Panel({
                    displayClass: options.olToolBarClass
                });

    var control = new OpenLayers.Control.DrawFeature(layer,
                                                     OpenLayers.Handler
                                                               .RegularPolygon,
                                                     controlOptions);

    control.events.register("featureadded", control, this.onLocationAdded);
    control.handler.callbacks.create = this.onCreateFeature;

    var selectTileOptions = {'onMove': this.onHoverTile,
                             'onDblClick': $.proxy(this.onDblClick, this),
                             'type': OpenLayers.Control.TYPE_TOGGLE
                            };

    var selectTile = new OpenLayers.Control.Hover(selectTileOptions);

    // Init attributes
    this.control = control;
    this.layer = layer;
    this.panel = panel;

    // Add map controls
    panel.addControls([control, selectTile]);
    map.addControl(panel);
    panel.deactivate();
    map.addLayer(layer);
};

LocationFile.prototype.initLocationControl = function(){
    var map = this.map;
    var format = 'json';
    var ctx = this.controlSelector;
    var defaultRadius = this.options.minRadius;
    var ws = 'http://nominatim.openstreetmap.org/search';
    var url = '{0}?format={1}&countrycodes={2}&addressdetails=1&q={3}';
    var doQuery = function(request, callback){
        var get = $.get(url.format(ws, format, 'gb', request.term));
        get.done(function(data){
            var names = $.map(data, function(item){
                                        return {label: item.display_name,
                                                value: item};
                        });
            callback(names);
        });
    };

    var itemSelected = function(evt, ui){
        var lat = ui.item.value.lat;
        var lon = ui.item.value.lon;
        evt.target.value = ui.item.label;

        // Update the lat/lon values in the form
        $('input[name="location-lat"]', ctx).val(lat);
        $('input[name="location-lon"]', ctx).val(lon);

        // Center the map
        var center = new OpenLayers.LonLat(lon, lat);
        center.transform(new OpenLayers.Projection("EPSG:4326"),
                         map.getProjectionObject());
        map.setCenter(center, 9);

        $('input[name="radius"]',ctx).spinner('value', '');
        return false;
    };

    var itemFocus =  function(evt, ui) {
        evt.target.value = ui.item.label;
        return false;
    };

    var renderItem = function(ul, item) {
        var address = item.value.address;
        var place = address.road || address[item.value.type] || address.city;
        var administrative = address.city || address.town || address.county;

        return $("<li>")
                .append( "<a>" + place + "<br>" + administrative + "</a>" )
                .appendTo( ul );
    };

    // Autocomplete control
    $('input[name="location"]', ctx).autocomplete({
        source: doQuery,
        select: itemSelected,
        focus: itemFocus,
        minLength: 2
    }).data('ui-autocomplete')._renderItem = renderItem;
};

LocationFile.prototype.initSpinnerControl = function(){
    var ctx = this.controlSelector;
    var map = this.map;
    var layer = this.layer;

    var onSpin = function(evt, ui){
        var lat = $('input[name="location-lat"]', ctx).val();
        var lon = $('input[name="location-lon"]', ctx).val();
        var radius = ui.value;

        var point = new OpenLayers.Geometry.Point(lon, lat).transform(
                            new OpenLayers.Projection("EPSG:4326"),
                            map.getProjectionObject());

        var circle = OpenLayers.Geometry
                               .Polygon.createRegularPolygon(point,
                                                             radius,
                                                             50);
        var feature = new OpenLayers.Feature.Vector(circle);

        layer.removeAllFeatures();
        layer.addFeatures(feature);

        map.zoomToExtent(feature.geometry.getBounds(), true);
    };

    // Spinner control
    $('input[name="radius"]', ctx).spinner({
        min: this.options.minRadius,
        max: 5000,
        step: 50,
        spin: onSpin,
    });
};

LocationFile.prototype.onHoverTile = function(evt){
    var xy = evt.xy;
    var map = this.map;
    var layer = map.getLayersByName('Location')[0];
    var point = map.getLonLatFromPixel(xy)
                   .transform(map.getProjectionObject(),
                              new OpenLayers.Projection("EPSG:4326"));
    var zoom = getOSMZoom(map.getResolution(), point.lat) + 1;

    var tile = lonlat2tile(point.lon, point.lat, zoom);

    var nw = tile2lonlat(tile.x, tile.y, zoom);
    var se = tile2lonlat(tile.x + 1, tile.y + 1, zoom);
    var bounds = bounds = new OpenLayers.Bounds();
    bounds.extend(new OpenLayers.LonLat(nw.lon, nw.lat));
    bounds.extend(new OpenLayers.LonLat(se.lon, se.lat));

    var square = bounds.toGeometry()
                     .transform(new OpenLayers.Projection("EPSG:4326"),
                                map.getProjectionObject());

    var feature = new OpenLayers.Feature.Vector(square);

    layer.removeAllFeatures();
    layer.addFeatures(feature);
};

LocationFile.prototype.onDblClick = function(evt){
    var map = this.map;
    var layer = map.getLayersByName('Location')[0];
    if(layer.features && layer.features.length > 0){
        this.generateFile(layer.features[0]);
    }
};

LocationFile.prototype.onCreateFeature = function() {
    var layer = this.layer;
    // Clear any feature before adding the new one
    if(layer.features.length > 0)
    {
        layer.removeAllFeatures();
    }
};

LocationFile.prototype.onLocationAdded = function(evt){
    var feature = evt.feature;
    //this.generateFile(feature);
};

LocationFile.prototype.calculateTiles = function(feature, zoom){
    var map = this.map;
    var ws = 'http://nominatim.openstreetmap.org/reverse';
    var query = '?format={0}&lat={1}&lon={2}&zoom={3}&addressdetails=1';
    var bbox = feature.geometry.clone().getBounds()
                       .transform(map.getProjectionObject(),
                                  new OpenLayers.Projection("EPSG:4326"));
    var zoom = zoom || 18;

    var tile_0 = lonlat2tile(bbox.left, bbox.top, zoom);
    var tile_1 = lonlat2tile(bbox.right, bbox.bottom, zoom);

    var tiles = [];
    // Generate the url for requesting the information of each tile.
    for(var x = tile_0.x; x<=tile_1.x; x++){
        for(var y = tile_0.y; y<=tile_1.y; y++){
            var center = tile2lonlat(y + 0.5, x + 0.5, zoom);
            var url = ws + query.format('json', center.lat, center.lon, zoom);
            var tile = {x: x, y: y, url: url};
            tiles.push(tile);
        }
    }

    return tiles;
};

LocationFile.prototype.requestLocations = function(tiles){
    // Retrieve the reverse geocoding of a tile location and process it.
    var reverseGeocoding= function(tile){
        var promise;
        var request = $.get(tile.url);

        promise = request.pipe(function(data){
                    var address = data.address;
                    var location = {};
                    var value, name;
                    if(address.road !== undefined){
                        value = '{0}, {1}'.format(address.road, address.suburb);
                    }else{
                        value = address.suburb;
                    }
                    name = '{0}-{1}'.format(tile.x, tile.y);
                    location[name] = value;
                    return location;
        });
        return promise;
    };

    // request the reverseGeocoding of all tiles
    loading(true);
    var promises = $.map(tiles, reverseGeocoding);
    var processTiles = $.when.apply($, promises);

    // when ALL the request have finished join the results
    var locations = {};
    processTiles.done(function(){
        for(var i=0; i<arguments.length; i++){
            $.extend(locations, arguments[i]);
        }
        PCAPI.putJSON('fs', 'locations', 'locations.json', locations);
        loading(false);
    });
};

LocationFile.prototype.generateFile = function(feature){
    var tiles = this.calculateTiles(feature);
    var locationFile = this;
    var msg = tiles.length + ' tiles are going to be requested';

    $('#location-dialog')
        .html(msg)
        .dialog({
            title: 'Info',
            resizable: false,
            height:140,
            modal: true,
            buttons: {
                Continue: function() {
                    locationFile.requestLocations(tiles);
                    $(this).dialog( "close" );
                },
                Cancel: function() {
                    $(this).dialog( "close" );
                }
            }
        });
};

LocationFile.prototype.onDrawLocationActivate = function(evt){
    var locationLayer = evt.object.layer;
    locationLayer.setVisibility(true);
};

LocationFile.prototype.onDrawLocationDeactivate = function(evt){
    // var locationLayer = evt.object.layer;
    // locationLayer.setVisibility(false);
};

LocationFile.prototype.activate = function(){
    this.layer.setVisibility(true);
    this.panel.activate();
};

LocationFile.prototype.deactivate = function(){
    this.layer.setVisibility(false);
    this.panel.deactivate();
};
