var TrackAnimator = function(map, name) {
    this.map = map;
    this.proj = null;
    this.gpxFormat = null;
    this.markers = null;
    this.walk = null;
    this.walker = new Walker(name, 0.1);
};

TrackAnimator.prototype.init = function() {
    this.proj = new OpenLayers.Projection("EPSG:4326"); // TODO maybe remove...

    this.markers = new OpenLayers.Layer.Markers("Markers");
    this.map.addLayer(this.markers);

    this.walk = new Walk("a Walk", this.map, this.walker);

    this.walk.setMarkersLayer(this.markers);
    this.walk.setGPXLayer(this.map.getLayersByName('GPX')[0]);
    this.walk.init();
};

/**
 * Changes the speed of the animation
 */
TrackAnimator.prototype.changeSpeed = function(value) {
    this.walk.walker.speed = 0.2 - value; //TODO replace 0.25 with max value from input range
};

TrackAnimator.prototype.destroy = function() {
    // console.log('TrackAnimator.prototype.destroy CALLED');
    if (this.walk !== null) {
        for (var i in this.walk.POIs){
            this.walk.POIs[i].destroy();
        }
        if (this.walk.animation !== null) {
            this.walk.animation.isPlaying = false;
            this.walk.animation.counter = 0;
            this.walk.animation = null;
        }
        this.walk = null;
    }

    var markersToRemove = this.map.getLayersByName('Markers');
    for (var idx in markersToRemove) {
        markersToRemove[idx].clearMarkers();
        markersToRemove[idx].destroy();
    }

    if (this.markers !== null) {
        this.markers.destroy();
        this.markers = null;
    }
};
/**
 * If browser does not support requestAnimationFrame (or similar)
 */
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
    };
})();

var Walker = function(name, speed) {
    this.speed = speed;
    this.name = name;
    this.badge = null; // badge has to be initialized when gpx layer rendered as we need start point to get going
    this.badgeCanvas = null; // dito above
    this.namebadgeSize = new OpenLayers.Size(300, 53);
    this.namebadgeOffset = new OpenLayers.Pixel(-6, 16);
    this.namebadgeIcon = new OpenLayers.Icon('http://dlib-brown.edina.ac.uk/background.png', this.namebadgeSize, this.namebadgeOffset);
    this.badgeFont = "18px Verdana";
};



// --------------------------------------------------------------
// -- WALK Object -- WALK Object -- WALK Object -- WALK Object --
// --------------------------------------------------------------


/**
 *
 * Class to encapsulate a OpenLayers Vector layer showing a GPX route.
 * Consists of the VectorLayer which is passed to constructor.
 * The Vector Layer  must use the  OpenLayers.Format.GPXExt format to ensure the time element in the GPX is captured.
 * Also has a WalkAnimation object which handles the time-driven footstep visualisation and a Walker which represents the
 * subject of the walk.
 * TODO remove unneeded variables, clean the code
 */

var Walk = function(name, map, walker) {

    this.animation = null;
    this.name = name;
    this.map = map;
    this.walker = walker;
    this.numSteps = 0;
    this.journeyTime = 0;
    this.actualJourneyTime = 0;
    this.markersLayer = null;
    this.gpxLayer = null;
    this.tmsLayer = null;

    this.extent = null;
    this.numPoints = null;
    this.firstPointTimeText = null;
    this.firstPointTime = null;
    this.lastPointTimeText = null;
    this.lastPointTime = null;
    this.startPoint = null;
    this.nameBadgeMarker = null;
    this.markerDiv = null;
    this.markerCanvas = null;
    this.walkerDiv = null;
    this.containerDiv = null;

    this.POIs = Array();
    this.distanceToShowPOI = 10;
};

Walk.prototype.setMarkersLayer = function(markersLayer) {
    if (markersLayer instanceof OpenLayers.Layer.Markers)
        this.markersLayer = markersLayer;
    else
        console.log('The layer is not instanceof OpenLayers.Layer.Markers');
};

Walk.prototype.setGPXLayer = function(gpxLayer) {
    if (gpxLayer instanceof OpenLayers.Layer.Vector)
        this.gpxLayer = gpxLayer;
    else
        console.log('The layer is not instanceof OpenLayers.Layer.Vector');
};

Walk.prototype.init = function() {
    this.extent = this.gpxLayer.getDataExtent();
    this.map.zoomToExtent(this.extent);

    this.numPoints = this.gpxLayer.features[0].geometry.components.length;
    // initiate Walk.numSteps
    this.numSteps = this.numPoints;

    this.firstPointTimeText = this.gpxLayer.features[0].geometry.components[0].time;
    this.firstPointTime = new Date(Date.parse(this.firstPointTimeText));
    this.lastPointTimeText = this.gpxLayer.features[0].geometry.components[this.numPoints - 1].time;
    this.lastPointTime = new Date(Date.parse(this.lastPointTimeText));
    // initiate Walk.journeyTime
    this.actualJourneyTime = this.lastPointTime - this.firstPointTime;
    this.journeyTime = this.actualJourneyTime * this.walker.speed;
    // initialize name badge
    this.startPoint = this.gpxLayer.features[0].geometry.components[0];
    this.nameBadgeMarker = new OpenLayers.Marker(new OpenLayers.LonLat(this.startPoint.x, this.startPoint.y), this.walker.namebadgeIcon.clone());
    this.walker.badge = this.nameBadgeMarker;
    this.markersLayer.addMarker(this.walker.badge);

    this.markerDiv = this.nameBadgeMarker.icon.imageDiv;
    this.markerCanvas = document.createElement("canvas"); // TODO can reuse same canvas element indtead of creating a new one ?
    this.markerDiv.appendChild(this.markerCanvas);
    this.markerCanvas.width = (this.walker.namebadgeSize.w); // TODO  2 * hypoteneuse img width , height  ;
    this.markerCanvas.height = (this.walker.namebadgeSize.h);
    this.markerCanvas.id = "namebadge";

    this.walker.badgeCanvas = this.markerCanvas;
    // animation is passed copy of Walk object
    this.animation = new WalkAnimation(this);
};

Walk.prototype.playAnimation = function() {
    this.animation.play();
};


// ----------------------------------------------------------------------
// -- WalkAnimation -- WalkAnimation -- WalkAnimation -- WalkAnimation --
// ----------------------------------------------------------------------


var WalkAnimation = function(walk) {
    this.walk = walk;
    this.isPlaying = false;
    this.pauseOnPopup = false;
    this.startTime = new Date();
    this.lastReplayTime = null;
    this.counter = 0;
    this.isPaused = false;

    // left and right feet markers
    this.size = new OpenLayers.Size(45, 41); // TODO pass these into constructor params?
    this.offset = new OpenLayers.Pixel(-61 - 23, -61 - 21); // TODO hyoteneuse width, height
    this.rfoffset = new OpenLayers.Pixel(-61 - 23 - 5, -61 - 21 - 10);
    this.lfoffset = new OpenLayers.Pixel(-61 - 23 + 5, -61 - 21 + 10);
    this.rf = new OpenLayers.Icon('http://dlib-brown.edina.ac.uk/icons/right_footprint180.png', this.size, this.rfoffset);
    this.lf = new OpenLayers.Icon('http://dlib-brown.edina.ac.uk/icons/left_footprint180.png', this.size, this.lfoffset);

    this.events = {};

    var markerLeftFootprintTempCanvas = document.createElement("canvas");
    var markerRightFootprintTempCanvas = document.createElement("canvas");

    var markerFootprintTestCanvas = document.createElement("canvas");
    var gpxDiv = this.walk.gpxLayer.div;

    gpxDiv.appendChild(markerFootprintTestCanvas);

    markerLeftFootprintTempCanvas.width = (2 * 61); // TODO  2 * hypoteneuse img width , height  ;
    markerLeftFootprintTempCanvas.height = (2 * 61);
    markerRightFootprintTempCanvas.width = (2 * 61); // TODO  2 * hypoteneuse img width , height  ;
    markerRightFootprintTempCanvas.height = (2 * 61);


    markerFootprintTestCanvas.width = (2 * 61); // TODO  2 * hypoteneuse img width , height  ;
    markerFootprintTestCanvas.height = (2 * 61);

    this.markerLeftFootprintTempContext = markerLeftFootprintTempCanvas.getContext("2d");
    this.markerRightFootprintTempContext = markerRightFootprintTempCanvas.getContext("2d");

    var markerFootprintTestContext = markerFootprintTestCanvas.getContext("2d");

    var lfImage = new Image();
    lfImage.src = "http://dlib-brown.edina.ac.uk/icons/left_footprint180.png";
    lfImage.onload = $.proxy(function() {
        this.markerLeftFootprintTempContext.drawImage(lfImage, 0, 0);
    }, this);

    var rfImage = new Image();
    rfImage.src = "http://dlib-brown.edina.ac.uk/icons/right_footprint180.png";
    rfImage.onload = $.proxy(function() {
        this.markerRightFootprintTempContext.drawImage(rfImage, 0, 0);
    }, this);
};

/*
    Publish/Suscribe functions for the animation
*/

WalkAnimation.prototype.on = function(e, callback){
    var event = this.events[e];
    if(!event){
        event = $.Callbacks();
        this.events[e] = event;
    }
    event.add(event, callback);
};

WalkAnimation.prototype.off = function(e){
    var event = this.events[e];
    if(event){
        event.remove(event);
    }
};

WalkAnimation.prototype.trigger = function(e){
    var event = this.events[e];
    if(event){
        event.fire.apply(this, arguments);
    }
};

WalkAnimation.prototype.drawImageRotate = function(c, img, x, y, width, height, remainingIntervalQuotiant, angle) {
    // we want foot drawn fully in half the interval time
    if (remainingIntervalQuotiant < 0) {
        remainingIntervalQuotiant = 0;
    }
    var proportionLeftToDraw = (1 - remainingIntervalQuotiant) * 2;
    if (proportionLeftToDraw > 1) {
        proportionLeftToDraw = 1;
    }
    var adjustedheight = Math.round(height * (proportionLeftToDraw));
    // TODO can we avoid recalcualting angle if not different from last frame?
    c.translate(x + width / 2, y + height / 2);
    c.rotate(angle);

    var upperLim = (255 * (1 - remainingIntervalQuotiant));
    var refc = this.counter % 2 == 1 ? this.markerRightFootprintTempContext : this.markerLeftFootprintTempContext; // left foot or right foot?

    // rotate marker canvas back to original position so that next rotation is not misplaced by this one
    c.clearRect(width / 2 * (-1), height / 2 * (-1), width, adjustedheight);

    c.drawImage(img, width / 2 * (-1), height / 2 * (-1), width, adjustedheight);
    c.rotate(angle * (-1));
    c.translate((x + width / 2) * (-1), (y + height / 2) * (-1));
};

WalkAnimation.prototype.play = function() {
    this.isPlaying = true;
    if(!this.isPaused){
        this.startTime = new Date();
        this.trigger('play');
    }else{
        this.trigger('resume');
    }
    this.anim();
};

WalkAnimation.prototype.pause = function() {
    this.isPlaying = false;
    this.isPaused = true;
    this.trigger('pause');
};

WalkAnimation.prototype.togglePause= function() {
    this.pauseOnPopup = !this.pauseOnPopup;
};

/*
 *  This is callback function the browser will invoke every time it refreshes page
 *  driving our animation. Check out HTML5 requestFrame for detail
 */
WalkAnimation.prototype.anim = function() {
    if (this.walk.map.getLayersByName("Markers").length > 1) {
        console.log('Ops, there is more than one layer named "Markers". Removing first one...')
        this.walk.map.getLayersByName("Markers")[0].destroy();
        console.log('Number of layers named "Markers": ' + this.walk.map.getLayersByName("Markers").length);
    }

    var gpxlayer = null;

    if (this.isPlaying) {

        var currentTime = new Date();
        var replayTime = Math.round(currentTime - this.startTime);
        var intervalTime = replayTime - this.lastReplayTime;
        // update journey time in case speed has changed
        this.walk.journeyTime = this.walk.actualJourneyTime * this.walk.walker.speed;

        // we will make a new footprint at roughly every stepInterval seconds
        var stepInterval = Math.round(this.walk.journeyTime / this.walk.numSteps);
        if (isNaN(stepInterval))
            stepInterval = 500;
        var markers = this.walk.markersLayer;
        gpxlayer = this.walk.gpxLayer;

        var remainingIntervalQuotiant = (stepInterval - intervalTime) / stepInterval;

        /*
         * we want to make a new footprint at roughly every stepInterval seconds
         * so code below is called once for each point in this.walk
         * we work out bearing to next point and create a canvas which we rotate
         * in subsequent frames. Interval time is how much time we ran since last
         * footstep created.
         */
        if (intervalTime > stepInterval) {
            this.lastReplayTime = replayTime;
            this.counter++;
            remainingIntervalQuotiant = 0.999; // reset as might be negative
            // if we got to end of this.walk clear marker layer of any trailing markers
            if (this.counter >= this.walk.numSteps - 1) {
                this.counter = 0;
                for (var i = 1; i < this.walk.numPoints - 1; i++) {
                    markers.removeMarker(gpxlayer.features[0].geometry.components[i].marker);
                }
            }

            var lat = gpxlayer.features[0].geometry.components[this.counter].y;
            var lon = gpxlayer.features[0].geometry.components[this.counter].x;

            var olLonLat = new OpenLayers.LonLat(lon, lat);
            var icon = null;
            var foot = null;
            if (this.counter > 0) {
                // get bearing to next point
                var p1X = gpxlayer.features[0].geometry.components[this.counter].x;
                var p1Y = gpxlayer.features[0].geometry.components[this.counter].y;
                // TODO does below break at upper boundary?
                var p2X = gpxlayer.features[0].geometry.components[this.counter + 1].x;
                var p2Y = gpxlayer.features[0].geometry.components[this.counter + 1].y;
                var bearing = calcAngle((p2Y - p1Y), (p2X - p1X));

                // create footstep maker and add to makers layer

                // left foot or right foot?
                if(this.counter % 2 === 1){
                    foot = 'right';
                    icon = this.rf;
                }else{
                    foot = 'left';
                    icon = this.lf;
                }

                // double check whether it is still playing before adding new marker
                if (!this.isPlaying)
                    return;

                var marker = new OpenLayers.Marker(olLonLat, icon.clone());

                this.walk.markersLayer.addMarker(marker);
                var markerDiv = marker.icon.imageDiv;
                // make original img element invisible
                var markerImg = markerDiv.firstChild;

                // replace image with canvas large enough so we can rotate it in later frames by bearing
                markerImg.style.display = "none";
                var markerCanvas = document.createElement("canvas"); // TODO can reuse same canvas element indtead of creating a new one ?
                markerDiv.appendChild(markerCanvas);
                markerCanvas.width = (2 * 61); // TODO  2 * hypoteneuse img width , height  ;
                markerCanvas.height = (2 * 61);
                var c = markerCanvas.getContext("2d");

                // cache calculations and object for new footprint in the current Point so we can access them in step interval animation frames
                gpxlayer.features[0].geometry.components[this.counter].marker = marker;
                gpxlayer.features[0].geometry.components[this.counter].bearing = bearing;
                gpxlayer.features[0].geometry.components[this.counter].markerCanvas = markerCanvas;
                gpxlayer.features[0].geometry.components[this.counter].markerImg = markerImg;

                this.trigger('step', foot);

                //remove trailing footstep markers
                var removeMarker = null;

                if (this.counter > 2) // TODO make trail length configurable
                {
                    removeMarker = gpxlayer.features[0].geometry.components[this.counter - 2].marker;
                    this.walk.markersLayer.removeMarker(removeMarker);
                }

                // for each POI check if it should be displayed or hidden
                for (var i in this.walk.POIs) {

                    if (this.walk.POIs[i].startStepNum <= this.counter &&
                        this.walk.POIs[i].endStepNum >= this.counter) {
                        if (!this.walk.POIs[i].isShown) {
                            // console.log('showing POI. startStep: ' + this.walk.POIs[i].startStepNum + ' counter: ' + this.counter);
                            this.walk.POIs[i].showPOI();
                            this.trigger('showPOI', this.walk.POIs[i]);

                            if(this.pauseOnPopup === true){
                                this.pause();
                            }

                        }
                    } else if (this.walk.POIs[i].isShown) {
                        // console.log('hiding POI. endStep: ' + this.walk.POIs[i].endStepNum + ' counter: ' + this.counter);
                        this.walk.POIs[i].hidePOI();
                    }

                }

            } // ( if this.counter > 0)

            // reset intervalTime
            intervalTime = 0;
        } // ends if(intervalTime > stepInterval)

        // this section runs code for each requestFrame
        if (this.counter > 0 && this.isPlaying) {
            var imgheight = 41;
            var ctx = gpxlayer.features[0].geometry.components[this.counter].markerCanvas.getContext("2d");
            var markerImg = gpxlayer.features[0].geometry.components[this.counter].markerImg;
            var bearing = gpxlayer.features[0].geometry.components[this.counter].bearing + Math.PI; // add 180 because for image is upside down meaning heel of foot gets drawn first using html5 canvas drawImage()
            this.drawImageRotate(ctx, markerImg, 61, 61, 45, imgheight, remainingIntervalQuotiant, bearing);
        }
    } // ends if(playing)
    if (this.isPlaying)
        OpenLayers.Animation.requestFrame($.proxy(function() {
            this.anim();
        }, this));
}; // ends callback function anim()


// --------------------------------------------------------------------------
// -- Math Functions -- Math Functions -- Math Functions -- Math Functions --
// --------------------------------------------------------------------------


function calcNextPoint(p, distance, angle) {
    var nextPoint = new OpenLayers.Geometry.Point(0, 0);
    // TO DO is this necessary?
    if (angle == 90) {
        nextPoint.x = p.x + distance;
        nextPoint.y = p.y;
        return nextPoint;
    }
    if (angle == 180) {
        nextPoint.x = p.x;
        nextPoint.y = p.y - distance;
        return nextPoint;

    }
    if (angle == 270) {
        nextPoint.x = p.x - distance;
        nextPoint.y = p.y;
        return nextPoint;
    }

    if (angle == 360 || angle == 0) {
        nextPoint.x = p.x;
        nextPoint.y = p.y + distance;
        return nextPoint;
    }

    var rightAngle = 0;
    var signX = -1;
    var signY = -1;
    // TODO is this necessary ? Probably not.
    if (angle > 0 && angle < 90) {
        rightAngle = 90 - angle; // get right triangle angle
        signX = 1;
        signY = 1;
    } else if (angle > 90 && angle < 180) {
        rightAngle = 90 - (180 - angle);
        signX = 1;
        signY = -1;
    } else if (angle > 180 && angle < 270) {
        rightAngle = 90 - (270 - angle);
        signX = -1;
        signY = -1;
    } else if (angle > 270 && angle < 360) {
        rightAngle = 90 - (360 - angle);
        signX = -1;
        signY = 1;
    }
    angleRad = rightAngle * Math.PI / 180;
    var deltax = Math.sin(angleRad) * distance;
    var deltay = Math.cos(angleRad) * distance;
    nextPoint.x = p.x + (deltax * signX);
    nextPoint.y = p.y + (deltay * signY);
    return nextPoint;
}

function calcCartesianDistance(p1, p2) {
    var deltaX = p2.x - p1.x;
    var deltaY = p2.y - p1.y;
    return Math.sqrt(Math.pow(deltaX, 2), Math.pow(deltaY, 2));
}

function calcAngle(deltaY, deltaX) {
    var angle = Math.atan2(deltaY, deltaX);
    if (angle < 0) // convert angle from atan function to 0..2PI angle
    {
        angle = Math.abs(angle) + (Math.PI / 2);
    } else {
        angle = 2 * Math.PI - (angle - (Math.PI / 2));
    }
    return angle;
}


Walk.prototype.addPOI = function(POI) {

    var poiPoint = new OpenLayers.Geometry.Point(POI.LonLat.lon, POI.LonLat.lat);
    // console.log('checking for the showing start step');
    // checking for the showing start step
    for (var i = 0; i < this.numPoints; i++) {
        var aPoint = this.gpxLayer.features[0].geometry.components[i];
        // console.log('step number: ' + i);
        // console.log(aPoint.distanceTo(poiPoint));
        if (aPoint.distanceTo(poiPoint) < this.distanceToShowPOI) {
            POI.startStepNum = i;
            break;
        }

    }
    // console.log('checking for the showing end step');
    // checking for the showing end step
    for (var i = this.numPoints - 1; i >= 0; i--) {
        var aPoint = this.gpxLayer.features[0].geometry.components[i];
        // console.log('step number: ' + i);
        // console.log(aPoint.distanceTo(poiPoint));
        if (aPoint.distanceTo(poiPoint) < this.distanceToShowPOI) {
            POI.endStepNum = i;
            break;
        }
    }

    this.POIs[this.POIs.length] = POI;
    // console.log('Added new POI at index ' + (this.POIs.length - 1));
    // console.log(POI);
};

/**
 * POI is an object for holding the Track POIs
 * TODO type - sets different PopUp type (i.e. picture, audio, text...)
 */

var POI = function(name, type, LonLat, map, mapviewer) {
    this.name = name;
    this.type = type;
    this.LonLat = LonLat;
    var url = mapviewer.buildUrl('records', '/' + name);
    var preview = '';
    var self = this;
    var title = '';
    var record = null;

    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            self.record = data;
            var editor = data.editor;
            title = editor.split(".")[0];
            var field_values = data.fields;

            if(title === 'image'){
                //Get image
                $.each(field_values, function(key, value){
                    var title = value.val;
                    preview += ('<img src="'+encodeURI(url)+'/'+ title +'" alt="'+ title +'" style="image-orientation: from-image">');
                });
            }
            if(title === 'text'){
                //Get text
                $.each(field_values, function(key, value){
                    preview += ('<p>' + value.val +"</p>");
                });
            }
            if(title === 'audio'){
                //Get audio
                $.each(field_values, function(key, value){
                    preview += ('<p><audio class="popup" src="' + encodeURI(url) + '/' +  value.val +'" preload="auto" type="audio/wav"> Your browser does not support the audio element.</audio></p>');
                });
            }
            self.setContent(self.content += preview);
            self.popup = new OpenLayers.Popup(title, self.LonLat, new OpenLayers.Size(200,200), self.content, true);
            self.popup.autoSize=true;

        },
        error: function(jqXHR, status, error){
            loading(false);
            giveFeedback(JSON.parse(jqXHR.responseText)["msg"]);
        }
    });
    this.content = '<h5>' + this.name + '</h5>'  + preview;
    // startStepNum defines when the popup should appear (with regards to the step counter inside the WalkAnimation)
    this.startStepNum = null;
    // endStepNum defines when the popup should disappear (with regards to the step counter inside the WalkAnimation)
    this.endStepNum = null;
    this.map = map;

    self.popup = new OpenLayers.Popup(this.name, self.LonLat, new OpenLayers.Size(200,200), self.content, true);
    self.popup.autoSize=true;

    this.isShown = false;
};

/**
 * TODO sets content for display inside the POI PopUp
 */
POI.prototype.setContent = function(content) {
    this.content = content;
};

POI.prototype.showPOI = function() {
    this.map.addPopup(this.popup);
    this.isShown = true;
};

POI.prototype.hidePOI = function() {
    this.map.removePopup(this.popup);
    this.isShown = false;
};

POI.prototype.destroy = function() {
    if (this.isShown){
        this.map.removePopup(this.popup);
        this.popup.destroy();
    }
};
