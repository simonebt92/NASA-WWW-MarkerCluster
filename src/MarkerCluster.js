define(['../libraries/supercluster.min', '../libraries/WorldWind/WorldWind'], function (supercluster, wwe) {

    var MarkerCluster = function (globe, markers, options) {
        if (!options) {
            options = {
                levels: 9,
                smooth: true
            }
        }

        this.options = options;
        this.placemarks = [];
        this.layer = new WorldWind.RenderableLayer("MarkerCluster");
        if (globe) {
            globe.addLayer(this.layer);
        }
        this.globe = globe;
        this.zoomLevel = 0;
        this.zoomLevels = options.levels;
        this.levels = [];
        this.maxReached = this.zoomLevels;
        this.minReached = 0;
        this.createZoomClusters(this.zoomLevels);

        if (markers) {
            var self = this;
            markers.forEach(function (m) {
                self.add(m);
            });
            this.generateCluster();
        }
        //this.ranges = [100000000, 50000000, 10000000, 5000000, 1000000, 500000, 200000, 30000, 10000];
        this.bindNavigator();
    };

    MarkerCluster.prototype.bindNavigator = function () {

        var navigator = this.globe.navigator;
        var LookAtNavigator = WorldWind.LookAtNavigator;
        var self = this;

        function convertToRange(value, srcRange, dstRange) {
            if (value < srcRange[0]) {
                return dstRange[0];
            }
            if (value > srcRange[1]) {
                return dstRange[1];

            }
            var srcMax = srcRange[1] - srcRange[0],
                dstMax = dstRange[1] - dstRange[0],
                adjValue = value - srcRange[0];
            return (adjValue * dstMax / srcMax) + dstRange[0];
        }

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
                        nav.busy = false;
                    });
                    this.applyLimits();
                    this.worldWindow.redraw();
                }
            }

            var range = this.range;
            var res;


            var ranges = [100000000,5294648, 4099739, 2032591, 1650505, 800762, 500000, 100000,  7000];

            console.log(range);
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
            /*

             if (range > 10000) {
             res = convertToRange(range, [10000, 5000000], [0, 11]);//0-16
             res = Math.round(16 - res);
             } else {
             res = convertToRange(range, [500, 10000], [11, 16]);//16-23
             res = Math.round(16 - 11 + res);//23+16
             }
             */
            //res = Math.round(convertToRange(res, [0, 16], [0, self.zoomLevels]));//23

            self.oldZoom = self.zoomLevel || 0;
            self.zoomLevel = res;

            console.log(res);

            if (res < self.minReached) {
                self.hideAll();
                self.showZoomLevel(self.minReached);//possible overhead
            } else if (res > self.maxReached) {
                self.hideAll();
                self.showInRange(self.maxReached);
                //self.showZoomLevel(self.maxReached);
            } else {
                if (self.levels[res].length != self.levels[self.oldZoom].length) {
                    // self.showZoomLevel(res);
                    self.hideAll();
                    self.showInRange(res);
                    self.globe.redraw();//dynamic
                }

                //self.hideOutside(res);


            }
        };


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

        var myJSON = '{"type": "FeatureCollection","features":[';
        newFeature = function (position) {
            return '{"type": "Feature","properties": {},"geometry": {"type": "Point","coordinates": [' +
                +position.longitude + ',' +
                +position.latitude + ']}}';
        };

        this.placemarks.forEach(function (p, i) {
            myJSON += newFeature(p.position) + ",";
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
            radius: 60,//should be dynamic
            extent: 128,
            maxZoom: self.zoomLevels
        }).load(geojson.features);

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
                var label;
                res.forEach(function (f) {

                    if (f.properties.cluster) {
                        label = "N." + f.properties.point_count;
                    } else {
                        label = f.properties.name;
                    }
                    var p = self.newPlacemark(f.geometry.coordinates, null, {enabled: false, label: label});
                    self.add(p);
                    self.addToZoom(y, p.index);
                });
            }
        }
        if (!this.maxReached) {
            this.maxReached = end;
        }
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
            lat = coordinates[0];
            lng = coordinates[1];
        } else if (typeof(coordinates.lat) !== "undefined" && typeof(coordinates.lng) !== "undefined") {
            lat = coordinates.lat;
            lng = coordinates.lng;
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
            placemarkAttributes.imageScale = 2;
            placemarkAttributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.3,
                WorldWind.OFFSET_FRACTION, 0.0);

            placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.5,
                WorldWind.OFFSET_FRACTION, 1.0);
            placemarkAttributes.labelAttributes.color = WorldWind.Color.YELLOW;
            placemarkAttributes.labelAttributes.font.size = 40;

        }

        var placemark = new WorldWind.Placemark(position, true, null);
        placemark.label = options.label ? options.label : "MyMarker " + lat + " - " + lng;
        placemark.altitudeMode = options.altitudeMode ? options.altitudeMode : WorldWind.RELATIVE_TO_GROUND;
        placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
        placemarkAttributes.imageSource = options.imageSource ? options.imageSource : WorldWind.configuration.baseUrl + "images/pushpins/push-pin-red.png";
        placemark.attributes = placemarkAttributes;
        placemark.eyeDistanceScaling = true;
        placemark.eyeDistanceScalingLabelThreshold = 1e20;

        if (options.enabled == false) {
            placemark.enabled = false;
        }

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


    MarkerCluster.prototype.hideAll = function () {
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

