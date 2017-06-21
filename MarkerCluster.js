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
                levels: 10
            }
        }
        this.placemarks = [];
        this.layer = new WorldWind.RenderableLayer("MarkerCluster");
        if (wwd) {
            wwd.addLayer(this.layer);
        }
        this.zoomLevels = options.levels;
        this.levels = [];
        this.createZoomClusters(this.zoomLevels);

        if (markers) {
            var self = this;
            markers.forEach(function (m) {
                self.add(m);
            });
            this.generateCluster();
        }
       // this.ranges = [10000000, 5000000, 1000000, 500000, 100000, 50000, 20000, 3000, 1000];
        this.ranges = [100000000, 50000000, 10000000, 5000000, 1000000, 500000, 200000, 30000, 10000];
        this.bindNavigator();
    };

    MarkerCluster.prototype.bindNavigator = function () {

        var navigator = wwd.navigator;
        var LookAtNavigator = WorldWind.LookAtNavigator;
        var ranges = this.ranges;
        var self = this;

        navigator.handleWheelEvent = function (event) {
            LookAtNavigator.prototype.handleWheelEvent.apply(this, arguments);
            var range = this.range;
            self.hideAll();
            switch (true) {
                case (range > ranges[0]):
                    self.showZoomLevel(0);
                    break;
                case  (range > ranges[1] && range < ranges[0]):
                    self.showZoomLevel(1);
                    break;
                case  (range > ranges[2] && range < ranges[1]):
                    self.showZoomLevel(2);
                    break;
                case  (range > ranges[3] && range < ranges[2]):
                    self.showZoomLevel(3);
                    break;
                case  (range > ranges[4] && range < ranges[3]):
                    self.showZoomLevel(4);
                    break;
                case  (range > ranges[5] && range < ranges[4]):
                    self.showZoomLevel(5);
                    break;
                case  (range > ranges[6] && range < ranges[5]):
                    self.showZoomLevel(6);
                    break;
                case  (range > ranges[7] && range < ranges[6]):
                    self.showZoomLevel(7);
                    break;
                case  (range > ranges[8] && range < ranges[7]):
                    self.showZoomLevel(8);
                    break;
                case (range < ranges[8]):
                    self.showZoomLevel(9);
                    break;
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
            radius: 60,
            extent: 256,
            maxZoom: 17
        }).load(geojson.features);

        var end = this.zoomLevels;

        for (var y = 0; y < end; y++) {
            var res = cluster.getClusters([-180, -90, 180, 90], y);
            var self = this;
            res.forEach(function (f) {
                var p = self.newPlacemark(f.geometry.coordinates, null, {enabled: false, label:"Level: "+y});
                self.add(p);
                self.addToZoom(y, p.index);
            });
        }
    };

    MarkerCluster.prototype.createZoomClusters = function (n) {
        for (var x = 0; x < n; x++) {
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
        }

        var placemark = new WorldWind.Placemark(position, true, null);
        placemark.label = options.label ? options.label : "MyMarker " + lat + " - " + lng;
        placemark.altitudeMode = options.altitudeMode ? options.altitudeMode : WorldWind.RELATIVE_TO_GROUND;
        placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
        placemarkAttributes.imageSource = options.imageSource ? options.imageSource : WorldWind.configuration.baseUrl + "images/pushpins/plain-blue.png";
        placemark.attributes = placemarkAttributes;

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
        for (var x = 0; x < this.zoomLevels; x++) {
            this.hideZoomLevel(x);
        }
    };

    MarkerCluster.prototype.hideZoomLevel = function (zoomLevel) {
        for (var x = 0; x < this.levels[zoomLevel].length; x++) {
            this.hide(this.placemarks[this.levels[zoomLevel][x]]);
        }
    };

    MarkerCluster.prototype.showZoomLevel = function (zoomLevel) {

        for (var x = 0; x < this.levels[zoomLevel].length; x++) {
            this.show(this.placemarks[this.levels[zoomLevel][x]]);
        }
    };


    MarkerCluster.prototype.removePlacemark = function (placemark) {
        this.layer.removeRenderable(placemark);
        this.placemarks.splice(this.placemarks.indexOf(placemark));
    };
    return MarkerCluster;
});

