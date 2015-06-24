var POIImplementation = function(target, title, type, elements) {
    this.target = target;
    this.title = title;
    this.type = type;
    this.elements = elements;

    this.templates = {};
};

/**
 * This method is called each time that the element is added to the form
 * it creates an instance of the POI and display the file upload dialog
 */
POIImplementation.prototype.implement = function() {
    var formSelector = '#' + this.target;
    var i = findIForFieldcontain(formSelector, '.fieldcontain', this.type);
    var elementId = 'fieldcontain-poi-' + i;
    var poi = new POI(formSelector, elementId);
    poi.openFileUploadDialog();
};

/**
 * Encapsulates the POI
 */
var POI = function(formSelector, elementId) {
    this.formSelector = formSelector;
    this.elementId = elementId;
    this.poiFilename = null;
    this.initFileUploadDialog();
};

/**
 * Initialize the events for the file upload dialog
 */
POI.prototype.initFileUploadDialog = function() {
    var file;
    var self = this;

    $(document).off('change', 'input#poi-file');
    $(document).on('change', 'input#poi-file', function(e) {
        var files = e.target.files || e.dataTransfer.files;
        file = files[0];
    });

    // Event listener to open the popup
    $(document).off('click', '#upload-poi-button');
    $(document).on('click', '#upload-poi-button', function(event) {
        event.preventDefault();
        loading(true);
        pcapi
            .uploadFile({
                remoteDir: 'features',
                path: file.name,
                file: file,
                contentType: true
            })
            .then(function(data) {
                self.poiFilename = data.path;
                self.render();
            })
            .fail(function(err) {
                console.error(err);
            })
            .done(function() {
                $('#upload-poi-dialog').dialog('close');
                loading(false);
            });
    });
};

/**
 * Open the file upload dialog
 */
POI.prototype.openFileUploadDialog = function() {
    $('#upload-poi-dialog').dialog('open');
};

/**
 * Render the markup for the POI element into the form
 */
POI.prototype.render = function(elementId) {
    var filename = this.poiFilename || '';
    var html = (
        '<div class="fieldcontain" id="' + this.elementId + '" data-fieldtrip-type="poi" style="height: auto;">' +
          '<label>' + filename + '</label>' +
          '<input type="hidden" data-poi-file="' + filename + '" />' +
        '</div>'
    );

    // Append markup and enable buttons
    $(this.formSelector).append(html);
    appendEditButtons(this.elementId);
};

/**
 * Insert and initialize the upload dialog into the DOM
 */
POI.injectDialog = function() {
    var dialogHtml = (
        '<div id="upload-poi-dialog">' +
            '<form enctype="multipart/form-data" method="post">' +
                '<fieldset>' +
                '<input type="file" name="poi-file" id="poi-file" accept=".json,.geojson"></input>' +
                '<input id="upload-poi-button" type="button" value="Upload" class="btn" />' +
                '</fieldset>' +
            '</form>' +
        '</div>'
    );

    $(dialogHtml)
        .appendTo('body')
        .dialog({
            autoOpen: false,
            close: function() {
                // Reset the form
                $('#upload-poi-dialog > form').trigger('reset');
            }
        });
};

// Prepare the POI upload dialog
$(document).ready(POI.injectDialog);
