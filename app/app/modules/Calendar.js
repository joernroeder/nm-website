// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var Calendar;

  Calendar = app.module();
  Calendar.Views.Container = Backbone.View.extend({
    id: 'calendar-container',
    template: 'calendar-container',
    initialize: function(options) {
      return this.upcomingEvents = this.collection.where({
        IsUpcoming: true
      });
    },
    serialize: function() {
      var json;

      json = {};
      if (this.upcomingEvents && this.upcomingEvents.length) {
        json.HasItems = true;
      }
      return json;
    },
    beforeRender: function() {
      var model, _i, _len, _ref, _results;

      _ref = this.upcomingEvents;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        _results.push(this.insertView('#calendar-list', new Calendar.Views.ListItem({
          model: model
        })));
      }
      return _results;
    }
  });
  Calendar.Views.ListItem = Backbone.View.extend({
    tagName: 'li',
    className: 'calendar-list-item',
    template: 'calendar-list-item',
    serialize: function() {
      if (this.model) {
        return this.model.toJSON();
      } else {
        return {};
      }
    }
  });
  Calendar.Views.Detail = Backbone.View.extend({
    tagName: 'article',
    className: 'portfolio-detail',
    template: 'calendar-detail',
    afterRender: function() {
      return window.picturefill();
    },
    serialize: function() {
      if (this.model) {
        return this.model.toJSON();
      } else {
        return {};
      }
    }
  });
  return Calendar;
});
