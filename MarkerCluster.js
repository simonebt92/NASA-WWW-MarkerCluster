var MarkerCluster = function (wwd) {

    this.placemarks=[];
    this.layer = new WorldWind.RenderableLayer("MarkerCluster");
    wwd.addLayer(this.layer);

    this.setLayer=function(layer){
        this.layer=layer;
    };

    this.addPlacemark = function (placemark) {
        this.layer.addRenderable(placemark);
        this.placemarks.push(placemark);
    };

    this.removePlacemark = function (placemark) {
        this.layer.removeRenderable(placemark);
        this.placemarks.splice(this.placemarks.indexOf(placemark));
    };
};