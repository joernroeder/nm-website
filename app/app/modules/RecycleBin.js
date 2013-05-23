// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var RecycleBin;

  RecycleBin = {};
  RecycleBin.setup = function() {
    var $bin,
      _this = this;

    this.$bin = $bin = $('#recycle-bin');
    return $bin.on('drop', function() {
      var model, toRecycle, url;

      toRecycle = _this.activeRecycleDrag;
      if (toRecycle && toRecycle.className) {
        if (model = Backbone.JJStore._byId(toRecycle.className, toRecycle.model.id)) {
          return model.destroy();
        } else {
          url = JJRestApi.setObjectUrl(toRecycle.className, {
            id: toRecycle.model.id
          });
          console.log('destroy manually');
          return console.log(url);
        }
      }
    });
  };
  RecycleBin.setViewAsRecyclable = function(view) {
    var data,
      _this = this;

    data = {
      view: view,
      model: view.model
    };
    data.className = view.className ? view.className : view.model.ClassName;
    return view.$el.on('dragstart dragend', function(e) {
      var method;

      if (e.type === 'dragstart') {
        method = 'addClass';
        _this.activeRecycleDrag = data;
      } else {
        _this.activeRecycleDrag = null;
        method = 'removeClass';
      }
      return _this.$bin[method]('active');
    });
  };
  return RecycleBin;
});
