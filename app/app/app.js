// Generated by CoffeeScript 1.6.2
define(['plugins/zepto.installer', 'underscore', 'backbone', 'handlebars', 'plugins/backbone.layoutmanager', 'plugins/backbone.JJRelational', 'plugins/backbone.JJRestApi'], function(_Zepto, _, Backbone, Handlebars) {
  var JST, app;

  app = {
    root: '/'
  };
  JST = window.JST = window.JST || {};
  Backbone.NMLayout = Backbone.Layout.extend({
    setViewAndRenderMaybe: function(selector, view) {
      this.setView(selector, view);
      if (this.__manager__.hasRendered) {
        return view.render();
      }
    }
  });
  Backbone.Layout.configure({
    manage: true,
    prefix: 'app/app/templates/',
    fetch: function(path) {
      var done;

      done = void 0;
      path = path + '.html';
      if (!JST[path]) {
        done = this.async();
        return $.ajax({
          url: app.root + path
        }).then(function(contents) {
          JST[path] = Handlebars.compile(contents);
          JST[path].__compiled__ = true;
          return done(JST[path]);
        });
      }
      if (!JST[path].__compiled__) {
        JST[path] = Handlebars.template(JST[path]);
        JST[path].__compiled__ = true;
      }
      return JST[path];
    }
  });
  return _.extend(app, {
    module: function(additionalProps) {
      return _.extend({
        Views: {}
      }, additionalProps);
    },
    useLayout: function(name, options) {
      var $body, currentLayout, layout;

      if (this.layout && this.layout.getAllOptions().template === 'layouts/' + name) {
        return this.layout;
      }
      if (this.layout) {
        this.layout.remove();
      }
      layout = new Backbone.NMLayout(_.extend({
        template: 'layouts/' + name,
        className: 'layout ' + name,
        id: 'layout'
      }, options));
      $('#main').empty().append(layout.el);
      $(layout.el).css('height', '100%');
      currentLayout = this.currentLayoutName;
      $body = $('body');
      if (currentLayout) {
        $body.removeClass(currentLayout);
      }
      $body.addClass(name);
      this.currentLayoutName = name;
      layout.render();
      this.layout = layout;
      return layout;
    }
  }, Backbone.Events);
});
