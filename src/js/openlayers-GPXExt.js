OpenLayers.Format.GPXExt = OpenLayers.Class(OpenLayers.Format.GPX, {

    read: function(doc) {
        if (typeof doc == "string") {
            doc = OpenLayers.Format.XML.prototype.read.apply(this, [doc]);
        }
        var features = [];

        if (this.extractTracks) {
            var tracks = doc.getElementsByTagName("trk");
            for (var i = 0, len = tracks.length; i < len; i++) {
                // Attributes are only in trk nodes
                var attrs = {};
                if (this.extractAttributes) {
                    attrs = this.parseAttributes(tracks[i]);
                }

                var segs = this.getElementsByTagNameNS(tracks[i], tracks[i].namespaceURI, "trkseg");
                for (var j = 0, seglen = segs.length; j < seglen; j++) {
                    // We don't yet support extraction of trkpt attributes
                    // All trksegs of a trk get that trk's attributes
                    var track = this.extractSegment(segs[j], "trkpt");
                    features.push(new OpenLayers.Feature.Vector(track, attrs));


                }
            }
        }
        if (this.extractRoutes) {
            var routes = doc.getElementsByTagName("rte");
            for (var k = 0, klen = routes.length; k < klen; k++) {
                var attrs = {};
                if (this.extractAttributes) {
                    attrs = this.parseAttributes(routes[k]);
                }
                var route = this.extractSegment(routes[k], "rtept");
                features.push(new OpenLayers.Feature.Vector(route, attrs));
            }
        }

        if (this.extractWaypoints) {
            var waypoints = doc.getElementsByTagName("wpt");
            for (var l = 0, len = waypoints.length; l < len; l++) {
                var attrs = {};
                if (this.extractAttributes) {
                    attrs = this.parseAttributes(waypoints[l]);
                }
                var wpt = new OpenLayers.Geometry.Point(waypoints[l].getAttribute("lon"), waypoints[l].getAttribute("lat"));
                features.push(new OpenLayers.Feature.Vector(wpt, attrs));
            }
        }

        if (this.internalProjection && this.externalProjection) {
            for (var g = 0, featLength = features.length; g < featLength; g++) {
                features[g].geometry.transform(this.externalProjection,
                    this.internalProjection);
            }
        }

        return features;
    },

    extractSegment: function(segment, segmentType) {
        var points = this.getElementsByTagNameNS(segment, segment.namespaceURI, segmentType);
        var point_features = [];
        var attributes = {};
        for (var i = 0, len = points.length; i < len; i++) {
            var point = new OpenLayers.Geometry.Point(points[i].getAttribute("lon"), points[i].getAttribute("lat"));
            point.ele = points[i].childNodes[0].textContent;
            point.time = points[i].childNodes[1].textContent;
            point_features.push(point);
        }
        return new OpenLayers.Geometry.LineString(point_features);
    },


    CLASS_NAME: "OpenLayers.Format.GPXExt"
});
