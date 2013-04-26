define [
		'app'
	],
	(app) ->
		ProjectSearch =

			fields :
				'Title'	: 'partial'
				'Teaser' : (obj, valArray) ->
					return @.partialMatchFilter obj, 'TeaserText', valArray
				'Name'	: (obj, valArray) ->
					return true

			###*
			 * transforms a string into an object with the searchable field as key and the possible OR values as array
			 * @param  {String} term
			 * @return {Object}
			###
			transformSearchTerm : (term) ->
				out = {}
				for segment in term.split(';')
					els = segment.split ':'
					vals = null
					if els.length > 1
						vals = els[1].split('|')
					out[els[0]] = vals
				out

			test: (obj, key, valArray) ->

				if not _.isArray(valArray) then valArray = [valArray]
				if type = @.fields[key]
					# type has its own testing functionality
					if _.isFunction type
						return type.call(@, obj, valArray)
				
					# check if 'partial' or 'exact'. defaults to 'partial'
					else
						if type is 'exact'
							return @.exactMatchFilter obj, key, valArray
						else if type
							return @.partialMatchFilter obj, key, valArray


				# no method/filter specified for `key`, defaults to true
				true
				
			partialMatchFilter: (obj, key, valArray) ->
				query = valArray.join '|'
				pattern = new RegExp $.trim(query), 'i'
				console.log obj[key]
				if obj.hasOwnProperty(key) and pattern.test(obj[key]) then return true
				false

			exactMatchFilter: (obj, key, valArray) ->
				if not obj.hasOwnProperty(key) then return false
				for val in valArray
					query = "^#{val}$"
					pattern = new RegExp query, 'i'
					if pattern.test(val) then return true
				false




		ProjectSearch