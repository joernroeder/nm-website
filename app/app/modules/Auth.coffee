define [
		'app'
	],
	(app) ->

		###*
		 * This module handles all authentication stuff like login/logout, logged_in-ping
		 * if someone can edit a project etc.
		 * 
		###

		Auth = app.module()
		Auth.ping = 
			url: JJRestApi.setObjectUrl 'User'
			interval: 20000

		Auth.loginUrl = 'api/v2/Auth/login'
		Auth.logoutUrl = 'api/v2/Auth/logout'
		Auth.canEditUrl = 'api/v2/Auth/canEdit'

		Auth.Cache =
			userWidget: null

		# simulating HTTP redirect to destroy all "logged in" data
		Auth.redirectTo = (slug) ->
			url = app.origin + '/' + slug + '/'
			window.location.replace url

		Auth.logout = ->
			$.post(Auth.logoutUrl).pipe((res) ->
				if res.success then return res else return $.Deferred().reject res
			).done((res) ->
				console.log 'cancelling login ping, redirecting...'
				app.CurrentMember = {}
				Auth.cancelLoginPing()
				Auth.redirectTo 'login'		
			).promise()

		Auth.handleUserServerResponse = (data) ->
			if data.Email
				Auth.kickOffLoginPing()

				# initial user
				if not app.CurrentMember.Email
					# set the current member
					app.CurrentMember = data

					# get the member's person object...
					Auth.fetchMembersPerson().done ->
						# ...and update the widget
						Auth.updateUserWidget()
				# if there's a different user, HTTP redirect
				else if data.Email isnt app.CurrentMember.Email
					Auth.redirectTo 'secured/dashboard'
			else
				app.CurrentMember = {}

		Auth.performLoginCheck = ->
			$.getJSON(@.ping.url).done(Auth.handleUserServerResponse).promise()

		Auth.canEdit = (data) ->
			att = '?'
			for i, d of data
				att += i + '=' + d
			$.getJSON(@.canEditUrl + att)
			.pipe (res) ->
				if res.allowed then return res else return $.Deferred().reject
			.promse()

		Auth.kickOffLoginPing = ->
			@.cancelLoginPing
			@.loginPing = window.setTimeout =>
				@.performLoginCheck().done ->
					if not app.CurrentMember.Email
						Auth.redirectTo 'login'
			, @.ping.interval

		Auth.cancelLoginPing = ->
			if @.loginPing
				window.clearTimeout @.loginPing
				delete @.loginPing

		Auth.updateUserWidget = ->
			widget = @.Cache.userWidget = @.Cache.userWidget || new Auth.Views.Widget()
			widget.render()

		# this function gets the current member's person object (detail)
		Auth.fetchMembersPerson = ->
			dfd = new $.Deferred()
			# if app already has our person's object, just resolve
			if app.CurrentMemberPerson
				dfd.resolve()
				return dfd.promise()

			# check if the id is present anyway
			id = app.CurrentMember.PersonID

			if not id 
				dfd.reject()
				return dfd.promise()

			# check if the person's already there
			existModel = app.Collections.Person.get id
			if existModel
				if existModel._isFetchedWhenLoggedIn
					app.CurrentMemberPerson = existModel
					dfd.resolve()
				else
					existModel.fetch
						success: (model) ->
							model._isCompletelyFetched = true
							model._isFetchedWhenLoggedIn = true
							app.CurrentMemberPerson = model
							dfd.resolve()
			else
				JJRestApi.getFromDomOrApi('Person', { name: 'current-member-person', id: id }).done (data) ->
					if _.isObject data
						model = app.handleFetchedModel 'Person', data
						model._isCompletelyFetched = true
						model._isFetchedWhenLoggedIn = true
						app.CurrentMemberPerson = model
						dfd.resolve()
					else
						dfd.reject()

			dfd.promise()



		Auth.Views.Login = Backbone.View.extend
			tagName: 'section'
			idAttribute: 'login-form'
			template: 'security/login-form'
			events: 
				'submit form': 'submitLoginForm'
			submitLoginForm: (e) ->
				e.preventDefault()
				pass = @.$el.find('[name="password"]').val()
				email = @.$el.find('[name="email"]').val()
				rem = if @.$el.find('[name="remember"]').is(':checked') is true then 1 else 0
				$.post(Auth.loginUrl, {
					pass: pass
					email: email
					remember: rem
				}).done (member) =>
					Auth.handleUserServerResponse member
					@.render()
				false
			serialize: ->
				return app.CurrentMember

		Auth.Views.Logout = Backbone.View.extend
			tagName: 'section'
			idAttribute: 'logging-out'
			template: 'security/logging-out'
			serialize: ->
				return app.CurrentMember

		Auth.Views.Widget = Backbone.View.extend
			tagName: 'section'
			el: $('#user-widget')
			template: 'security/user-widget'
			serialize: ->
				person = if app.CurrentMemberPerson then app.CurrentMemberPerson.toJSON()
				{ Member: app.CurrentMember, Person: person }

		Auth
