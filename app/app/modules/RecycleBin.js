// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var RecycleBin;

  RecycleBin = {};
  RecycleBin.setup = function() {
    var $bin,
      _this = this;

    this.$bin = $bin = $('#recycle-bin');
    $bin.on('dragenter dragleave drop', function(e) {
      var method;

      method = e.type === 'dragenter' ? 'addClass' : 'removeClass';
      return $(e.target)[method]('dragover');
    });
    return $bin.on('drop', function(e) {
      var id, model, req, toRecycle, url;

      toRecycle = _this.activeRecycleDrag;
      _this.activeRecycleDrag = null;
      if (toRecycle && toRecycle.className) {
        id = toRecycle.model.ID ? toRecycle.model.ID : toRecycle.model.id;
        _this.removeViewAndData(toRecycle);
        if (model = Backbone.JJStore._byId(toRecycle.className, id)) {
          return model.destroy();
        } else {
          url = JJRestApi.setObjectUrl(toRecycle.className, {
            id: id
          });
          return req = $.ajax({
            url: url,
            contentType: 'json',
            type: 'DELETE'
          });
        }
      }
    });
  };
  RecycleBin.removeViewAndData = function(toRecycle) {
    toRecycle.view.$el.trigger('dragend');
    if (toRecycle.className === 'PersonImage' || toRecycle.className === 'DocImage') {
      app.removeFromGalleryCache(toRecycle.className, toRecycle.model.id);
      return toRecycle.view.liveRemoval();
    } else {
      return toRecycle.view.remove();
    }
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
