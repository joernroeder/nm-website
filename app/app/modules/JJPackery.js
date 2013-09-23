// Generated by CoffeeScript 1.6.3
define(['app', 'plugins/packery/packerytest'], function(app) {
  var JJPackery;
  JJPackery = app.module();
  JJPackery.Views.Container = Backbone.View.extend({
    tagName: 'section',
    className: 'packery-wrapper',
    template: 'packery-container',
    afterRender: function() {
      this.packery = new JJPackeryClass();
      if (this._afterRender) {
        return this._afterRender();
      }
    }
  });
  return JJPackery;
});
