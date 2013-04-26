// Generated by CoffeeScript 1.6.2
define(['app', 'modules/Auth', 'modules/Project', 'modules/Person', 'modules/Excursion', 'modules/Workshop', 'modules/Exhibition', 'modules/CalendarEntry', 'modules/PageError', 'modules/Portfolio', 'modules/Calendar', 'modules/About'], function(app, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar, About) {
  /**
  	 *
  	 *	All the URL routing is done here.
  	 *	Our router also serves as the data retrieving interface. All data getting logic is
  	 *	handled here. 
  	 *
  */

  var DataRetrieval, Router;

  Router = Backbone.Router.extend({
    /**
    		 * All routes should result in a `done` function of this deferred variable
    		 * @type {$.Deferred}
    */

    mainDeferred: null,
    /**
    		 * All pending ajax requests
    		 *
    */

    pendingAjax: [],
    initialize: function(options) {
      var _this = this;

      return JJRestApi.Events.bind('dfdAjax', function(dfd) {
        return _this.pendingAjax.push(dfd);
      });
    },
    /**
    		 * This method breaks off the current route if another one is called in order to prevent deferreds to trigger
    		 * when another route has already been called
    		 * 
    		 * @return {$.Deferred}
    */

    rejectAndHandle: function(options) {
      var deferred,
        _this = this;

      options = options || {};
      app.handleLinks();
      if (!options.noFadeOut) {
        app.addLoadingClasses();
        app.startSpinner();
      }
      deferred = this.mainDeferred;
      if (deferred) {
        deferred.reject();
      }
      _.each(this.pendingAjax, function(pending) {
        if (pending.readyState !== 4) {
          return pending.abort();
        }
      });
      this.pending = [];
      this.mainDeferred = $.Deferred();
      return this.mainDeferred.done(function() {
        _this.mainDeferred = null;
        app.removeLoadingClasses();
        return app.stopSpinner();
      });
    },
    routes: {
      '': 'index',
      'about/': 'showAboutPage',
      'about/:nameSlug/': 'showPersonPage',
      'about/:nameSlug/:uglyHash/': 'showPersonDetailed',
      'portfolio/': 'showPortfolio',
      'portfolio/search/:searchTerm/': 'showPortfolio',
      'portfolio/:uglyHash/': 'showPortfolioDetailed',
      'calendar/': 'showCalendar',
      'calendar/:urlHash/': 'showCalendarDetailed',
      'login/': 'showLoginForm',
      'logout/': 'doLogout',
      '*url/': 'catchAllRoute'
    },
    index: function(hash) {
      var calDfd, config, mainDfd, projDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      config = app.Config;
      projDfd = DataRetrieval.forProjectsOverview(config.Featured);
      calDfd = DataRetrieval.forCalendar('upcoming');
      $.when(projDfd, calDfd).done(function() {
        return mainDfd.resolve();
      });
      return mainDfd.done(function() {
        var calendarContainer, layout, modelsArray;

        layout = app.useLayout('index');
        if (!app.Cache.Featured) {
          app.Cache.Featured = _this.getProjectTypeModels({
            IsFeatured: true
          });
        }
        modelsArray = app.Cache.Featured;
        _this.showGravityViewForModels(modelsArray, 'portfolio', layout);
        calendarContainer = new Calendar.Views.Container({
          collection: app.Collections.CalendarEntry
        });
        return layout.setViewAndRenderMaybe('#calendar', calendarContainer);
      });
    },
    showAboutPage: function() {
      var groupImageDfd, mainDfd, personsDfd;

      mainDfd = this.rejectAndHandle();
      groupImageDfd = DataRetrieval.forRandomGroupImage();
      personsDfd = DataRetrieval.forPersonsOverview();
      $.when(groupImageDfd, personsDfd).done(function(image) {
        return mainDfd.resolve(image);
      });
      return mainDfd.done(function(image) {
        var coll, layout, persons, view;

        layout = app.useLayout('main', {
          customClass: 'about'
        });
        coll = app.Collections['Person'];
        persons = {
          students: coll.where({
            IsStudent: true
          }),
          alumnis: coll.where({
            IsAlumni: true
          }),
          employees: coll.where({
            IsEmployee: true
          })
        };
        view = new About.Views.GravityContainer({
          groupImage: image,
          persons: persons
        });
        return layout.setViewAndRenderMaybe('', view);
      });
    },
    showPersonPage: function(nameSlug) {
      var mainDfd;

      mainDfd = this.rejectAndHandle();
      DataRetrieval.forDetailedObject('Person', nameSlug).done(function(model) {
        return mainDfd.resolve(model);
      });
      return mainDfd.done(function(model) {
        var layout, template, view;

        if (!model) {
          return this.fourOhFour();
        }
        layout = app.useLayout('main');
        template = '';
        model.get('Templates').each(function(templ) {
          if (!templ.get('IsDetail')) {
            return template = templ.get('Url');
          }
        });
        view = !template ? new Person.Views.GravityContainer({
          model: model
        }) : new Person.Views.Custom({
          model: model,
          template: template
        });
        return layout.setViewAndRenderMaybe('', view);
      });
    },
    showPersonDetailed: function(nameSlug, uglyHash) {
      return this.showPortfolioDetailed(uglyHash, nameSlug);
    },
    showPortfolio: function(searchTerm) {
      var mainDfd,
        _this = this;

      if (searchTerm) {
        console.info('searching for: %s', searchTerm);
      }
      mainDfd = this.rejectAndHandle();
      DataRetrieval.forProjectsOverview(app.Config.Portfolio).done(function() {
        return mainDfd.resolve();
      });
      return mainDfd.done(function() {
        var layout, modelsArray;

        layout = app.useLayout('portfolio');
        if (!app.Cache.WholePortfolio) {
          app.Cache.WholePortfolio = _this.getProjectTypeModels({
            IsPortfolio: true
          });
        }
        modelsArray = app.Cache.WholePortfolio;
        return _this.showGravityViewForModels(modelsArray, 'portfolio', layout);
      });
    },
    showPortfolioDetailed: function(uglyHash, nameSlug) {
      var classType, mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      classType = app.Config.ClassEnc[uglyHash.substr(0, 1)];
      if (classType) {
        DataRetrieval.forDetailedObject(classType, uglyHash).done(function(model) {
          return mainDfd.resolve(model);
        });
        return mainDfd.done(function(model) {
          var detailView, layout, person, template;

          if (!model || (!nameSlug && !model.get('IsPortfolio'))) {
            return _this.fourOhFour();
          }
          layout = app.useLayout('main', {
            customClass: 'detail'
          });
          template = '';
          if (nameSlug) {
            person = model.get('Persons').where({
              UrlSlug: nameSlug
            });
            if (person.length) {
              person[0].get('Templates').each(function(templ) {
                if (templ.get('IsDetail')) {
                  return template = templ.get('Url');
                }
              });
            }
          }
          detailView = !template ? new Portfolio.Views.Detail({
            model: model
          }) : new Person.Views.Custom({
            model: model,
            template: template
          });
          return layout.setViewAndRenderMaybe('', detailView);
        });
      } else {
        mainDfd.done(this.fourOhFour);
        return mainDfd.resolve();
      }
    },
    showCalendar: function() {
      return console.info('show whole calendar');
    },
    showCalendarDetailed: function(urlHash) {
      var mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      DataRetrieval.forDetailedObject('CalendarEntry', urlHash).done(function(model) {
        return mainDfd.resolve(model);
      });
      return mainDfd.done(function(model) {
        var detailView, layout;

        if (!model) {
          return _this.fourOhFour();
        }
        layout = app.useLayout('main', {
          customClass: 'detail'
        });
        detailView = new Calendar.Views.Detail({
          model: model
        });
        return layout.setViewAndRenderMaybe('', detailView);
      });
    },
    showLoginForm: function() {
      var mainDfd;

      mainDfd = this.rejectAndHandle();
      console.info('login form. if logged in, redirect to dashboard');
      Auth.performLoginCheck().done(function() {
        return mainDfd.resolve();
      });
      return mainDfd.done(function() {
        var layout;

        console.log('showing login form');
        layout = app.useLayout('main');
        return layout.setViewAndRenderMaybe('', new Auth.Views.Login());
      });
    },
    doLogout: function() {
      var dfd, layout;

      if (this.mainDfd) {
        this.mainDfd.reject();
        this.mainDfd = null;
      }
      layout = app.useLayout('main');
      dfd = $.Deferred();
      if (app.CurrentMember) {
        layout.setViewAndRenderMaybe('', new Auth.Views.Logout());
        dfd = Auth.logout();
      } else {
        dfd.resolve();
      }
      return dfd.done(function() {
        return Backbone.history.navigate('/login/', true);
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
    },
    showGravityViewForModels: function(modelsArray, linkTo, layout) {
      var gravityContainer;

      gravityContainer = new Portfolio.Views.GravityContainer({
        collection: modelsArray,
        linkTo: linkTo
      });
      return layout.setViewAndRenderMaybe('#gravity-container', gravityContainer);
    },
    getProjectTypeModels: function(where) {
      var projectType, returnArray, _i, _len, _ref;

      returnArray = [];
      _ref = app.Config.ProjectTypes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        projectType = _ref[_i];
        returnArray = returnArray.concat(app.Collections[projectType].where(where));
      }
      return returnArray;
    }
  });
  DataRetrieval = {
    forProjectsOverview: function(configObj) {
      var dfds, present, projectType, projectTypes, returnDfd, _fn, _i, _len;

      present = configObj.present;
      projectTypes = app.Config.ProjectTypes;
      returnDfd = new $.Deferred();
      if (!present.flag) {
        dfds = [];
        _fn = function(projectType) {
          var options;

          options = {
            name: configObj.domName(projectType),
            urlSuffix: configObj.urlSuffix
          };
          return dfds.push(JJRestApi.getFromDomOrApi(projectType, options).done(function(data) {
            return app.handleFetchedModels(projectType, data);
          }));
        };
        for (_i = 0, _len = projectTypes.length; _i < _len; _i++) {
          projectType = projectTypes[_i];
          _fn(projectType);
        }
        $.when.apply(this, dfds).done(function() {
          present.flag = true;
          return returnDfd.resolve();
        });
      } else {
        returnDfd.resolve();
      }
      return returnDfd.promise();
    },
    forCalendar: function(type) {
      var config, dfd, options;

      config = app.Config.Calendar[type];
      dfd = new $.Deferred();
      if (!config.flag) {
        options = _.clone(config);
        options.name = type + '-calendar';
        JJRestApi.getFromDomOrApi('CalendarEntry', options).done(function(data) {
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
          return dfd.resolve();
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    forPersonsOverview: function() {
      var config, dfd, options;

      config = app.Config.Person;
      dfd = new $.Deferred();
      if (!config.about_present) {
        options = _.clone(config);
        JJRestApi.getFromDomOrApi('Person', options).done(function(data) {
          config.about_present = true;
          app.handleFetchedModels('Person', data);
          return dfd.resolve();
        });
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    forDetailedObject: function(classType, slug, callback) {
      var coll, configObj, dfd, existModel, options, whereStatement;

      configObj = app.Config.Detail[classType];
      dfd = new $.Deferred();
      coll = app.Collections[classType];
      whereStatement = configObj.where(slug);
      existModel = coll.findWhere(whereStatement);
      if (existModel) {
        if (existModel._isCompletelyFetched) {
          dfd.resolve(existModel);
        } else {
          return this.fetchExistingModelCompletely(existModel);
        }
      } else {
        options = {
          name: configObj.domName,
          urlSuffix: configObj.urlSuffix(slug)
        };
        JJRestApi.getFromDomOrApi(classType, options).done(function(data) {
          var model;

          data = _.isArray(data) ? data : [data];
          model = data.length === 1 ? app.handleFetchedModel(classType, data[0]) : null;
          model._isCompletelyFetched = true;
          return dfd.resolve(model);
        });
      }
      return dfd.promise();
    },
    forRandomGroupImage: function() {
      var dfd, getRandom, pageInfos;

      pageInfos = app.PageInfos;
      dfd = new $.Deferred();
      getRandom = function() {
        var groupImages;

        groupImages = pageInfos.GroupImages;
        if (groupImages.length > 0) {
          return groupImages[Math.floor(Math.random() * groupImages.length)];
        }
        return null;
      };
      if (!pageInfos.GroupImages) {
        JJRestApi.getFromDomOrApi('GroupImage').done(function(data) {
          pageInfos.GroupImages = data;
          return dfd.resolve(getRandom());
        });
      } else {
        dfd.resolve(getRandom());
      }
      return dfd.promise();
    },
    fetchExistingModelCompletely: function(existModel, callback) {
      var dfd;

      dfd = new $.Deferred();
      existModel.fetch({
        success: function(model) {
          dfd.resolve(model);
          return model._isCompletelyFetched = true;
        }
      });
      return dfd.promise();
    }
  };
  return Router;
});
