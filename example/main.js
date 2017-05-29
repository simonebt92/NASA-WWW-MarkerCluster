var wwd;
var markerCluster;
var cluster;
var layerManager;
requirejs(['../libraries/WorldWind/WorldWind',
        'js/LayerManager', '../scripts/MarkerCluster'],
    function (ww,
              LayerManager, MarkerCluster) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

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


        markerCluster = new MarkerCluster(wwd);
        markerCluster.newPlacemark([37, 15]);
        layerManager = new LayerManager(wwd);

        wwd.navigator.lookAtLocation.latitude = 37;
        wwd.navigator.lookAtLocation.longitude = 15;


        /*
         getJSON('places.json', function (geojson) {

         cluster = supercluster({
         log: true,
         radius: 60,
         extent: 256,
         maxZoom: 17
         }).load(geojson.features);

         var res = cluster.getClusters([-360, -90, 360, 90], 0);

         res.forEach(function (f) {
         markerCluster.newPlacemark(f.geometry.coordinates);
         });


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

