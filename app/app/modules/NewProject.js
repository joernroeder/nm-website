// Generated by CoffeeScript 1.6.3
define(['app', 'modules/DataRetrieval'], function(app, DataRetrieval) {
  var NewProject;
  NewProject = app.module();
  NewProject.Views.NewProject = Backbone.View.extend({
    tagName: 'div',
    template: 'security/create-project',
    events: {
      'submit form.create-project': 'createNewProject',
      'click .project-type-list a': 'setProjectType'
    },
    hideForm: function() {
      this.$field.blur();
      this.formError('');
      return this.$form.removeClass('active');
    },
    showForm: function() {
      this.$submit.text('Create ' + this.projectType);
      this.$field.attr('placeholder', this.projectType + ' Title').removeAttr('disabled').val('').focus();
      this.formError('');
      return this.$form.addClass('active');
    },
    formError: function(msg) {
      if (msg) {
        return this.$error.html(msg).addClass('active');
      } else {
        return this.$error.removeClass('active');
      }
    },
    setProjectType: function(e) {
      var $link, type;
      $link = $(e.target);
      $link.closest('ul').find('.active').not($link).removeClass('active').end().end().end().toggleClass('active');
      if ($link.hasClass('active')) {
        this.$list.addClass('active');
        type = $(e.currentTarget).data('type');
        if (type) {
          this.projectType = type;
        }
        this.showForm();
      } else {
        this.$list.removeClass('active');
        this.projectType = null;
        this.hideForm();
      }
      return false;
    },
    afterRender: function() {
      var _this = this;
      this.$list = $('ul.project-type-list');
      this.$form = $('form.create-project');
      this.$field = $('input', this.$form);
      this.$error = $('.form-error', this.$form);
      this.$submit = $('button[type=submit]', this.$form);
      return this.$field.on('keyup', function() {
        if (_this.$error.hasClass('active') && _this.$field.val()) {
          return _this.formError('');
        }
      });
    },
    createNewProject: function(e) {
      var errorMsg, m, model, person, title,
        _this = this;
      e.preventDefault();
      title = this.$field.val();
      errorMsg = '';
      if (!title) {
        errorMsg = 'Please fill in a title!';
      }
      if (!this.projectType) {
        errorMsg = 'Please choose the type of your project!';
      }
      if (errorMsg) {
        this.formError(errorMsg);
        this.$field.focus();
      } else {
        if (person = app.CurrentMemberPerson) {
          this.$field.attr('disabled', 'disabled');
          m = JJRestApi.Model(this.projectType);
          model = new m({
            Title: title,
            Persons: person,
            EditableByMember: true
          });
          console.log('CurrentMemberPerson %o', person);
          model.save(null, {
            success: function() {
              _this.$field.removeAttr('disabled');
              model._isCompletelyFetched = true;
              model._isFetchedWhenLoggedIn = true;
              Backbone.history.navigate('/secured/edit/' + model.get('UglyHash') + '/', true);
              return DataRetrieval.addNewProjectToUserGallery(model);
            },
            error: function(e) {
              var msg;
              msg = '<h1>' + e.status + ': ' + e.statusText + '</h1><p>' + e.responseText + '</p>';
              _this.formError(msg);
              return _this.$field.removeAttr('disabled');
            }
          });
        }
      }
      return false;
    }
  });
  return NewProject;
});
