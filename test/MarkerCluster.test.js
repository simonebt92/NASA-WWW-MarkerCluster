define(['src/MarkerCluster', 'libraries/WorldWind/WorldWind'], function (MarkerCluster, WorldWind) {

    describe('MarkerCluster test', function () {

        it('Constructor with properties', function () {
            var globe = {},
                options = {
                    smooth: true,
                    maxLevel: 8,
                    controls: true
                };

            globe.addLayer = jasmine.createSpy("addLayer");

            var markerCluster = new MarkerCluster(globe, options);
            expect(markerCluster.options).toBe(options);
            expect(markerCluster.smooth).toBe(options.smooth);
            expect(markerCluster.zoomLevels).toBe(options.maxLevel);
            expect(markerCluster.controlLayer).toBe(options.controls);
        });

        it('Turn off the cluster', function () {
            var markerCluster = new MarkerCluster();
            markerCluster.off();
            expect(markerCluster.layer.enabled).toBe(false);
        });

        it('Turn on the cluster', function () {
            var markerCluster = new MarkerCluster();
            markerCluster.layer.enabled = false;
            markerCluster.on();
            expect(markerCluster.layer.enabled).toBe(true);
        });

        it('Add picking functionalities', function () {
            var globe = {eventListeners: {}};
            globe.addLayer = jasmine.createSpy("addLayer");
            globe.addEventListener = jasmine.createSpy("addEventListener");
            var markerCluster = new MarkerCluster(globe);

            markerCluster.picking();
            expect(globe.eventListeners.addedListeners).toBe(true);
            expect(globe.addEventListener.calls.count()).toBe(2);
        });

        it('createZoomClusters', function () {
            var markerCluster = new MarkerCluster();
            var levels = 10;
            markerCluster.createZoomClusters(levels);
            for (var x = 0; x <= levels; x++) {
                expect(markerCluster.levels[x]).toEqual([]);
            }
        });

        it('addToZoom', function () {
            var markerCluster = new MarkerCluster();

            var zoom = 10,
                index = 5;
            markerCluster.levels[zoom] = [];
            markerCluster.addToZoom(zoom, index);
            expect(markerCluster.levels[zoom].indexOf(index)).toBe(0);
        });

        it('setLayer', function () {
            var markerCluster = new MarkerCluster();
            var layer = "layer";
            markerCluster.setLayer(layer);
            expect(markerCluster.layer).toBe(layer);
        });

        it('add', function () {
            var layer = {},
                placemark = "placemark";
            layer.addRenderable = jasmine.createSpy("addRenderable");

            var markerCluster = new MarkerCluster();
            markerCluster.layer = layer;
            markerCluster.add(placemark);

            expect(layer.addRenderable).toHaveBeenCalledWith(placemark);
        });

        it('generatePlacemark', function () {
            var markerCluster = new MarkerCluster();
            var options = "options";
            var placemark = markerCluster.generatePlacemarks([10, 10], null, options);

            expect(placemark.options).toEqual(options);
            expect(placemark.position.latitude).toEqual(10);
            expect(placemark.position.longitude).toEqual(10);
        });

        it('hide', function () {
            var markerCluster = new MarkerCluster();
            var index = 5;
            var placemark = {index: index,enabled:true};

            markerCluster.placemarks = [];
            markerCluster.placemarks[index] = placemark;

            markerCluster.hide(placemark);
            expect(placemark.enabled).toEqual(false);

        });

        it('show', function () {
            var markerCluster = new MarkerCluster();
            var index = 5;
            var placemark = {index: index,enabled:false};

            markerCluster.placemarks = [];
            markerCluster.placemarks[index] = placemark;

            markerCluster.show(placemark);
            expect(placemark.enabled).toEqual(true);

        });
    });
});