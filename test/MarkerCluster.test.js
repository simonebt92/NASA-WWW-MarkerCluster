define(['MarkerCluster','libraries/WorldWind/WorldWind'], function (MarkerCluster,WorldWind) {


    describe('MarkerCluster test', function () {
        it('Example test', function () {

            var m = new MarkerCluster();
            var l=1;
            m.setLayer(l);
            expect(m.layer).toBe(1);
        });

    });
});
