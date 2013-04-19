// Generated by CoffeeScript 1.6.2
define(['app', 'modules/Gravity'], function(app, Gravity) {
  var Portfolio;

  Portfolio = app.module();
  Portfolio.Views.GravityContainer = Gravity.Views.Container.extend({
    tagName: 'section',
    beforeRender: function() {
      var model, modelArray, _i, _len, _results;

      console.log('portfolio before render');
      modelArray = this.collection;
      if (modelArray) {
        _results = [];
        for (_i = 0, _len = modelArray.length; _i < _len; _i++) {
          model = modelArray[_i];
          _results.push(this.insertView('', new Portfolio.Views.ListItem({
            model: model,
            linkTo: this.options.linkTo
          })));
        }
        return _results;
      }
    }
  });
  Portfolio.Views.ListItem = Backbone.View.extend({
    tagName: 'article',
    className: 'gravity-item',
    template: 'gravity-list-item',
    serialize: function() {
      var data;

      data = this.model ? this.model.toJSON() : {};
      data.LinkTo = this.options.linkTo;
      return data;
    }
  });
  Portfolio.Views.Detail = Backbone.View.extend({
    tagName: 'article',
    className: 'portfolio-detail',
    template: 'portfolio-detail',
    afterRender: function() {
      return window.picturefill({
        wrapperTag: 'div',
        imageTag: 'div'
      });
    },
    serialize: function() {
      if (this.model) {
        return this.model.toJSON();
      } else {
        return {};
      }
    }
  });
  Handlebars.registerHelper('nameSummary', function(persons) {
    var i, length, out, person, _i, _len;

    out = '';
    length = persons.length;
    if (length > 3) {
      return 'Group project';
    }
    for (i = _i = 0, _len = persons.length; _i < _len; i = ++_i) {
      person = persons[i];
      out += person.FirstName + ' ' + person.Surname;
      if (i < (length - 1)) {
        out += ' &amp; ';
      }
    }
    return out;
  });
  Handlebars.registerHelper('niceDate', function(model) {
    var out;

    if (!(model.DateRangeNice || model.FrontendDate)) {
      return '';
    }
    out = '// ';
    if (model.DateRangeNice) {
      out += model.DateRangeNice;
    } else if (model.FrontendDate) {
      out += model.FrontendDate;
    }
    return out;
  });
  Handlebars.registerHelper('ifProjects', function(block) {
    var types,
      _this = this;

    types = ['Projects', 'ChildProjects', 'ParentProjects'];
    this.combinedProjects = [];
    _.each(types, function(type) {
      if (_.isArray(_this[type])) {
        return _this.combinedProjects = _this.combinedProjects.concat(_this[type]);
      }
    });
    if (this.combinedProjects.length) {
      return block(this);
    } else {
      return block.inverse(this);
    }
  });
  return Portfolio;
});
