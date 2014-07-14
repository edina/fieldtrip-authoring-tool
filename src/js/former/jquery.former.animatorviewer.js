var AnimatorViewer = function(mapviewer, selector, options){
    var defaults = {
        tableSelector: '#animator-myTable'
    };

    this.options = $.extend(defaults, options);
    this.mapviewer = mapviewer;
    this.controls_selector = selector;
    this._initDomControls();
};


AnimatorViewer.prototype._initDomControls = function(){
    this._initEvents();
    this._initKeyboardNavigation();
};


/*
 *   Copy tracks from the mapviewer table to the animator table
 */
AnimatorViewer.prototype.copy_tracks = function(){
    var animatorTableTbodyHTML = '';
    $('#myTable .track').each(function(index, el) {
        var trackId = $(el).attr('trackid');
        animatorTableTbodyHTML += '<tr id="rowek-'+el.id.split("-")[1]+'" trackid="'+trackId+'">';

        $(el).find('td').each(function(index, el) {
            if(index !== 0 && index !==4){
                animatorTableTbodyHTML += '<td>'+$(el).text()+'</td>';
            }
        });

        var numberOfPOIs = $('#myTable').find('tr[trackid='+trackId+']').size()-1;
        animatorTableTbodyHTML += '<td>'+numberOfPOIs+'</td>';
        animatorTableTbodyHTML += '</tr>';
    });
    $('#animator-myTable tbody').html(animatorTableTbodyHTML);
};

AnimatorViewer.prototype._initKeyboardNavigation = function(){
    var table = this.options.tableSelector;

    $(document).off('keyup', table);
    $(document).on('keyup', table, function(evt){
        var $row = $('.row_selected', table);
        switch(evt.keyCode){
            case 40: // Down
                if($row.length == 0){
                    $('tbody tr:first', table).trigger('click');
                }else{
                    if(!$row.is(':last-child')){
                        $row.nextAll('tr')
                            .first()
                            .trigger('click');
                    }
                }
            break;
            case 38: // Up
                if($row.length == 0){
                    $('tbody tr:last', table).trigger('click');
                }
                else{
                    if($row.index() > 0){
                        $row.prevAll('tr')
                            .first()
                            .trigger('click');
                    }
                }
            break;
            case 13: // Enter
                var $play = $('#track-animate');
                var $pause = $('#track-pause-animate');
                if(!$play.is(':disabled') && $play.is(':visible')){
                    $play.trigger('click');
                }else if($pause.is(':visible')){
                    $pause.trigger('click');
                }
            break;
        }
    });
};

/**
 * Enabling all features related to the Track Animator
 */
AnimatorViewer.prototype._initEvents = function(){
    $('#animator-myTable tbody').on('click', 'tr', $.proxy(function(e){
        console.log(this.track_animator);
        if(this.track_animator !== undefined){
            this.track_animator.destroy();
        }

        if($('#track-animate').css('display') === "none")
        {
            $('#track-animate').attr('disabled', 'disabled');
            $('#track-pause-animate').hide();
            $('#track-animate').show();
        }
        // loading(true); // would be useful to add loading, but removing it later on could be tricky (as other events also controls the loading state...)
        $(e.currentTarget).parent().find('button.track-animate').hide();
        $(e.currentTarget).parent().find('tr.row_selected')
            .removeClass('row_selected')
            .attr('aria-selected', false);

        $(e.currentTarget)
            .addClass('row_selected')
            .attr('aria-selected', true)
            .focus();

        var trackName = $(e.currentTarget).children().first().text();
        aria.notify(name);

        // Load and display selected GPX track.
        var recordId = parseInt(e.currentTarget.id.split("-")[1]);
        var feature = findFeaturesByAttribute(this.mapviewer.features, 'id', recordId);

        if(feature !== null){
            this.mapviewer.map.setCenter(feature.geometry.bounds.getCenterLonLat(), 11);
            this.mapviewer.displayGPX(feature.attributes.name,
                                      feature.attributes,
                                      function(){
                                            $('#track-animate').removeAttr('disabled');
                                         });
        }
    }, this));

    $('#track-animate').on('click', $.proxy(function(e){
        e.preventDefault();

        var trackName = $('#animator-myTable').find('tr.row_selected td:first-child').text();

        this.track_animator = new TrackAnimator(this.mapviewer.map, trackName);

        this.track_animator.init();
        var POIs = Array();
        $('#myTable').find('tr.poi[trackid='+$('#animator-myTable').find('tr.row_selected').attr('trackid')+']').each(function(index, el) {
            POIs[index] = el;
        });

        for(var i in POIs)
        {
            var poiName = $(POIs[i]).attr('record-name');
            var poiLonLat = new OpenLayers.LonLat(
                this.mapviewer.map.getLayersByName("Clusters")[0].features[POIs[i].id.split("-")[1]].geometry.x,
                this.mapviewer.map.getLayersByName("Clusters")[0].features[POIs[i].id.split("-")[1]].geometry.y);
            var poi = new POI(poiName, null, poiLonLat, this.track_animator.map);
            this.track_animator.walk.addPOI(poi);
        }
        this.track_animator.walk.playAnimation();

        aria.notify("Start playing track: " + this.track_animator.walker.name);

        $('#track-animate').hide();
        $('#track-pause-animate').show();
    },this));

    $('#track-pause-animate').on('click', $.proxy(function(e){
        e.preventDefault();
        if(this.track_animator.walk.animation.isPlaying)
        {
            $('#track-pause-animate').html('Resume <i class="icon-play"></i>');
            this.track_animator.walk.animation.isPlaying = false;
            aria.notify("Pause playing track: " + this.track_animator.walker.name);
        }
        else
        {
            this.track_animator.walk.animation.isPlaying = true;
            $('#track-pause-animate').html('Pause Animation <i class="icon-pause"></i>');
            this.track_animator.walk.animation.anim();
            aria.notify("Resume playing track: " + this.track_animator.walker.name);
        }

    },this));
};