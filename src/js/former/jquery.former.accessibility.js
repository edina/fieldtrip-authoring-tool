var Accesibility = function(options){
	var defaults = {
		msg_mailto: ",will open your email client in a new window",
	};

	this.options = $.extend(defaults, options || {});
}

/*
	Apply some accessibility rules to the document
*/
Accesibility.prototype.apply = function(){
	this.mailto();
}

/*
	Inject an alt text into the mailto links notifying the user that it's
	about to leave the window.
*/
Accesibility.prototype.mailto = function(){
	
	// Transparent 1x1 gif
	gif='<span><img alt="' + this.options.msg_mailto +'" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></span>';	

	$("a").each(function(index){
		$this = $(this);
		if(this.href.startsWith('mailto:')){
			$this.append(gif);
		}
	});
}