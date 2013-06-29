// Generated by CoffeeScript 1.6.2
define(['app', 'modules/Auth', 'modules/Project', 'modules/Person', 'modules/Excursion', 'modules/Workshop', 'modules/Exhibition', 'modules/CalendarEntry', 'modules/PageError', 'modules/Portfolio', 'modules/Calendar', 'modules/About', 'modules/ProjectSearch', 'modules/DataRetrieval', 'modules/NewProject', 'modules/ProjectEditor'], function(app, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar, About, ProjectSearch, DataRetrieval, NewProject, ProjectEditor) {
  /**
  	 *
  	 *	All the URL routing is done here.
  	 *	Our router also serves as the data retrieving interface. All data getting logic is
  	 *	handled here. 
  	 *
  */

  var Router;

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

      app.isEditor = false;
      if (app.ProjectEditor) {
        app.ProjectEditor.cleanup();
        app.ProjectEditor = null;
      }
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
        Auth.updateUserWidget();
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
      'secured/edit/:uglyHash/': 'showEditProjectPage',
      'secured/new/': 'showCreateProjectPage',
      '*url/': 'catchAllRoute'
    },
    index: function(hash) {
      var calDfd, config, mainDfd, projDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      config = app.Config;
      if (app.Cache.WholePortfolio) {
        config.Featured.present.flag = true;
      }
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
            IsFeatured: true,
            IsPublished: true
          });
        }
        modelsArray = app.Cache.Featured;
        _this.showPackeryViewForModels(modelsArray, 'portfolio', layout);
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
        view = new About.Views.PackeryContainer({
          groupImage: image,
          persons: persons
        });
        return layout.setViewAndRenderMaybe('', view);
      });
    },
    showPersonPage: function(nameSlug) {
      var mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      DataRetrieval.forDetailedObject('Person', nameSlug).done(function(model) {
        return mainDfd.resolve(model);
      });
      return mainDfd.done(function(model) {
        var layout, template, view;

        if (!model) {
          return _this.fourOhFour();
        }
        layout = app.useLayout('main');
        template = '';
        model.get('Templates').each(function(templ) {
          if (!templ.get('IsDetail')) {
            return template = templ.get('Url');
          }
        });
        view = !template ? new Person.Views.PackeryContainer({
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
      var justUpdate, mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      DataRetrieval.forProjectsOverview(app.Config.Portfolio).done(function() {
        return mainDfd.resolve();
      });
      if (searchTerm) {
        console.info('searching for: %s', searchTerm);
      }
      justUpdate = app.currentLayoutName === 'portfolio' ? true : false;
      return mainDfd.done(function() {
        var layout, modelsArray;

        if (!justUpdate) {
          layout = app.useLayout('portfolio');
        }
        if (!app.Cache.WholePortfolio) {
          app.Cache.WholePortfolio = _this.getProjectTypeModels({
            IsPortfolio: true,
            IsPublished: true
          });
        }
        modelsArray = app.Cache.WholePortfolio;
        if (searchTerm) {
          modelsArray = DataRetrieval.filterProjectTypesBySearchTerm(searchTerm);
        }
        if (!justUpdate) {
          return _this.showPackeryViewForModels(modelsArray, 'portfolio', layout);
        } else {
          return console.log('add or remove models');
        }
      });
    },
    showPortfolioDetailed: function(uglyHash, nameSlug) {
      var classType, mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      classType = app.resolveClassTypeByHash(uglyHash);
      if (classType) {
        DataRetrieval.forDetailedObject(classType, uglyHash).done(function(model) {
          return mainDfd.resolve(model);
        });
        return mainDfd.done(function(model) {
          var detailView, layout, person, template;

          if (!model || (!model.get('IsPublished')) || (!nameSlug && !model.get('IsPortfolio'))) {
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
        return dfd = Auth.logout();
      } else {
        return dfd.resolve();
      }
    },
    showCreateProjectPage: function() {
      var mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      Auth.performLoginCheck().done(function() {
        if (app.CurrentMember.Email) {
          return mainDfd.resolve();
        } else {
          return _this.fourOhFour();
        }
      });
      return mainDfd.done(function() {
        var layout;

        layout = app.useLayout('main');
        return layout.setViewAndRenderMaybe('', new NewProject.Views.NewProject());
      });
    },
    showEditProjectPage: function(uglyHash) {
      var className, mainDfd,
        _this = this;

      mainDfd = this.rejectAndHandle();
      app.isEditor = true;
      className = app.resolveClassTypeByHash(uglyHash);
      Auth.canEdit({
        className: className,
        UglyHash: uglyHash
      }).fail(function() {
        return Backbone.history.navigate('/login/', true);
      }).done(function() {
        return DataRetrieval.forDetailedObject(className, uglyHash, true).done(function(model) {
          return mainDfd.resolve(model);
        });
      });
      return mainDfd.fail(function() {
        return Backbone.history.navigate('/login/', true);
      }).done(function(model) {
        var layout;

        layout = app.useLayout('editor');
        app.ProjectEditor = new ProjectEditor.Inst(model);
        return app.ProjectEditor.kickOffRender();
      });
    },
    catchAllRoute: function(url) {
      return console.log('catch all route');
    },
    fourOhFour: function() {
      return this.rejectAndHandle().resolve().done(function() {
        var errorView, layout;

        layout = app.useLayout('main');
        errorView = new PageError.Views.FourOhFour({
          attributes: {
            'data-url': window.location.href
          }
        });
        return layout.setViewAndRenderMaybe('', errorView);
      });
    },
    showPackeryViewForModels: function(modelsArray, linkTo, layout) {
      var packeryContainer;

      packeryContainer = new Portfolio.Views.PackeryContainer({
        collection: modelsArray,
        linkTo: linkTo
      });
      return layout.setViewAndRenderMaybe('#packery-container', packeryContainer);
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
  return Router;
});
