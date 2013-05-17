// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var DataRetrieval;

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
    filterProjectTypesBySearchTerm: function(searchTerm) {
      var model, out, result, searchObj, tmp, wholePortfolio, _i, _len;

      wholePortfolio = app.Cache.WholePortfolio;
      if (!app.Cache.WholePortfolioJSON) {
        tmp = [];
        for (_i = 0, _len = wholePortfolio.length; _i < _len; _i++) {
          model = wholePortfolio[_i];
          tmp.push(model.toJSON());
        }
        app.Cache.WholePortfolioJSON = tmp;
      }
      searchObj = ProjectSearch.transformSearchTerm(searchTerm);
      console.log(searchObj);
      result = _.filter(app.Cache.WholePortfolioJSON, function(model) {
        result = true;
        _.each(searchObj, function(vals, key) {
          if (!ProjectSearch.test(model, key, vals)) {
            return result = false;
          }
        });
        return result;
      });
      out = _.map(result, function(model) {
        return (function(model) {
          return _.find(wholePortfolio, function(m) {
            return m.id === model.ID && m.get('ClassName') === model.ClassName;
          });
        })(model);
      });
      return out;
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
    forDetailedObject: function(classType, slug, checkForLoggedIn) {
      var coll, configObj, dfd, existModel, options, resolve, whereStatement;

      configObj = app.Config.Detail[classType];
      dfd = new $.Deferred();
      coll = app.Collections[classType];
      whereStatement = configObj.where(slug);
      existModel = coll.findWhere(whereStatement);
      if (existModel) {
        if (existModel._isCompletelyFetched) {
          resolve = true;
        }
        if (checkForLoggedIn && !existModel._isFetchedWhenLoggedIn) {
          resolve = false;
        }
        if (resolve) {
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
          model._isFetchedWhenLoggedIn = true;
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
    forUserGallery: function() {
      var dfd, userGallery;

      userGallery = app.Cache.UserGallery;
      dfd = new $.Deferred();
      if (userGallery.fetched) {
        dfd.resolve(userGallery.images);
      } else {
        $.getJSON(app.Config.GalleryUrl).done(function(data) {
          userGallery.images = data;
          userGallery.fetched = true;
          return dfd.resolve(userGallery);
        });
      }
      return dfd.promise();
    },
    fetchExistingModelCompletely: function(existModel) {
      var dfd;

      dfd = new $.Deferred();
      existModel.fetch({
        success: function(model) {
          dfd.resolve(model);
          model._isCompletelyFetched = true;
          return model._isFetchedWhenLoggedIn = true;
        }
      });
      return dfd.promise();
    }
  };
  return DataRetrieval;
});
