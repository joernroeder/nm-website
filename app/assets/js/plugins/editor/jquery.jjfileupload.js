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
    		 * @param  {Object} additionalData  additional POST data
    		 * @param  {string} defaultErrorMsg Default error message
    		 * @param  {string} filematch		String to match filenames to
    		 * @param  {int} maxAllowed			Maximum allowed number of files
    		 * @return {$.Deferred}             jQuery Deferred object
    */


    JJFileUpload["do"] = function(e, $dropzone, postUrl, additionalData, defaultErrorMsg, filematch, maxAllowed) {
      var $progress, $progressText, a, b, errorMsg, files, formData, req,
        _this = this;

      errorMsg = null;
      $dropzone.removeClass('failed done');
      $('.progress-text, .progress', $dropzone).remove();
      $progress = $('<div />', {
        "class": 'progress'
      }).height(0).appendTo($dropzone);
      $progressText = $('<div />', {
        "class": 'progress-text'
      }).appendTo($dropzone);
      files = e.dataTransfer.files;
      formData = new FormData();
      if (maxAllowed && files.length > maxAllowed) {
        files = array_slice(files, 0, 3);
      }
      $.each(files, function(index, file) {
        if (!file.type.match(filematch)) {
          return errorMsg = 'Sorry, but ' + file.name + ' is no image, bitch!';
        } else {
          return formData.append(file.name, file);
        }
      });
      if (additionalData) {
        for (a in additionalData) {
          b = additionalData[a];
          formData.append(a, b);
        }
      }
      if (errorMsg) {
        console.log(errorMsg);
        req = new $.Deferred();
        req.reject({
          error: errorMsg
        });
      } else {
        $dropzone.addClass('uploading');
        req = $.ajax({
          url: postUrl,
          data: formData,
          processData: false,
          contentType: false,
          type: 'POST',
          xhr: function() {
            var xhr;

            xhr = new XMLHttpRequest();
            xhr.upload.onprogress = function(evt) {
              var completed;

              if (evt.lengthComputable) {
                completed = Math.round((evt.loaded / evt.total) * 100);
                $progressText.html(completed + '%');
                return $progress.height(completed + '%');
              }
            };
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
        $dropzone.addClass('failed');
        $progressText.text(defaultErrorMsg);
        return setTimeout(function() {
          return $dropzone.removeClass('dragover');
        }, 3000);
      }).always(function() {
        $dropzone.removeClass('uploading');
        $progress.remove();
        return $progressText.remove();
      }).done(function() {
        $dropzone.addClass('done');
        return setTimeout(function() {
          return $dropzone.removeClass('dragover');
        }, 1000);
      });
    };

    return JJFileUpload;

  })();
  return window.JJFileUpload = JJFileUpload;
})(jQuery);
