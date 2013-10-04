define [
		'app'
	],
	(app) ->

		SuperProject = app.module()

		SuperProject.Model = Backbone.JJRelationalModel.extend
			idArrayOfRelationToClass: (classType, relKey = undefined) ->
				if @get('ClassName') is 'Project' and classType is 'Project'
					return @get('ChildProjects').getIDArray().concat @get('ParentProjects').getIDArray()
				else if @get('ClassName') is classType then return []

				relKey = if relKey then relKey else classType + 's'
				return @get(relKey).getIDArray()

			### @deprecated
			hasRelationTo: (classType, id) ->
				idArray = @idArrayOfRelationToClass classType
				if _.indexOf(idArray, id) < 0 then false else true
			###

			setRelCollByIds: (relKey, ids) ->
				_changed = false
				if relColl = @get relKey
					className = relColl.model.prototype.storeIdentifier

					idArrayOfRelationToClass = @idArrayOfRelationToClass className, relKey
					# add those which aren't there yet
					_.each ids, (id) =>
						if _.indexOf(idArrayOfRelationToClass, id) < 0
							_changed = true
							relColl.add id
					# remove those which are no longer needed
					_.each _.difference(idArrayOfRelationToClass, ids), (id) =>
						_changed = true
						model = relColl.get id
						if model
							relColl.remove model
						else if relKey is 'Projects'
							relColl = @get 'ParentProjects'
							relColl.remove relColl.get(id)
				_changed

			basicListWithoutCurrentMember: (relKey) ->
				out = []
				_.each @get(relKey).toJSON(), (person) ->
					obj = { ID: person.ID, Title: person.FirstName + ' ' + (if person.Surname then person.Surname else '') }
					out.push obj if obj.ID isnt app.CurrentMemberPerson.id
				out



			getEditorsKey: () ->
				if @.get('ClassName') is 'Project' then return 'BlockedEditors' else return 'Editors'

			# sets the current detailed url of this project. Priority: person -> portfolio -> random contributor
			setTempUrlPrefix: (preferPerson) ->
				tempPrefix = '404'
				personsColl = @get('Persons')
				console.log @
				if @get('IsPortfolio')
					tempPrefix = 'portfolio'
				else if preferPerson and personsColl.get(preferPerson.id)
					tempPrefix = 'about/' + preferPerson.get 'UrlSlug'
				else if personsColl.length > 0
					tempPrefix = 'about/' + personsColl.models[0].get 'UrlSlug'

				@set 'TempUrlPrefix', tempPrefix


		SuperProject
