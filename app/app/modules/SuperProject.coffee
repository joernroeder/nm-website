define [
		'app'
	],
	(app) ->

		SuperProject = app.module()

		SuperProject.Model = Backbone.JJRelationalModel.extend
			idArrayOfRelationToClass: (classType) ->
				if @get('ClassName') is 'Project' and classType is 'Project'
					return @get('ChildProjects').getIDArray().concat @get('ParentProjects').getIDArray()
				else if @get('ClassName') is classType then return []

	
				return @get(classType + 's').getIDArray()

			hasRelationTo: (classType, id) ->
				idArray = @idArrayOfRelationToClass classType
				if _.indexOf(idArray, id) < 0 then false else true


		SuperProject
