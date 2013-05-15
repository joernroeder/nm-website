// Generated by CoffeeScript 1.6.2
"use strict";
/**
 *
 *	static file drag and drop helper class
 *
*/
(function($) {
  var JJFileUpload;

  JJFileUpload = (function() {
    function JJFileUpload() {}

    /**
    		 * Uploads the dropped files (from the filesystem)
    		 * @param  {Event} e               	The drop event
    		 * @param  {jQuery} $dropzone       Where the files have been dropped
    		 * @param  {string} postUrl         URL to post the files to
    		 * @param  {string} defaultErrorMsg Default error message
    		 * @param  {int} maxAllowed			Maximum allowed number of files
    		 * @return {$.Deferred}             jQuery Deferred object
    */


    JJFileUpload["do"] = function(e, $dropzone, postUrl, defaultErrorMsg, maxAllowed) {
      var $progressBar, errorMsg, files, formData, req, _xhrProgress,
        _this = this;

      errorMsg = null;
      $progressBar = $('<div />', {
        "class": 'progress-bar'
      }).appendTo($dropzone);
      $progressBar.append($('<div />'));
      _xhrProgress = function(e) {
        var completed;

        if (e.lengthComputable) {
          completed = (e.loaded / e.total) * 100;
          return $progressBar.find('div').css('width', completed + '%');
        }
      };
      files = e.dataTransfer.files;
      formData = new FormData();
      if (maxAllowed && files.length > maxAllowed) {
        files = array_slice(files, 0, 3);
      }
      $.each(files, function(index, file) {
        if (!file.type.match('image.*')) {
          return errorMsg = 'Sorry, but ' + file.name + ' is no image, bitch!';
        } else {
          return formData.append(file.name, file);
        }
      });
      if (errorMsg) {
        console.log(errorMsg);
        req = new $.Deferred();
        req.reject({
          error: errorMsg
        });
      } else {
        req = $.ajax({
          url: postUrl,
          data: formData,
          processData: false,
          contentType: false,
          type: 'POST',
          xhr: function() {
            var xhr;

            xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', _xhrProgress, false);
            return xhr;
          }
        });
      }
      return req.pipe(function(res) {
        if (!res.error) {
          return res;
        } else {
          return $.Deferred().reject(res);
        }
      }).fail(function(res) {
        return $dropzone.append('<p>' + defaultErrorMsg + '</p>');
      }).always(function() {
        return $progressBar.remove();
      });
    };

    return JJFileUpload;

  })();
  return window.JJFileUpload = JJFileUpload;
})(jQuery);