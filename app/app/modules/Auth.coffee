define [
		'app'
	],
	(app) ->

		###*
		 * This module handles all authentication stuff like login/logout, logged_in-ping
		 * 
		###

		Auth = app.module()
		Auth.ping = 
			url: JJRestApi.setObjectUrl 'User'
			interval: 10000

		Auth.loginUrl = 'api/v2/Auth/login'
		Auth.logoutUrl = 'api/v2/Auth/logout'

		Auth.logout = ->
			$.post(Auth.logoutUrl).pipe((res) ->
				if res.success then return res else return $.Deferred().reject res
			).done((res) ->
				console.log 'cancelling login ping'
				app.CurrentMember = {}
				Auth.cancelLoginPing()
			).promise()

		Auth.performLoginCheck = ->
			$.getJSON(@.ping.url).done((data) ->
				app.CurrentMember = data || {}
				if data.Email then Auth.kickOffLoginPing()
			).promise()

		Auth.kickOffLoginPing = ->
			@.cancelLoginPing
			@.loginPing = window.setTimeout =>
				@.performLoginCheck().done ->
					if not app.CurrentMember.Email
						Backbone.history.navigate '/login/', true
			, @.ping.interval

		Auth.cancelLoginPing = ->
			if @.loginPing
				window.clearTimeout @.loginPing
				delete @.loginPing

		Auth.Views.Login = Backbone.View.extend
			tagName: 'section'
			idAttribute: 'login-form'
			template: 'login-form'
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
					if member.Email
						app.CurrentMember = member
						Auth.kickOffLoginPing()
					# small test // in reality redirect to dashboard
					@.render()
				false
			serialize: ->
				return app.CurrentMember

		Auth.Views.Logout = Backbone.View.extend
			tagName: 'section'
			idAttriubte: 'logging-out'
			template: 'logging-out'
			serialize: ->
				return app.CurrentMember

		Auth
