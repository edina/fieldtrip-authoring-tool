var PCAPI = function(options){
	var defaults = {
        version: '1.3',
        provider: 'dropbox',
        oauth: '',
        records: 'records',
        pcapi: 'pcapi'
	};

	this.options = $.extend(defaults, options || {});
};

PCAPI.prototype.init = function(){

}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

PCAPI.prototype._url = function(){
	return '{0}/{1}/{2}/{3}/{4}/'.format(this.options.version,
										this.options.pcapi,
								        this.options.records,
								        this.options.provider,
								        this.options.oauth);
}

PCAPI.prototype.putRecord = function(key, record, success, error){
	var payload = JSON.stringify(record, null, '\t');
    $.ajax({
        url: this._url() + encodeURIComponent(key) + '/record.json',
        type: 'PUT',
        data: payload,
        success: function(data) {
            if(data.error == 0){
                success(data);
            }else{
                error(data);
            }
        }
    });
}

PCAPI.prototype.renameRecord = function(key, record, success, error){
    $.ajax({
	    url: this._url() + '/' + encodeURIComponent(key),
	    type: 'PUT',
	    data: record.name,
	    success: function(data) {
					if(data.error != 0){
					    error(data);
					    return;
					}

					/* 
						PCAPI 1.3 is not updating the name of the record in the json,
						the record has to be uploaded after renaming
					*/
					PCAPI.putRecord(record.name, record, success, error)
				}
	});
}

PCAPI.prototype.deleteRecord = function(key, success, error){
	// $.ajax({
	// 	url: '/pcapi/records/dropbox/'+oauth+'/'+encodeURIComponent($("#"+dialog_id+" #form-text-hidden-1").val()),
	// 	type: 'DELETE',
	// 	success: function() {
	// 	$.ajax({
	// 		url: '/pcapi/records/dropbox/'+oauth+'/'+encodeURIComponent(obj.name)+'/record.json',
	// 		type: 'POST',
	// 		data: data,
	// 		success: function(data) {
	// 			oTable.fnUpdate(obj.name, parseInt(row), 1);
	// 			$("#row-"+row +" .record-edit").attr("title", obj.name+"-"+row);
	// 			$("#row-"+row +" .record-delete").attr("title", obj.name+"-"+row);
	// 		}
	// 	});
	// 	}
	// });
}