define(['../libraries/supercluster.min', '../libraries/WorldWind/WorldWind'], function (supercluster, wwe) {

    var MarkerCluster = function (globe, options) {

        if (!options) {
            options = {
                maxLevel: 9,
                smooth: false,
                name: "MarkerCluster"
            }
        }

        this.options = options;

        this.placemarks = [];
        var name = options.name || "MarkerCluster";
        this.layer = new WorldWind.RenderableLayer(name);
        if (globe) {
            globe.addLayer(this.layer);
        }
        this.globe = globe;
        this.controlLayer = options.controls;
        this.zoomLevel = 0;
        this.smooth = options.smooth || false;
        this.zoomLevels = options.maxLevel || 9;
        this.levels = [];
        this.maxReached = this.zoomLevels;
        this.minReached = 0;
        this.createZoomClusters(this.zoomLevels);


        this.bindNavigator();
    };

    MarkerCluster.prototype.off = function () {
        this.layer.enabled = false;
    };
    MarkerCluster.prototype.on = function () {
        this.layer.enabled = true;
    };
    MarkerCluster.prototype.bindNavigator = function () {

        var navigator = this.globe.navigator;
        var LookAtNavigator = WorldWind.LookAtNavigator;
        var self = this;


        if (!navigator.clusters) {
            navigator.clusters = {};
        }
        navigator.clusters[self.options.name] = self;

        navigator.handleWheelEvent = function (event) {
            LookAtNavigator.prototype.handleWheelEvent.apply(this, arguments);
            if (self.options.smooth) {
                self.globe.goToAnimator.travelTime = 600;
                if (!this.busy) {
                    var normalizedDelta;
                    if (event.deltaMode == WheelEvent.DOM_DELTA_PIXEL) {
                        normalizedDelta = event.deltaY;
                    } else if (event.deltaMode == WheelEvent.DOM_DELTA_LINE) {
                        normalizedDelta = event.deltaY * 40;
                    } else if (event.deltaMode == WheelEvent.DOM_DELTA_PAGE) {
                        normalizedDelta = event.deltaY * 400;
                    }
                    normalizedDelta *= 5;
                    var scale = 1 + (normalizedDelta / 1000);
                    var nav = this;

                    var lat = this.lookAtLocation.latitude;
                    var lng = this.lookAtLocation.longitude;
                    var alt = this.range * scale;
                    var newPosition = new WorldWind.Position(lat, lng, alt);
                    nav.busy = true;
                    this.worldWindow.goTo(newPosition, function () {
                        setTimeout(function () {
                            nav.busy = false;
                        }, 300)

                    });
                    this.applyLimits();
                    this.worldWindow.redraw();
                }
            }
            var range = this.range;

            for (var key in navigator.clusters) {
                navigator.clusters[key].handleClusterZoom(range)
            }

        };

        if (this.controlLayer) {
            if (!this.controlLayer.clusters) {
                this.controlLayer.clusters = {};
            }
            this.controlLayer.clusters[self.options.name] = self;

            this.controlLayer.handleZoom = function (e, control) {

                if ((e.type === "mousedown" && e.which === 1) || (e.type === "touchstart")) {
                    this.activeControl = control;
                    this.activeOperation = this.handleZoom;
                    e.preventDefault();

                    if (e.type === "touchstart") {
                        this.currentTouchId = e.changedTouches.item(0).identifier; // capture the touch identifier
                    }

                    // This function is called by the timer to perform the operation.
                    var thisLayer = this; // capture 'this' for use in the function
                    var setRange = function () {
                        if (thisLayer.activeControl) {
                            if (thisLayer.activeControl === thisLayer.zoomInControl) {
                                thisLayer.wwd.navigator.range *= (1 - thisLayer.zoomIncrement);
                            } else if (thisLayer.activeControl === thisLayer.zoomOutControl) {
                                thisLayer.wwd.navigator.range *= (1 + thisLayer.zoomIncrement);
                            }
                            thisLayer.wwd.redraw();
                            setTimeout(setRange, 50);
                        }
                    };
                    setTimeout(setRange, 50);
                    var range = thisLayer.wwd.navigator.range;
                    for (var key in this.clusters) {
                        this.clusters[key].handleClusterZoom(range)
                    }


                }
            };
        }

    };

    MarkerCluster.prototype.handleClusterZoom = function (range) {
        var self = this;
        var ranges = [100000000, 5294648, 4099739, 2032591, 1650505, 800762, 500000, 100000, 7000];


        var res;
        // console.log(range);
        if (range >= ranges[0]) {
            res = 1;
        } else if (range <= ranges[ranges.length - 1]) {
            res = ranges.length;
        } else {
            for (var x = 0; x < ranges.length; x++) {
                if (range <= ranges[x] && range >= ranges[x + 1]) {
                    res = x + 1;
                    break;
                }
            }
        }
        self.oldZoom = self.zoomLevel || 0;
        self.zoomLevel = res;

        //console.log(res);

        if (res < self.minReached) {
            self.hideAllLevels();
            self.showZoomLevel(self.minReached);//possible overhead
        } else if (res > self.maxReached) {
            self.hideAllLevels();
            self.showInRange(self.maxReached);
            //self.showZoomLevel(self.maxReached);
        } else {
            if (self.levels[res].length != self.levels[self.oldZoom].length) {
                // self.showZoomLevel(res);
                self.hideAllLevels();
                self.showInRange(res);
                self.globe.redraw();//dynamic
            }

            //self.hideOutside(res);


        }
    };

    MarkerCluster.prototype.picking = function () {
        var self = this;
        var highlightedItems = [];

        var handlePick = function (o) {
            var wwd = self.globe;
            var x = o.clientX,
                y = o.clientY;

            var redrawRequired = highlightedItems.length > 0;

            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].attributes.imageScale -= 0.2;
                highlightedItems[h].attributes.labelAttributes.font.size -= 10;
            }
            highlightedItems = [];

            var pickList = wwd.pick(wwd.canvasCoordinates(x, y));
            if (pickList.objects.length > 0) {
                redrawRequired = true;
            }


            if (pickList.objects.length > 0) {
                for (var p = 0; p < pickList.objects.length; p++) {
                    if (!pickList.objects[p].isTerrain) {
                        if (pickList.objects[p].userObject.attributes && pickList.objects[p].userObject.attributes.imageScale) {
                            pickList.objects[p].userObject.attributes.imageScale += 0.2;
                            pickList.objects[p].userObject.attributes.labelAttributes.font.size += 10;
                            highlightedItems.push(pickList.objects[p].userObject);
                        }
                    }
                }
            }


            if (redrawRequired) {
                wwd.redraw(); // redraw to make the highlighting changes take effect on the screen
            }
        };

        var handleClick = function (o) {
            var wwd = self.globe;
            var x = o.clientX,
                y = o.clientY;


            var pickList = wwd.pick(wwd.canvasCoordinates(x, y));


            if (pickList.objects.length > 0) {
                for (var p = 0; p < pickList.objects.length; p++) {
                    if (!pickList.objects[p].isTerrain) {
                        if (pickList.objects[p].userObject.options.zoomLevel) {
                            self.globe.navigator.lookAtLocation.latitude = pickList.objects[p].userObject.position.latitude;
                            self.globe.navigator.lookAtLocation.longitude = pickList.objects[p].userObject.position.longitude;
                            self.globe.navigator.range /= 2;
                            self.handleClusterZoom(self.globe.navigator.range);
                            break;
                        }
                    }
                }
            }

        };

        wwd.addEventListener("mousemove", handlePick);
        wwd.addEventListener("click", handleClick);
    };

    MarkerCluster.prototype.showInRange = function (level) {
        var h = $("#canvasOne").height();
        var v = [];
        if (wwd.pickTerrain(new WorldWind.Vec2(h / 2, h / 2)).objects && wwd.pickTerrain(new WorldWind.Vec3(0, 0, 0)).objects [0]) {

            var center = wwd.pickTerrain(new WorldWind.Vec2(h / 2, h / 2));

            center = center.objects[0].position;

            var l = this.globe.navigator.range / Math.cos(Math.PI / 8);
            var base = Math.sqrt(Math.pow(l, 2) - Math.pow(this.globe.navigator.range, 2));

            base = base / 100000;
            var minLat = center.latitude - base;
            var maxLat = center.latitude + base;
            var minLng = center.longitude - base;
            var maxLng = center.longitude + base;

            var bb = {
                ix: minLat,
                iy: minLng,
                ax: maxLat,
                ay: maxLng
            };
            for (var x = 0; x < this.levels[level].length; x++) {
                var point = this.placemarks[this.levels[level][x]];
                var p = point.position;

                if (bb.ix <= p.latitude && p.latitude <= bb.ax && bb.iy <= p.longitude && p.longitude <= bb.ay) {
                    this.show(point);
                }
            }
        } else {
            this.showZoomLevel(level);
        }
    };

    MarkerCluster.prototype.generateCluster = function () {
        this.hideAllSingle();
        var myJSON = '{"type": "FeatureCollection","features":[';
        newFeature = function (position, label) {
            return '{"type": "Feature","properties": {"name":"' + label + '"},"geometry": {"type": "Point","coordinates": [' +
                +position.longitude + ',' +
                +position.latitude + ']}}';
        };

        this.placemarks.forEach(function (p, i) {
            myJSON += newFeature(p.position, p.label) + ",";
        });
        myJSON = myJSON.slice(0, -1);
        myJSON += ']}';

        this.generateJSONCluster(JSON.parse(myJSON));
        this.showZoomLevel(this.zoomLevel);
    };

    MarkerCluster.prototype.generateJSONCluster = function (geojson) {
        var self = this;
        cluster = supercluster({
            log: true,
            radius: 70,//should be dynamic
            extent: 128,
            maxZoom: self.zoomLevels
        }).load(geojson.features);

        this.cluster = cluster;
        var end = this.zoomLevels;

        for (var y = 0; y <= end; y++) {
            var res = cluster.getClusters([-180, -90, 180, 90], y + 1);
            var self = this;

            if (this.minReached == 0 && res.length > 0) {
                this.minReached = y;
            }
            //if (y > 0 && res.length > 0 && res.length == this.levels[y - 1].length) {
            if (res.length == geojson.features.length && y > 0 && res.length > 0 && res.length == this.levels[y - 1].length) {
                this.maxReached = y - 1;
                break;
            } else {
                var label, imageSource;

                var max = 0;
                var min = Infinity;
                res.forEach(function (r) {
                    max = Math.max(max, r.properties.point_count || 0);
                    min = Math.min(max, r.properties.point_count || Infinity);
                });
                res.forEach(function (f) {
                    if (f.properties.cluster) {

                        //f.geometry.coordinates.altitude=Math.pow(1,10*y);
                        var normalizedCount = (f.properties.point_count - min) / (max - min);

                        switch (true) {
                            case normalizedCount < 0.25:
                                imageSource = "src/images/low.png";
                                break;
                            case normalizedCount < 0.55:
                                imageSource = "src/images/medium.png";
                                break;
                            case normalizedCount < 0.75:
                                imageSource = "src/images/high.png";
                                break;
                            default:
                                imageSource = "src/images/vhigh.png";
                                break;
                        }

                        label = "" + f.properties.point_count_abbreviated;
                        var offsetText =
                            new WorldWind.Offset(
                                WorldWind.OFFSET_PIXELS, 5,
                                WorldWind.OFFSET_PIXELS, -40);
                        var imageScale = 0.5;
                        var zoomLevel = y + 1;
                    } else {
                        label = f.properties.name;
                        imageSource = WorldWind.configuration.baseUrl + "images/pushpins/push-pin-red.png";
                        var zoomLevel = false;
                    }
                    var options = {
                        imageSource: imageSource,
                        enabled: false,
                        label: label,
                        offsetText: offsetText,
                        imageScale: imageScale,
                        zoomLevel: zoomLevel
                    };
                    var coords = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
                    var p = self.newPlacemark(coords, null, options);

                    self.add(p);
                    self.addToZoom(y, p.index);
                });
            }
        }
        if (!this.maxReached) {
            this.maxReached = end;
        }
        this.picking();
    };

    MarkerCluster.prototype.createZoomClusters = function (n) {
        for (var x = 0; x <= n; x++) {
            this.levels[x] = [];
        }
        return this.levels;
    };

    MarkerCluster.prototype.addToZoom = function (zoom, index) {
        this.levels[zoom].push(index);
    };

    MarkerCluster.prototype.setLayer = function (layer) {
        this.layer = layer;
    };

    MarkerCluster.prototype.add = function (placemark) {
        if (Object.prototype.toString.call(placemark) === '[object Array]') {
            var self = this;
            placemark.forEach(function (place) {
                placemark.index = self.placemarks.length;
                self.layer.addRenderable(place);
                self.placemarks.push(place);
            })
        } else {
            placemark.index = this.placemarks.length;
            this.layer.addRenderable(placemark);
            this.placemarks.push(placemark);
        }
    };

    MarkerCluster.prototype.generatePlacemarks = function (coordinates, placemarkAttributes, options) {
        var lat, lng, alt;
        if (typeof(coordinates[0]) !== "undefined" && typeof(coordinates[1]) !== "undefined") {
            lat = Number(coordinates[0]);
            lng = Number(coordinates[1]);
        } else if (typeof(coordinates.lat) !== "undefined" && typeof(coordinates.lng) !== "undefined") {
            lat = Number(coordinates.lat);
            lng = Number(coordinates.lng);
        } else {
            throw ("Error in coordinates");
        }


        if (!options) {
            options = {};
        }

        alt = coordinates[2] ? coordinates[2] : 0;
        alt = coordinates.alt ? coordinates.alt : alt;

        var position = new WorldWind.Position(lat, lng, alt);


        if (!placemarkAttributes) {
            placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
            placemarkAttributes.imageScale = options.imageScale ? options.imageScale : 1;
            placemarkAttributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.3,
                WorldWind.OFFSET_FRACTION, 0.0);

            if (options.offsetText) {
                placemarkAttributes.labelAttributes.offset = options.offsetText;
            } else {
                placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 0.5,
                    WorldWind.OFFSET_FRACTION, 1.0);
            }
            placemarkAttributes.labelAttributes.color = WorldWind.Color.WHITE;
            placemarkAttributes.labelAttributes.font.size = 30;


        }

        var placemark = new WorldWind.Placemark(position, true, null);
        placemark.label = options.label ? options.label : "MyMarker " + lat + " - " + lng;
        placemark.altitudeMode = options.altitudeMode ? options.altitudeMode : WorldWind.RELATIVE_TO_GROUND;
        placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
        placemarkAttributes.imageSource = options.imageSource ? options.imageSource : WorldWind.configuration.baseUrl + "images/pushpins/push-pin-red.png";
        placemark.attributes = placemarkAttributes;
        placemark.imageTilt = 5;
        placemark.eyeDistanceScaling = true;
        placemark.eyeDistanceScalingThreshold = 3e6;
        placemark.eyeDistanceScalingLabelThreshold = 1e20;
        placemark.options = options;
        placemark.enabled = false;

        return placemark;
    };

    MarkerCluster.prototype.newPlacemark = function (coordinates, placemarkAttributes, options) {
        if (!coordinates) {
            throw ("No coordinates provided");
        }
        var placemark;
        if (typeof (coordinates[0]) == "object") {
            placemark = [];
            for (var index in coordinates) {
                placemark.push(this.generatePlacemarks(coordinates[index], placemarkAttributes, options));
            }
        } else {
            placemark = this.generatePlacemarks(coordinates, placemarkAttributes, options)
        }
        return placemark;
    };

    MarkerCluster.prototype.hide = function (placemark) {
        var index = placemark.index;
        this.placemarks[index].enabled = false;
        return placemark;
    };

    MarkerCluster.prototype.show = function (placemark) {
        var index = placemark.index;
        this.placemarks[index].enabled = true;
        return placemark;
    };

    MarkerCluster.prototype.hideAllSingle = function () {
        for (var x = 0; x <= this.placemarks; x++) {
            this.placemarks[x].enabled = false;
        }
    };

    MarkerCluster.prototype.hideAllLevels = function () {
        for (var x = 0; x <= this.zoomLevels && x <= this.maxReached; x++) {
            this.hideZoomLevel(x);
        }
    };

    MarkerCluster.prototype.hideZoomLevel = function (zoomLevel) {
        if (this.levels[zoomLevel]) {
            for (var x = 0; x < this.levels[zoomLevel].length; x++) {
                this.hide(this.placemarks[this.levels[zoomLevel][x]]);
            }
        }
    };

    MarkerCluster.prototype.showZoomLevel = function (zoomLevel) {
        if (this.levels[zoomLevel]) {
            for (var x = 0; x < this.levels[zoomLevel].length; x++) {
                this.show(this.placemarks[this.levels[zoomLevel][x]]);
            }
        }
    };

    MarkerCluster.prototype.hideOutside = function (zoomLevel) {
        var count = 0;
        if (this.levels[zoomLevel]) {
            for (var x = 0; x < this.levels[zoomLevel].length; x++) {
                if (this.placemarks[this.levels[zoomLevel][x]].imageBounds) {
                    if (!this.placemarks[this.levels[zoomLevel][x]].isVisible(wwd.drawContext)) {
                        this.placemarks[this.levels[zoomLevel][x]].enabled = false;
                        count++;
                    }
                }
            }
        }
        console.log(count);
    };

    MarkerCluster.prototype.removePlacemark = function (placemark) {
        this.layer.removeRenderable(placemark);
        this.placemarks.splice(this.placemarks.indexOf(placemark));
    };

    return MarkerCluster;
})
;

