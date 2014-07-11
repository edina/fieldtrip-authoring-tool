var PCAPI = function(options){
    var defaults = {
        version: '1.3',
        provider: 'dropbox',
        oauth: '',
        records: 'records',
        pcapi: 'pcapi',
        host: location.origin
    };

    this.options = $.extend(defaults, options || {});
};

PCAPI.prototype.init = function(){
};

PCAPI.prototype._url = function(filesystem){
    return '{0}/{1}/{2}/{3}/{4}/{5}/'.format(this.options.host,
                                             this.options.version,
                                             this.options.pcapi,
                                             filesystem,
                                             this.options.provider,
                                             this.options.oauth);
};

PCAPI.prototype._callback = function(fn, data){
    if(fn !== undefined && typeof(fn) === "function"){
        fn(data);
    }
};

PCAPI.prototype.putRecord = function(key, record, success, error){
    this.putJSON(this.options.records, key, 'record.json', record, success, error);
};

PCAPI.prototype.putJSON = function(filesystem, path, filename, payload, success, error){
    var json = JSON.stringify(payload, null, '\t');
    this.putFile(filesystem, path, filename, json, success, error);
};

PCAPI.prototype.putFile = function(filesystem, path, filename, payload, success, error){
    var pcapi = this;
    $.ajax({
        url: this._url(filesystem) + encodeURIComponent(path) + '/' + filename,
        type: 'PUT',
        data: payload,
        success: function(data) {
            if(data.error === 0){
                pcapi._callback(success, data);
            }else{
                pcapi._callback(error, data);
            }
        }
    });
};

PCAPI.prototype.renameRecord = function(key, record, success, error){
    var pcapi = this;
    $.ajax({
        url: this._url(this.options.records) + encodeURIComponent(key),
        type: 'PUT',
        data: record.name,
        success: function(data) {
                    if(data.error !== 0){
                        pcapi._callback(error, data);
                        return;
                    }

                    /*
                        PCAPI 1.3 is not updating the name of the record in the json,
                        the record has to be uploaded after renaming
                    */
                    pcapi.putRecord(record.name, record, success, error);
                }
    });
};

PCAPI.prototype.deleteRecord = function(key, success, error){
    // $.ajax({
    //  url: '/pcapi/records/dropbox/'+oauth+'/'+encodeURIComponent($("#"+dialog_id+" #form-text-hidden-1").val()),
    //  type: 'DELETE',
    //  success: function() {
    //  $.ajax({
    //      url: '/pcapi/records/dropbox/'+oauth+'/'+encodeURIComponent(obj.name)+'/record.json',
    //      type: 'POST',
    //      data: data,
    //      success: function(data) {
    //          oTable.fnUpdate(obj.name, parseInt(row), 1);
    //          $("#row-"+row +" .record-edit").attr("title", obj.name+"-"+row);
    //          $("#row-"+row +" .record-delete").attr("title", obj.name+"-"+row);
    //      }
    //  });
    //  }
    // });
};