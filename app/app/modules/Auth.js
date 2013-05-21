// Generated by CoffeeScript 1.6.2
define(['app', 'modules/UserSidebar'], function(app, UserSidebar) {
  /**
  		 * This module handles all authentication stuff like login/logout, logged_in-ping
  		 * if someone can edit a project etc.
  		 *
  */

  var Auth;

  Auth = app.module();
  Auth.ping = {
    url: JJRestApi.setObjectUrl('User'),
    interval: 200000
  };
  Auth.loginUrl = 'api/v2/Auth/login';
  Auth.logoutUrl = 'api/v2/Auth/logout';
  Auth.canEditUrl = 'api/v2/Auth/canEdit';
  Auth.Cache = {
    userWidget: null
  };
  Auth.redirectTo = function(slug) {
    var url;

    url = app.origin + '/' + slug + '/';
    return window.location.replace(url);
  };
  Auth.logout = function() {
    return $.post(Auth.logoutUrl).pipe(function(res) {
      if (res.success) {
        return res;
      } else {
        return $.Deferred().reject(res);
      }
    }).done(function(res) {
      console.log('cancelling login ping, redirecting...');
      app.CurrentMember = {};
      Auth.cancelLoginPing();
      return Auth.redirectTo('login');
    }).promise();
  };
  Auth.handleUserServerResponse = function(data) {
    if (data.Email) {
      Auth.kickOffLoginPing();
      if (!app.CurrentMember.Email) {
        app.CurrentMember = data;
        return Auth.fetchMembersPerson().done(function() {
          return Auth.updateUserWidget();
        });
      } else if (data.Email !== app.CurrentMember.Email) {
        return Auth.redirectTo('secured/dashboard');
      }
    } else {
      return app.CurrentMember = {};
    }
  };
  Auth.performLoginCheck = function() {
    return $.getJSON(this.ping.url).done(Auth.handleUserServerResponse).promise();
  };
  Auth.canEdit = function(data) {
    var att, d, i;

    att = '?';
    for (i in data) {
      d = data[i];
      att += i + '=' + d + '&';
    }
    return $.getJSON(this.canEditUrl + att).pipe(function(res) {
      if (res.allowed) {
        return res;
      } else {
        return $.Deferred().reject();
      }
    }).promise();
  };
  Auth.kickOffLoginPing = function() {
    var _this = this;

    this.cancelLoginPing;
    return this.loginPing = window.setTimeout(function() {
      return _this.performLoginCheck().done(function() {
        if (!app.CurrentMember.Email) {
          return Auth.redirectTo('login');
        }
      });
    }, this.ping.interval);
  };
  Auth.cancelLoginPing = function() {
    if (this.loginPing) {
      window.clearTimeout(this.loginPing);
      return delete this.loginPing;
    }
  };
  Auth.updateUserWidget = function() {
    var widget;

    if (app.CurrentMember) {
      widget = this.Cache.userWidget = this.Cache.userWidget || UserSidebar.construct();
      return widget.toggleEditorClass(app.isEditor);
    }
  };
  Auth.fetchMembersPerson = function() {
    var dfd, existModel, id;

    dfd = new $.Deferred();
    if (app.CurrentMemberPerson) {
      dfd.resolve();
      return dfd.promise();
    }
    id = app.CurrentMember.PersonID;
    if (!id) {
      dfd.reject();
      return dfd.promise();
    }
    existModel = app.Collections.Person.get(id);
    if (existModel) {
      if (existModel._isFetchedWhenLoggedIn) {
        app.CurrentMemberPerson = existModel;
        dfd.resolve();
      } else {
        existModel.fetch({
          success: function(model) {
            model._isCompletelyFetched = true;
            model._isFetchedWhenLoggedIn = true;
            app.CurrentMemberPerson = model;
            return dfd.resolve();
          }
        });
      }
    } else {
      JJRestApi.getFromDomOrApi('Person', {
        name: 'current-member-person',
        id: id
      }).done(function(data) {
        var model;

        if (_.isObject(data)) {
          model = app.handleFetchedModel('Person', data);
          model._isCompletelyFetched = true;
          model._isFetchedWhenLoggedIn = true;
          app.CurrentMemberPerson = model;
          return dfd.resolve();
        } else {
          return dfd.reject();
        }
      });
    }
    return dfd.promise();
  };
  Auth.Views.Login = Backbone.View.extend({
    tagName: 'section',
    idAttribute: 'login-form',
    template: 'security/login-form',
    events: {
      'submit form': 'submitLoginForm'
    },
    submitLoginForm: function(e) {
      var email, pass, rem,
        _this = this;

      e.preventDefault();
      pass = this.$el.find('[name="password"]').val();
      email = this.$el.find('[name="email"]').val();
      rem = this.$el.find('[name="remember"]').is(':checked') === true ? 1 : 0;
      $.post(Auth.loginUrl, {
        pass: pass,
        email: email,
        remember: rem
      }).done(function(member) {
        Auth.handleUserServerResponse(member);
        return _this.render();
      });
      return false;
    },
    serialize: function() {
      return app.CurrentMember;
    }
  });
  Auth.Views.Logout = Backbone.View.extend({
    tagName: 'section',
    idAttribute: 'logging-out',
    template: 'security/logging-out',
    serialize: function() {
      return app.CurrentMember;
    }
  });
  return Auth;
});
