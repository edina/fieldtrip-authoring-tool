var LocationFile = function(map, selector, options){
    var defaults = {
        min_radius: 100
    };

    this.options = $.extend(defaults, options);
    this.map = map;
    this.controls_selector = selector;
    // this.layer;
    // this.control;
    this._initMap();
    this._initDomControls();
};

LocationFile.prototype._initDomControls = function(){
    this._initLocationControl();
    this._initSpinnerControl();

};

LocationFile.prototype._initMap = function(){
    var map = this.map;
    var layer = new OpenLayers.Layer.Vector("Location", {visible: true});


    var controlOptions = {
            displayClass: "olSpatialMemoriesDrawBox",
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

    var control = new OpenLayers.Control.DrawFeature(layer,
                                                     OpenLayers.Handler.RegularPolygon,
                                                     controlOptions);


    control.events.register("featureadded", control, this.onLocationAdded);
    control.handler.callbacks.create = this.onCreateFeature;

    map.addLayers(layer);

    var panel = map.getControlsBy('displayClass', 'olSpatialMemoriesToolBar')[0];

    // Add map controls
    this.control = control;
    this.layer = layer;
    panel.addControls(control);

};

LocationFile.prototype._initLocationControl = function(){
    var map = this.map;
    var format = 'json';
    var ctx = this.controls_selector;
    var defaultRadius = this.options.min_radius;
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

        $('input[name="radius"]',ctx).val(defaultRadius);
        return false;
    };

    var itemFocus =  function(evt, ui) {
        evt.target.value = ui.item.label;
        return false;
    };

    var renderItem = function( ul, item ) {
        var address = item.value.address;
        var place = address.road || address[item.value.type] || address.city;
        var administrative = address.city || address.town || address.county;

        return $("<li>")
                .append( "<a>" + place + "<br>" + administrative + "</a>" )
                .appendTo( ul );
    };

    // Autocomplete control
    $('input[name="location"]',ctx).autocomplete({
        source: doQuery,
        select: itemSelected,
        focus: itemFocus,
        minLength: 2,
    }).data('ui-autocomplete')._renderItem = renderItem;
};

LocationFile.prototype._initSpinnerControl = function(){
    var ctx = this.controls_selector;
    var map = this.map;
    var layer = this.layer;

    var onSpin = function(evt){
        console.log(evt);
        var lat = $('input[name="location-lat"]', ctx).val();
        var lon = $('input[name="location-lon"]', ctx).val();

        console.log(lat, lon, evt.target.value);

        var circle = OpenLayers.Geometry.Polygon.createRegularPolygon(
                        new OpenLayers.Geometry.Point(lon, lat).transform(
                            new OpenLayers.Projection("EPSG:4326"),
                            map.getProjectionObject()),
                    evt.target.value,
                    30);
        layer.removeAllFeatures();
        layer.addFeatures(new OpenLayers.Feature.Vector(circle));
        console.log(layer);
    };


    // Spinner control
    $('input[name="radius"]',ctx).spinner({
        min: this.options.min_radius,
        max: 5000,
        step: 100,
        spin: onSpin
    });
};

LocationFile.prototype.onCreateFeature = function() {
    var layer = this.layer;
    // Clear any feature befor adding the new one
    if(layer.features.length > 0)
    {
        layer.removeAllFeatures();
    }
};

LocationFile.prototype.onLocationAdded = function(evt){
    var feature = evt.feature;
    var ws = 'http://nominatim.openstreetmap.org/reverse';
    var query = '?format={0}&lat={1}&lon={2}&zoom={3}&addressdetails=1';
    var bbox =  feature.geometry.getBounds()
                       .transform(new OpenLayers.Projection("EPSG:27700"),
                                  new OpenLayers.Projection("EPSG:4326"));
    var zoom = 18;

    var tile_0 = longlat2tile(bbox.left, bbox.top, zoom);
    var tile_1 = longlat2tile(bbox.right, bbox.bottom, zoom);

    var tiles = [];
    // Generate the url for requesting the information of each tile.
    for(var x = tile_0.x; x<=tile_1.x; x++){
        for(var y = tile_0.y; y<=tile_1.y; y++){
            var center = tile2longlat(y + 0.5, x + 0.5, zoom);
            var url = ws + query.format('json', center.lat, center.lon, zoom);
            var tile = {x: x, y: y, url: url};
            tiles.push(tile);
        }
    }

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
        PCAPI.putJSON('fs', 'locations', 'locations.js', locations);
        loading(false);
    });
};


LocationFile.prototype.onDrawLocationActivate = function(evt){
    var locationLayer = evt.object.layer;
    locationLayer.setVisibility(true);
};

LocationFile.prototype.onDrawLocationDeactivate = function(evt){
    var locationLayer = evt.object.layer;
    locationLayer.setVisibility(false);
};

LocationFile.prototype.activate = function(){

};

LocationFile.prototype.deactivate = function(){
    this.map.removeControl(this.locationControl);
};
