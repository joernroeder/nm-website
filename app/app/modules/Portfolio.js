// Generated by CoffeeScript 1.6.2
define(['app', 'modules/Gravity'], function(app, Gravity) {
  var Portfolio;

  Portfolio = app.module();
  Portfolio.Config = {
    person_group_length: 4,
    group_project_title: 'Group project'
  };
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
    className: 'gravity-item resizable',
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
    beforeRender: function() {
      this._codeEv = $.Event('code:kickoff', {
        bubbles: false
      });
      return this._afterRenderEv = $.Event('portfoliodetail:rendered');
    },
    afterRender: function() {
      var $doc;

      window.picturefill();
      $doc = $(document);
      $doc.trigger(this._codeEv);
      return $doc.trigger(this._afterRenderEv);
    },
    serialize: function() {
      var json, types,
        _this = this;

      json = this.model ? this.model.toJSON() : {};
      types = ['Projects', 'ChildProjects', 'ParentProjects'];
      if (json.Persons.length > Portfolio.Config.person_group_length) {
        json.IsGroup = true;
      }
      json.combinedProjects = [];
      _.each(types, function(type) {
        if (_.isArray(json[type])) {
          return json.combinedProjects = json.combinedProjects.concat(json[type]);
        }
      });
      return json;
    }
  });
  Handlebars.registerHelper('nameSummary', function(persons) {
    var conf, length, out;

    conf = Portfolio.Config;
    if (!(persons.length < conf.person_group_length)) {
      return conf.group_project_title;
    }
    out = '';
    length = persons.length;
    _.each(persons, function(person, i) {
      out += '<a href="/about/' + person.UrlSlug + '/">' + person.FirstName + ' ' + person.Surname + '</a>';
      if (i < (length - 2)) {
        return out += ', ';
      } else if (i < (length - 1)) {
        return out += ' &amp; ';
      }
    });
    return out;
  });
  Handlebars.registerHelper('niceDate', function(model) {
    var out;

    if (!(model.DateRangeNice || model.FrontendDate)) {
      return false;
    }
    out = '';
    if (model.DateRangeNice) {
      out += model.DateRangeNice;
    } else if (model.FrontendDate) {
      out += model.FrontendDate;
    }
    return out;
  });
  Handlebars.registerHelper('teaserMeta', function() {
    var nameSummary, niceDate;

    niceDate = Handlebars.helpers.niceDate(this);
    if (this.ClassName === 'Project') {
      nameSummary = Handlebars.helpers.nameSummary(this.Persons);
      return "" + nameSummary + " // " + niceDate;
    } else {
      return niceDate;
    }
  });
  Handlebars.registerHelper('portfoliolist', function(items, title, options) {
    var length, out;

    if (!options) {
      options = title;
      title = '';
    }
    length = 0;
    out = '<ul>';
    _.each(items, function(item) {
      if (item.IsPortfolio) {
        out += '<li><a href="/portfolio/' + item.UglyHash + '/">' + item.Title + '</a></li>';
        return length++;
      }
    });
    out += '</ul>';
    title += length > 1 ? 's' : '';
    if (length) {
      return ("<h4>" + title + "</h4>") + out;
    } else {
      return '';
    }
  });
  Handlebars.registerHelper('commaSeparatedWebsites', function(websites) {
    var a;

    a = [];
    _.each(websites, function(website) {
      return a.push("<a href=\"" + website.Link + "\">" + website.Title + "</a>");
    });
    return a.join(', ');
  });
  return Portfolio;
});
