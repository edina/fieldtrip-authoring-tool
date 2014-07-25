/*
 * This control merge the Click Handler and the Hover handler
 */
OpenLayers.Control.Hover = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: {
        hover: {
            'delay': 500,
            'pixelTolerance': null,
            'stopMove': false,
        },
        click: {
            delay: 200,
            double: true,
            stopDouble: true,
        }
    },

    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions
        );
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.handlers = {};
    },

    draw: function() {
        var clickHandler = new OpenLayers.Handler.Click(
            this,
            {
                click: this.onClick,
                dblclick: this.onDblClick
            },
            this.handlerOptions.click
        );

        var hoverHandler = new OpenLayers.Handler.Hover(
            this,
            {
                'pause': this.onPause,
                'move': this.onMove,
            },
            this.handlerOptions.hover
        );


        this.handlers.hover = hoverHandler;
        this.handlers.click = clickHandler;
    },

    activate: function() {
        this.handlers.hover.activate();
        this.handlers.click.activate();
        return OpenLayers.Control.prototype.activate.apply(this,arguments);
    },

    deactivate: function() {
        this.handlers.hover.deactivate();
        this.handlers.click.deactivate();
        return OpenLayers.Control.prototype.deactivate.apply(this,arguments);
    },

    onPause: function(evt) {
    },

    onMove: function(evt) {
    },

    onClick: function(evt){
    },

    onDblClick: function(evt){
    },

    CLASS_NAME: "OpenLayers.Control.Hover"
});