define([
    'dojo/_base/declare',
    'dojo/Stateful',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/i18n!esri/nls/jsapi'
], function (
    declare, Stateful, lang, array, topic, esriBundle
) {
    var model = {
        debug: false,
        nlsDefault: lang.clone(esriBundle), //clone of default nls
        mapConfig: null, //clone on map options
        mapExtent: null, //current extent of map
        mapLod: null, //current map LOD
        mapCursorX: null, //map x of cursor
        mapCursorY: null, //map y of cursor
        mapCursorLng: null, //map longitude of cursor
        mapCursorLat: null, //map latitude of cursor
        mapCursor: false, //is cursor over map
        map: null, //the map
        layerInfos: [], //the layers
        widgetInfos: [] //the widgets
    };

    var SingletonClass = declare([Stateful], {
        constructor: function () {
            lang.mixin(this, model);
        },

        // custom map setter
        _mapSetter: function (map) {
            this.map = map;
            if (map.loaded) {
                this.mapLoad({
                    map: map
                });
            } else {
                map.on('load', lang.hitch(this, 'mapLoad'));
            }
            this.map.on('resize', function (evt) {
                var pnt = evt.target.extent.getCenter();
                setTimeout(function () {
                    evt.target.centerAt(pnt);
                }, 100);
            });
        },

        // wire up model map events
        mapLoad: function (r) {
            var map = r.map;
            //wire up extent change handler and defaults
            map.on('extent-change', lang.hitch(this, '_mapExtentChangeHandler'));
            this.set('mapExtent', map.extent);
            this.set('mapLod', map.getLevel());
            //wire up mouse move
            map.on('mouse-move, mouse-drag', lang.hitch(this, '_mouseMoveHandler'));
            //wire up mouse over and out
            map.on('mouse-over', lang.hitch(this, function () {
                this.set('mapCursor', true);
            }));
            map.on('mouse-out', lang.hitch(this, function () {
                this.set('mapCursor', false);
            }));
        },

        // set model properties on extent change
        _mapExtentChangeHandler: function (evt) {
            this.set('mapExtent', evt.extent);
            this.set('mapLod', evt.lod);
        },

        // set model properties on mouse move/drag
        _mouseMoveHandler: function (evt) {
            var pnt = evt.mapPoint;
            this.set('mapCursorX', pnt.x);
            this.set('mapCursorY', pnt.y);
            this.set('mapCursorLng', pnt.getLongitude() || null);
            this.set('mapCursorLat', pnt.getLatitude() || null);
        },

        // get layerInfo by layer id
        getLayerInfo: function (id) {
            var filter = array.filter(this.layerInfos, function (layerInfo) {
                return layerInfo.id === id;
            });
            if (filter[0]) {
                return filter[0];
            } else {
                return null;
            }
        },

        // get widgetInfo by widget (dijit) id
        getWidgetInfo: function (id) {
            var filter = array.filter(this.widgetInfos, function (widgetInfo) {
                return widgetInfo.id === id;
            });
            if (filter[0]) {
                return filter[0];
            } else {
                return null;
            }
        },

        // custom setter for debug wires up or removes error handling
        _debugSetter: function (debug) {
            this.debug = debug;
            if (this.debug) {
                this._errorHandler = topic.subscribe('viewer/error', lang.hitch(this, 'handleError'));
            } else {
                if (this._errorHandler) {
                    this._errorHandler.remove();
                }
            }
        },

        // log errors
        //    call directly if class/widget includes appModel
        //    or publish 'viewer/error' topic if not
        handleError: function (options) {
            if (this.debug) {
                if (typeof (console) === 'object') {
                    for (var option in options) {
                        if (options.hasOwnProperty(option)) {
                            console.log(option, options[option]);
                        }
                    }
                }
            } else {
                return;
            }
        }
    });

    if (!_instance) {
        var _instance = new SingletonClass();
    }
    return _instance;
});