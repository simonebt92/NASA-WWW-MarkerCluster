requirejs(['../../libraries/WorldWind/WorldWind',
        './LayerManager', '../../src/MarkerCluster'],
    function (ww,
              LayerManager, MarkerCluster) {
        "use strict";


        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
        WorldWind.configuration.baseUrl = "../libraries/WorldWind/";
        var wwd = new WorldWind.WorldWindow("canvasOne");

        var layers = [
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true}
        ];
        var viewControlsLayer = new WorldWind.ViewControlsLayer(wwd);

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            layers[l].layer.detailControl = 1;
            wwd.addLayer(layers[l].layer);
        }
        wwd.addLayer(viewControlsLayer);


        $("#insertButton").click(function () {
            var maxCount = Number($("#maxCount").val());
            var maxLevel = Number($("#maxLevel").val());
            var radius = Number($("#radius").val());
            var url = $("#url").val();
            
            var markerCluster = new MarkerCluster(wwd, {
                name: url,
                controls: viewControlsLayer,
                maxLevel: maxLevel,
                maxCount: maxCount,
                radius: radius
            });
            getJSON(url, function (results) {
                markerCluster.generateJSONCluster(results);
                layerManager.synchronizeLayerList();
                alert("Clusters are ready!")
            });

        });

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

