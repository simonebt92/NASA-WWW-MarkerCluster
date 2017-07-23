var markerClusterUSCities;
requirejs(['../libraries/WorldWind/WorldWind',
        '../example/js/LayerManager', '../src/MarkerCluster'],
    function (ww,
              LayerManager, MarkerCluster) {
        "use strict";


        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
        WorldWind.configuration.baseUrl = "libraries/WorldWind/";
        var wwd = new WorldWind.WorldWindow("canvasOne");

        var layers = [
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
        ];
        var viewControlsLayer = new WorldWind.ViewControlsLayer(wwd);

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            layers[l].layer.detailControl = 1;
            wwd.addLayer(layers[l].layer);
        }
        wwd.addLayer(viewControlsLayer);

        /*
         //create a cluster
         markerCluster = new MarkerCluster(wwd);

         //create a placemark
         var placemark = markerCluster.newPlacemark([37, 15]);
         markerCluster.add(placemark);

         //hide a placemark
         //markerCluster.hide(placemark);

         //show a placemark
         //markerCluster.show(placemark);

         //create multiple placemark
         var placemarks = markerCluster.newPlacemark([[37, 14], [36, 15]]);
         markerCluster.add(placemarks);
         markerCluster.generateCluster();
         */


        markerClusterUSCities = new MarkerCluster(wwd, {
            name: "US Cities",
            controls: viewControlsLayer,
            maxLevel: 7
        });

        getJSON('example/usCities.geojson', function (results) {
            markerClusterUSCities.generateJSONCluster(results);
        });

        /*
         var markerClusterAllGlobe = new MarkerCluster(wwd, {name: "Many Coords layer", controls: viewControlsLayer});
         for (var x = -90; x < 90; x = x + 1) {
         for (var y = -90; y < 90; y = y + 1) {
         var p = markerClusterAllGlobe.newPlacemark([x, y], null, {label: x + "_" + y});
         markerClusterAllGlobe.add(p);
         }
         }
         markerClusterAllGlobe.generateCluster();
         markerClusterAllGlobe.off();
         */
        /*
         markerClusterUSCities = new MarkerCluster(wwd, {
         name: "US Cities",
         controls: viewControlsLayer,
         maxLevel: 7
         });

         getJSON('example/usCities.json', function (results) {
         results.forEach(function (city) {
         var p = markerClusterUSCities.newPlacemark(
         [city.latitude, city.longitude],
         null,
         {label: city.city}
         );
         markerClusterUSCities.add(p);
         });
         markerClusterUSCities.generateCluster();

         });


         */
        var layerManager = new LayerManager(wwd);

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
    })
;

