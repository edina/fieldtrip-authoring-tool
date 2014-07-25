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
        olSelectAreaClass: 'olLocationFileSelectArea',
        olSelectTileClass: 'olLocationFileSelectTile'
    };

    this.options = $.extend(defaults, options);
    this.map = map;
    this.controlSelector = selector;
    this.layer = null;
    this.toolbar = null;
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

    var selectAreaOptions = {
            displayClass: options.olSelectAreaClass,
            handlerOptions: {
                sides: 4,
                irregular:true,
                persistent: false
            },
            type: OpenLayers.Control.TYPE_TOOL,
            eventListeners: {
                'activate': this.onSelectAreaActivate,
                'deactivate': this.onSelectAreaDeactivate
            }
        };

    var selectArea = new OpenLayers.Control.DrawFeature(layer,
                                                     OpenLayers.Handler
                                                               .RegularPolygon,
                                                     selectAreaOptions);

    selectArea.events.register("featureadded", selectArea, this.onLocationAdded);
    selectArea.handler.callbacks.create = this.onCreateFeature;

    var selectTileOptions = {
            displayClass: options.olSelectTileClass,
            'onMove': this.onHoverTile,
            'onDblClick': $.proxy(this.onDblClick, this),
            'type': OpenLayers.Control.TYPE_TOOL,
            eventListeners: {
                'activate': $.proxy(this.onSelectTileActivate, this),
                'deactivate': $.proxy(this.onSelectTileDeactivate, this)
            }
        };

    var selectTile = new OpenLayers.Control.Hover(selectTileOptions);

    var toolbar = new OpenLayers.Control.Panel({
                    displayClass: options.olToolBarClass,
                    allowDepress: true
                });

    // Init attributes
    this.layer = layer;
    this.toolbar = toolbar;

    // Add map controls
    toolbar.addControls([selectArea, selectTile]);
    map.addControl(toolbar);
    toolbar.deactivate();
    map.addLayer(layer);
};

LocationFile.prototype.initLocationControl = function(){
    var map = this.map;
    var format = 'json';
    var ctx = this.controlSelector;
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
    feature.attributes.tiles = [tile];

    layer.removeAllFeatures();
    layer.addFeatures(feature);
};

LocationFile.prototype.onDblClick = function(evt){
    var map = this.map;
    var layer = map.getLayersByName('Location')[0];

    if(layer.features && layer.features.length > 0){
        var feature = layer.features[0];
        this.generateFile(feature, feature.attributes.zoom);
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

/*
 * Returns an array of objects with x, y, z and url that cover the feature.
 */
LocationFile.prototype.generateTilesUrls = function(feature){
    var map = this.map;
    var ws = 'http://nominatim.openstreetmap.org/reverse';
    var query = '?format={0}&lon={1}&lat={2}&zoom={3}&addressdetails=1';

    var tiles = [];

    // If the feature has an attribute that contains the tiles that cover it
    // it's used otherwise it's generated from the bounds of the feature
    if(feature.attributes.tiles){
        tiles.push.apply(tiles, feature.attributes.tiles);
    }else{
        var bounds = feature.geometry.clone()
                    .getBounds()
                    .transform(map.getProjectionObject(),
                               new OpenLayers.Projection("EPSG:4326"));
        var zoom = 18;
        var tile_0 = lonlat2tile(bounds.left, bounds.top, zoom);
        var tile_1 = lonlat2tile(bounds.right, bounds.bottom, zoom);

        for(var x = tile_0.x; x<=tile_1.x; x++){
            for(var y = tile_0.y; y<=tile_1.y; y++){
                var tile = {x: x, y: y, z: zoom};
                tiles.push(tile);
            }
        }
    }

    // Add the url to the list of tiles
    for(var i=0; i<tiles.length; i++){
        var center = tile2lonlat(tiles[i].x + 0.5, tiles[i].y + 0.5, tiles[i].z);
        var url = ws + query.format('json', center.lon, center.lat, center.zoom);
        tiles[i].url = url;
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
                        value = address.suburb || address.county || address.state;
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
    var tiles = this.generateTilesUrls(feature);
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

LocationFile.prototype.onSelectAreaActivate = function(evt){
    var locationLayer = evt.object.layer;
    locationLayer.setVisibility(true);
};

LocationFile.prototype.onSelectAreaDeactivate = function(){
    this.layer.removeAllFeatures();
};

LocationFile.prototype.onSelectTileDeactivate = function(){
    this.layer.removeAllFeatures();
};

LocationFile.prototype.activate = function(){
    this.layer.setVisibility(true);
    this.toolbar.activate();
};

LocationFile.prototype.deactivate = function(){
    this.layer.setVisibility(false);
    this.toolbar.deactivate();
};
