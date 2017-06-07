define(function () {

    var MarkerCluster = function (wwd) {
        this.placemarks = [];
        this.layer = new WorldWind.RenderableLayer("MarkerCluster");
        if (wwd) {
            wwd.addLayer(this.layer);
        }

    };

    MarkerCluster.prototype.setLayer = function (layer) {
        this.layer = layer;
    };

    MarkerCluster.prototype.add = function (placemark) {
        if (Object.prototype.toString.call(placemark) === '[object Array]') {
            var self = this;
            placemark.forEach(function (place) {
                self.layer.addRenderable(place);
                self.placemarks.push(place);
            })
        } else {
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
            placemarkAttributes.imageScale = 1;
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
                placemark.push(this.generatePlacemarks(coordinates[index]));
            }
        } else {
            placemark = this.generatePlacemarks(coordinates, placemarkAttributes, options)
        }

        return placemark;
    };

    MarkerCluster.prototype.removePlacemark = function (placemark) {
        this.layer.removeRenderable(placemark);
        this.placemarks.splice(this.placemarks.indexOf(placemark));
    };
    return MarkerCluster;
});