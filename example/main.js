var wwd;
var markerCluster;
var cluster;
var layerManager;
requirejs(['../libraries/WorldWind/WorldWind',
        'js/LayerManager', '../src/MarkerCluster'],
    function (ww,
              LayerManager, MarkerCluster) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
        WorldWind.configuration.baseUrl = "libraries/WorldWind/"
        wwd = new WorldWind.WorldWindow("canvasOne");

        var layers = [
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
        ];

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            layers[l].layer.detailControl = 1;
            wwd.addLayer(layers[l].layer);
        }


        //create a cluster
        markerCluster = new MarkerCluster(wwd);
        /*
         //create a placemark
         var placemark = markerCluster.newPlacemark([37, 15]);
         markerCluster.add(placemark);

         //hide a placemark
         markerCluster.hide(placemark);

         //show a placemark
         markerCluster.show(placemark);

         //create multiple placemark
         var placemarks = markerCluster.newPlacemark([[37, 14], [36, 15]]);
         markerCluster.add(placemarks);
         */

        layerManager = new LayerManager(wwd);
        wwd.navigator.lookAtLocation.latitude = 37;
        wwd.navigator.lookAtLocation.longitude = 15;

        for (var x = -90; x < 90; x = x + 1) {
            for (var y = -90; y < 90; y = y + 1) {
                var p = markerCluster.newPlacemark([y, x], null, {enabled: false}, {label: x + "_" + y});
                markerCluster.add(p);
            }
        }
        markerCluster.generateCluster();
        /*
         getJSON('example/places.json', function (geojson) {


         geojson.features.forEach(function (f) {
         var coords = f.geometry.coordinates;
         var p = markerCluster.newPlacemark([coords[0], coords[1]], null, {enabled: false});
         markerCluster.add(p);
         });


         }




         });
         */


        function getJSON(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'json';
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.onload = function () {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300 && xhr.response) {
                    callback(xhr.response);
                }
            };
            xhr.send();
        }
    });

