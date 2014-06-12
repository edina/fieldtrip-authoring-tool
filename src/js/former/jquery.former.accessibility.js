var Accesibility = function(options){
	var defaults = {
		msg_mailto: ",will open your email client in a new window"
	};

	this.options = $.extend(defaults, options || {});
};

/*
	Apply some accessibility rules to the document
*/
Accesibility.prototype.apply = function(){
	this.mailto();
};

/*
	Inject an alt text into the mailto links notifying the user that it's
	about to leave the window.
*/
Accesibility.prototype.mailto = function(){
	
	// Transparent 1x1 gif
	gif='<span><img alt="' + this.options.msg_mailto +'" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></span>';	

	$("a").each(function(index){
		$this = $(this);
		if(this.href.match('^mailto:')){
			$this.append(gif);
		}
	});
};

/*
	Decorate jQuery.show and jQuery.hide to update the aria-hiden attribute
*/
(function($)
{
    var _show = $.fn.show;
    var _hide = $.fn.hide;
 
    $.fn.show = function()
    {
        var ret = _show.apply(this, arguments);
        if(this.attr('aria-hidden') && this.attr('aria-hidden') != 'false'){
        	this.attr('aria-hidden', 'false')
        }
        return ret;
    };

    $.fn.hide = function()
    {
        var ret = _hide.apply(this, arguments);
        if(this.attr('aria-hidden') && this.attr('aria-hidden') != 'true'){
        	this.attr('aria-hidden', 'true')
        }
        return ret;
    };

})(jQuery);


