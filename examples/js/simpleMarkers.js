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

        var markerCluster = new MarkerCluster(wwd);
        var layerManager = new LayerManager(wwd);


        $("#insertButton").click(function () {
            var lat = Number($("#lat").val());
            var lon = Number($("#lon").val());
            var text = $("#text").val();
            var p = markerCluster.newPlacemark([lat, lon], null, {label: text});
            markerCluster.add(p);
            p.enabled = true;
        });

    });


