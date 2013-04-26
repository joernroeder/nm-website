// Generated by CoffeeScript 1.6.2
(function($) {
  var resizeEvents, resizeIframes;

  resizeEvents = {};
  $(window).on('resize', function() {
    var callback, key, _results;

    _results = [];
    for (key in resizeEvents) {
      callback = resizeEvents[key];
      if (callback && $.isFunction(callback)) {
        _results.push(callback());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  });
  $.addOnWindowResize = function(key, callback) {
    if ($.isFunction(callback)) {
      return resizeEvents[key] = callback;
    }
  };
  $.removeOnWindowResize = function(key) {
    if (resizeEvents[key]) {
      return delete resizeEvents[key];
    }
  };
  resizeIframes = function() {
    var $iframes;

    $iframes = $('iframe', 'article.portfolio-detail');
    if (!$iframes.length) {
      return;
    }
    return $iframes.each(function(i, iframe) {
      var $iframe, attrHeight, attrWidth, scaleFactor, width;

      $iframe = $(iframe);
      attrWidth = $iframe.attr('width');
      attrHeight = $iframe.attr('height');
      if (!attrWidth || !attrHeight) {
        return;
      }
      width = $iframe.width();
      scaleFactor = width / attrWidth;
      return $iframe.height(attrHeight * scaleFactor);
    });
  };
  $(document).on('portfoliodetail:rendered', resizeIframes);
  return $.addOnWindowResize('iframe', resizeIframes);
})(jQuery);
