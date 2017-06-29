requirejs.config({
    baseUrl: '.',
    paths: {
        supercluster: '../supercluster.min',
    }
});

define(['supercluster'], function (supercluster) {

    var MarkerCluster = function (wwd, markers, options) {
        if (!options) {
            options = {
                levels: 23
            }
        }
        this.placemarks = [];
        this.layer = new WorldWind.RenderableLayer("MarkerCluster");
        if (wwd) {
            wwd.addLayer(this.layer);
        }
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

        var navigator = wwd.navigator;
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
            var range = this.range;


            var res;
            if (range > 10000) {
                res = convertToRange(range, [10000, 6165728], [0, 16]);
                res = Math.round(16 - res);
            } else {
                res = convertToRange(range, [500, 10000], [16, 23]);
                res = Math.round(23 + 16 - res);
            }

            res = Math.round(convertToRange(res, [0, 23], [0, self.zoomLevels]));

            console.log(res);
            self.hideAll();
            if (res < self.minReached) {
                self.showZoomLevel(self.minReached);//possible overhead
            }else if (res > self.maxReached) {
                self.showZoomLevel(self.maxReached);
            }else{
                self.showZoomLevel(res);
            }
        };


    };

    MarkerCluster.prototype.generateCluster = function () {

        var myJSON = {
            "type": "FeatureCollection",
            "features": []
        };
        newFeature = function (position) {
            return {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        position.longitude,
                        position.latitude
                    ]
                }
            }
        };

        this.placemarks.forEach(function (p) {
            myJSON.features.push(newFeature(p.position))
        });

        this.generateJSONCluster(myJSON);
    };

    MarkerCluster.prototype.generateJSONCluster = function (geojson) {

        cluster = supercluster({
            log: true,
            radius: 10060,//should be dynamic
            extent: 256,
            maxZoom: 23
        }).load(geojson.features);

        var end = this.zoomLevels;

        for (var y = 0; y <= end; y++) {
            var res = cluster.getClusters([-180, -90, 180, 90], y);
            var self = this;

            if (this.minReached == 0 && res.length > 0) {
                this.minReached = y;
            }
            if (y > 0 && res.length > 0 && res.length == this.levels[y - 1].length) {
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
        if (coordinates[0] && coordinates[1]) {
            lat = coordinates[0];
            lng = coordinates[1];
        } else if (coordinates.lat && coordinates.lng) {
            lat = coordinates.lat;
            lng = coordinates.lng;
        }

        if (!options) {
            options = {};
        }

        alt = coordinates[2] ? coordinates[2] : 0;
        alt = coordinates.alt ? coordinates.alt : alt;

        var position = new WorldWind.Position(lat, lng, alt);


        if (!placemarkAttributes) {
            placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
            placemarkAttributes.imageScale = 5;
            placemarkAttributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.3,
                WorldWind.OFFSET_FRACTION, 0.0);

            placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.5,
                WorldWind.OFFSET_FRACTION, 1.0);
            placemarkAttributes.labelAttributes.color = WorldWind.Color.YELLOW;
            placemarkAttributes.labelAttributes.font.size = 100;

        }

        var placemark = new WorldWind.Placemark(position, true, null);
        placemark.label = options.label ? options.label : "MyMarker " + lat + " - " + lng;
        placemark.altitudeMode = options.altitudeMode ? options.altitudeMode : WorldWind.RELATIVE_TO_GROUND;
        placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
        placemarkAttributes.imageSource = options.imageSource ? options.imageSource : WorldWind.configuration.baseUrl + "images/pushpins/plain-blue.png";
        placemark.attributes = placemarkAttributes;
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
        for (var x = 0; x <= this.zoomLevels && x < this.maxReached; x++) {
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

    MarkerCluster.prototype.removePlacemark = function (placemark) {
        this.layer.removeRenderable(placemark);
        this.placemarks.splice(this.placemarks.indexOf(placemark));
    };

    return MarkerCluster;
})
;

