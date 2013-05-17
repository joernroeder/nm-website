// Generated by CoffeeScript 1.6.2
require(['app', 'router', 'modules/Auth', 'modules/Project', 'modules/Person', 'modules/Excursion', 'modules/Workshop', 'modules/Exhibition', 'modules/CalendarEntry', 'plugins/misc/spin.min', 'plugins/misc/misc'], function(app, Router, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, Spinner, misc) {
  Backbone.JJRelational.Config.work_with_store = true;
  app.Router = new Router();
  app.Layout;
  app.PageInfos = {};
  app.Collections = {};
  app.Cache = {};
  app.Cache.UserGallery = {
    fetched: false,
    images: {
      Person: [],
      Projects: []
    }
  };
  app.CurrentMember = {};
  app.CurrentMemberPerson = null;
  app.origin = window.location.origin ? window.location.origin : window.location.protocol + '//' + window.location.host;
  console.log(app.origin);
  app.Config = {
    ProjectTypes: ['Project', 'Excursion', 'Workshop', 'Exhibition'],
    StoreHooks: ['Project', 'Excursion', 'Workshop', 'Exhibition', 'Person', 'CalendarEntry'],
    ClassEnc: {
      '0': 'Project',
      '1': 'Excursion',
      '2': 'Exhibition',
      '3': 'Workshop'
    },
    GalleryUrl: 'api/v2/Auth/gallery',
    UrlSuffixes: {
      about_persons: '?search=IsExternal:0'
    },
    Featured: {
      present: {
        flag: false,
        types: []
      },
      domName: function(className) {
        return 'featured-' + className.toLowerCase();
      },
      urlSuffix: '?' + JJRestApi.objToUrlString({
        search: {
          IsFeatured: 1
        },
        context: 'view.portfolio_init'
      })
    },
    Portfolio: {
      present: {
        flag: false,
        types: []
      },
      domName: function(className) {
        return 'portfolio-' + className.toLowerCase();
      },
      urlSuffix: '?' + JJRestApi.objToUrlString({
        search: {
          IsPortfolio: 1
        },
        context: 'view.portfolio_init'
      })
    },
    Calendar: {
      upcoming: {
        flag: false,
        url: 'api/v2/UpcomingEvents.json'
      },
      whole: {
        flag: false
      }
    },
    Person: {
      about_present: false,
      name: 'about-persons',
      urlSuffix: '?' + JJRestApi.objToUrlString({
        search: {
          IsExternal: 0
        },
        context: 'view.about_init',
        sort: 'Surname'
      })
    },
    Detail: {
      CalendarEntry: {
        where: function(slug) {
          return {
            UrlHash: slug
          };
        },
        domName: 'detailed-calendar-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UrlHash: slug
            },
            limit: 1
          });
        }
      },
      Person: {
        where: function(slug) {
          return {
            UrlSlug: slug
          };
        },
        domName: 'detailed-person-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UrlSlug: slug
            },
            limit: 1
          });
        }
      },
      Project: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-project-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      },
      Excursion: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-excursion-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      },
      Workshop: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-workshop-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      },
      Exhibition: {
        where: function(slug) {
          return {
            UglyHash: slug
          };
        },
        domName: 'detailed-exhibition-item',
        urlSuffix: function(slug) {
          return '?' + JJRestApi.objToUrlString({
            search: {
              UglyHash: slug
            },
            limit: 1
          });
        }
      }
    },
    Spinner: {
      lines: 13,
      length: 6,
      width: 2,
      radius: 7,
      corners: 1,
      rotate: 0,
      direction: 1,
      color: '#262626',
      speed: 1,
      trail: 70,
      shadow: false,
      hwaccel: false,
      className: 'spinner',
      zIndex: 2e9,
      top: 'auto',
      left: 'auto'
    }
  };
  app.bindListeners = function() {
    var storeHook, _fn, _i, _len, _ref;

    _ref = app.Config.StoreHooks;
    _fn = function(storeHook) {
      return Backbone.JJStore.Events.bind('added:' + storeHook, function(model) {
        var coll;

        coll = app.Collections[storeHook];
        if (coll) {
          return coll.add(model);
        }
      });
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      storeHook = _ref[_i];
      _fn(storeHook);
    }
    return true;
  };
  app.handleFetchedModels = function(type, data, options) {
    var MType, d, _i, _len, _results;

    options = options || {};
    MType = JJRestApi.Model(type);
    data = _.isArray(data) ? data : [data];
    _results = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      _results.push(new MType(d));
    }
    return _results;
  };
  app.handleFetchedModel = function(type, data, options) {
    var MType;

    options = options || {};
    MType = JJRestApi.Model(type);
    return new MType(data);
  };
  app.handleLinks = function() {
    var frag;

    frag = Backbone.history.fragment;
    frag = '/' + frag.substring(0, frag.indexOf('/') + 1);
    return $('#wrapper .badge').find('a').each(function(i, a) {
      var $a;

      $a = $(a);
      $a.removeClass('active');
      if ($a.attr('href') === frag) {
        return $a.addClass('active');
      }
    });
  };
  app.initialLoggedInCheck = function() {
    return JJRestApi.getFromDomOrApi('current-member', {
      noAjax: true
    }).done(function(data) {
      return Auth.handleUserServerResponse(data);
    });
  };
  app.setupSpinner = function() {
    this.$body = $('body');
    this.$main = $('#main');
    return this.spinner = {
      inst: new Spinner(app.Config.Spinner),
      target: document.getElementById('spinner-target')
    };
  };
  app.startSpinner = function() {
    var spinner;

    spinner = this.spinner;
    $(spinner.target).addClass('active');
    return spinner.inst.spin(spinner.target);
  };
  app.stopSpinner = function() {
    var spinner;

    spinner = this.spinner;
    $(spinner.target).removeClass('active');
    return spinner.inst.stop();
  };
  app.addLoadingClasses = function() {
    this.$body.addClass('isLoading');
    return this.$main.addClass('loading');
  };
  app.removeLoadingClasses = function() {
    this.$body.removeClass('isLoading');
    return this.$main.removeClass('loading');
  };
  app.resolveClassTypeByHash = function(uglyHash) {
    return this.Config.ClassEnc[uglyHash.substr(0, 1)];
  };
  app.bindListeners();
  $(function() {
    app.setupSpinner();
    JJRestApi.hookSecurityToken();
    return JJRestApi.bootstrapWithStructure().done(function() {
      var buildCollections;

      buildCollections = function(names) {
        var CollClass, name, _i, _len, _results;

        _results = [];
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          CollClass = JJRestApi.Collection(name);
          _results.push(app.Collections[name] = new CollClass());
        }
        return _results;
      };
      buildCollections(app.Config.StoreHooks);
      app.initialLoggedInCheck();
      return Backbone.history.start({
        pushState: true
      });
    });
  });
  return $(document).on('click', 'a:not([data-bypass])', function(evt) {
    var href, protocol;

    href = $(this).attr('href');
    protocol = this.protocol + '//';
    if (href && href.slice(0, protocol.length) !== protocol && href.indexOf('javascript:') !== 0) {
      evt.preventDefault();
      return Backbone.history.navigate(href, true);
    }
  });
});
