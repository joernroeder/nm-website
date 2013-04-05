// Generated by CoffeeScript 1.6.2
define(['app', 'modules/Project', 'modules/Person', 'modules/Excursion', 'modules/Workshop', 'modules/Exhibition', 'modules/CalendarEntry', 'modules/PageError', 'modules/Portfolio', 'modules/Calendar'], function(app, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar) {
  /**
  	 *
  	 *	All the URL routing is done here.
  	 *	Our router also serves as the data retrieving interface. All data getting logic is
  	 *	handled here. 
  	 *
  */

  var DataRetrieval, Router, called_twice;

  called_twice = false;
  Router = Backbone.Router.extend({
    routes: {
      '': 'index',
      'about/': 'showAboutPage',
      'about/student/:nameSlug/': 'showStudentPage',
      'about/student/:nameSlug/:uglyHash/': 'showStudentDetailed',
      'portfolio/': 'showPortfolio',
      'portfolio/:slug/': 'showPortfolioDetailed',
      'calendar/': 'showCalendar',
      'calendar/:urlHash/': 'showCalendarDetailed',
      '*url/': 'catchAllRoute'
    },
    index: function(hash) {
      var config, layout;

      config = app.Config;
      layout = app.useLayout('index');
      DataRetrieval.forProjectsOverview(config.Featured, function() {
        var featured, gravityContainer, projectType, _i, _len, _ref;

        featured = [];
        _ref = config.ProjectTypes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          projectType = _ref[_i];
          featured = featured.concat(app.Collections[projectType].where({
            IsFeatured: true
          }));
        }
        gravityContainer = new Portfolio.Views.GravityContainer({
          collection: featured
        });
        return layout.setViewAndRenderMaybe('#gravity', gravityContainer);
      });
      return DataRetrieval.forCalendar('upcoming', function() {
        var calendarContainer;

        calendarContainer = new Calendar.Views.UpcomingContainer({
          collection: app.Collections.CalendarEntry
        });
        return layout.setViewAndRenderMaybe('#upcoming-calendar', calendarContainer);
      });
    },
    showAboutPage: function() {
      return console.info('about page');
    },
    showStudentPage: function(nameSlug) {
      console.info('show student page of %s', nameSlug);
      return console.info('check if student has custom template');
    },
    showStudentDetailed: function(nameSlug, uglyHash) {
      console.info('show project %s of %s', uglyHash, nameSlug);
      return console.info('check if student has custom template for details');
    },
    showPortfolio: function() {
      console.info('show portfolio');
      return DataRetrieval.forProjectsOverview(app.Config.Portfolio, function() {
        console.log(app);
        return console.log('All portfolio data is there. Serialize shit in portfolio view and render it');
      });
    },
    showPortfolioDetailed: function(slug) {
      console.info('portfolio with uglyHash/Filter %s', slug);
      return console.info('check if slug is filter or uglyHash and handle page accordingly');
    },
    showCalendar: function() {
      return console.info('show whole calendar');
    },
    showCalendarDetailed: function(urlHash) {
      var _this = this;

      app.useLayout('main');
      console.info('get calendar detailed data with slug and show');
      return DataRetrieval.forDetailedObject('CalendarEntry', urlHash, function(model) {
        var detailView, layout;

        if (!model) {
          return _this.fourOhFour();
        }
        layout = app.useLayout('main');
        detailView = new Calendar.Views.Detail({
          model: model
        });
        return layout.setViewAndRenderMaybe('', detailView);
      });
    },
    catchAllRoute: function(url) {
      return console.log('catch all route');
    },
    fourOhFour: function() {
      var errorView, layout;

      layout = app.useLayout('main');
      errorView = new PageError.Views.FourOhFour({
        attributes: {
          'data-url': window.location.href
        }
      });
      return layout.setViewAndRenderMaybe('', errorView);
    }
  });
  DataRetrieval = {
    forProjectsOverview: function(configObj, callback) {
      var checkAndCallback, present, projectType, projectTypes, _i, _len, _results;

      present = configObj.present;
      projectTypes = app.Config.ProjectTypes;
      checkAndCallback = function() {
        var done, projectType, _i, _len;

        done = true;
        for (_i = 0, _len = projectTypes.length; _i < _len; _i++) {
          projectType = projectTypes[_i];
          if (_.indexOf(present.types, projectType) < 0) {
            done = false;
          }
        }
        if (done) {
          present.flag = true;
          return callback();
        }
      };
      if (!present.flag) {
        _results = [];
        for (_i = 0, _len = projectTypes.length; _i < _len; _i++) {
          projectType = projectTypes[_i];
          _results.push((function(projectType) {
            var options;

            if (_.indexOf(present.types, projectType) < 0) {
              options = {
                name: configObj.domName(projectType),
                urlSuffix: configObj.urlSuffix
              };
              return JJRestApi.getFromDomOrApi(projectType, options, function(data) {
                present.types.push(projectType);
                app.handleFetchedModels(projectType, data);
                return checkAndCallback();
              });
            }
          })(projectType));
        }
        return _results;
      } else {
        return callback();
      }
    },
    forCalendar: function(type, callback) {
      var config, options;

      config = app.Config.Calendar[type];
      if (!config.flag) {
        options = _.clone(config);
        options.name = type + '-calendar';
        return JJRestApi.getFromDomOrApi('CalendarEntry', options, function(data) {
          var item, _i, _len;

          if (type === 'upcoming') {
            for (_i = 0, _len = data.length; _i < _len; _i++) {
              item = data[_i];
              item.IsUpcoming = true;
            }
          }
          app.handleFetchedModels('CalendarEntry', data);
          config.flag = true;
          if (type === 'whole') {
            app.Config.Calendar.upcoming.flag = true;
          }
          return callback();
        });
      } else {
        return callback();
      }
    },
    forDetailedObject: function(classType, slug, callback) {
      var callbackWithModel, coll, configObj, existModel, options, whereStatement;

      configObj = app.Config.Detail[classType];
      coll = app.Collections[classType];
      whereStatement = configObj.where(slug);
      callbackWithModel = function(model) {
        callback(model);
        return model._isCompletelyFetched = true;
      };
      existModel = coll.findWhere(whereStatement);
      if (existModel) {
        if (existModel._isCompletelyFetched) {
          return callback(existModel);
        }
        return existModel.fetch({
          success: function(model) {
            callback(model);
            return model._isCompletelyFetched = true;
          }
        });
      } else {
        options = {
          name: configObj.domName,
          urlSuffix: configObj.urlSuffix(slug)
        };
        return JJRestApi.getFromDomOrApi('CalendarEntry', options, function(data) {
          var model;

          if (data.length === 1) {
            model = app.handleFetchedModel(classType, data[0]);
            return callbackWithModel(model);
          }
        });
      }
    }
  };
  return Router;
});
