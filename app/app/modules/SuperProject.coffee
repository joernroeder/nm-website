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

			setRelCollByIds: (relKey, ids) ->
				_changed = false
				if relColl = @get relKey
					className = relColl.model.prototype.storeIdentifier
					# add those which aren't there yet
					_.each ids, (id) =>
						if not @.hasRelationTo className, id								
							_changed = true
							relColl.add id
					# remove those which are no longer needed
					idArray = @idArrayOfRelationToClass className
					_.each _.difference(relColl.getIDArray(), ids), (id) =>
						_changed = true
						model = relColl.get id
						if model
							relColl.remove model
						else if relKey is 'Projects'
							relColl = @get 'ParentProjects'
							relColl.remove relColl.get(id)
				_changed


		SuperProject
