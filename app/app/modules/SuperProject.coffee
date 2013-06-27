define [
		'app'
	],
	(app) ->

		SuperProject = app.module()

		SuperProject.Model = Backbone.JJRelationalModel.extend
			idArrayOfRelationToClass: (classType) ->
				idArray = null
				
				if @get('ClassName') is 'Project' and type is Project
					idArray = @get('ChildProjects').getIDArray().concat @get('ParentProjects').getIDArray()
				else if @get('ClassName') is type then return []

				idArray = @get(classType + 's').getIDArray() if not idArray
				idArray

			hasRelationTo: (classType, id) ->
				idArray = @idArrayOfRelationToClass classType
				if _.indexOf(idArray, id) < 0 then false else true


		SuperProject
