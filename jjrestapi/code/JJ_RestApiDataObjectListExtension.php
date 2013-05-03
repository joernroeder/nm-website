<?php

class JJ_RestApiDataObjectListExtension extends DataExtension {

	/**
	 * default fields for every $api_access[context]
	 *
	 * @static
	 * @var array
	 */
	private static $api_default_fields = array(
		'ID'		=> 'Int',
		//'Created'	=> 'SS_DateTime'
	);


	/**
	 * sets the api
	 *
	 * @static
	 * @var string
	 */
	private static $api_extension = 'json';


	/**
	 *
	 * @static
	 * @var string
	 */
	private static $api_logged_in_context_name = '';


	// ! Context Handler
	
	public function getViewContext($member = null) {
		return false;
	}


	public function getEditContext($member = null) {
		return false;
	}


	public function getDeleteContext($member = null) {
		return false;
	}


	/**
	 * @param DataObject $member
	 * @return string context
	 */
	/*protected function getContextName($member = null) {
		$memberID = $member ? $member->ID : Member::CurrentUserID();

		return (int) $memberID ? self::$api_logged_in_context_name : false;
	}*/


	// ! DataFormatter

	/**
	 *
	 * @var DataFormatter
	 */
	protected $apiFormatter;


	/**
	 * returns the ApiFormatter. Usually a JSON/XML Formatter
	 */
	public function ApiFormatter() {
		if (!$this->apiFormatter) {
			$this->apiFormatter = DataFormatter::for_extension(self::$api_extension);
		}

		return $this->apiFormatter;
	}


	// ! additionalApiFields

	protected $additionalApiFields = array();


	/** 
	 * Additional Fields setter
	 *
	 * @param array $fields
	 */
	public function addAdditionalApiFields($fields) {
		//Deprecation::notice('0.2', 'removed additional fields');
		$this->additionalApiFields = array_unique(array_merge($this->additionalApiFields, $fields));
	}


	/**
	 * remove additional fields
	 *
	 * @param array $fields
	 */
	public function removeAdditionalApiFields($fields) {
		//Deprecation::notice('0.2', 'removed additional fields');
		if (!is_array($fields)) return false;

		foreach ($fields as $name => $type) {
			if (in_array($name, $this->additionalApiFields)) unset($this->additionalApiFields[$name]);
		}
	}


	/** 
	 * Additional Fields getter
	 *
	 * @return array
	 */
	public function getAdditionalApiFields() {
		//Deprecation::notice('0.2', 'removed additional fields');
		return $this->additionalApiFields;
	}


	// ! API Methods

	/**
	 * Convert shortcut
	 */
	public function toApi($fields = array()) {
		return $this->ApiFormatter()->convert($this->owner, $fields);
	}


	/**
	 * Wraps the Object|List into a JJ_DataElement. Useful if you're trying to push data to the template.
	 *
	 * @example
	 * // in your controller
	 * function index() {
	 *     $lists = DataList::create('TodoList');
	 *
	 *     return $this->customise(array(
	 *         'Lists' => $lists->toDataElement()
	 *     ));
	 * }
	 *
	 */
	public function toDataElement($name = '', $extension = null, $context = null) {
		if (!$name) {
			$name = $this->owner instanceof DataList ? $this->owner->dataClass() : $this->class;
			$name = strtolower($name);
		}

		return new JJ_DataElement($name, $this->owner, $extension, $context);
	}


	/**
	 * Returns all fields on the object which should be shown
	 * in the output. Can be customised through {@link self::setCustomFields()}.
	 *
	 * @see was JJ_BaseDataFormatter::getFieldsForObj
	 *
	 * @todo Allow for custom getters on the processed object (currently filtered through inheritedDatabaseFields)
	 * @todo Field level permission checks
	 * 
	 * @param FieldSet $fields
	 * @return array
	 */
	public function getApiFields($fields = null, $context = null) {
		$dbFields = array();
		$customFields = $fields ? $fields : $this->getApiContextFields($context);

		// if custom fields are specified, only select these
		if (is_array($customFields)) {
			
			// update Relation names
			$preparedCustomFields = $this->convertRelationsNames($customFields);

			$relationKeys = $this->getRelationKeys();

			foreach ($preparedCustomFields as $key => $fieldNameArray) {
				$fieldName = is_integer($key) ? $fieldNameArray : $key;

				// field is a relation but no relation key is set -> get only an array of ids
				if (in_array($fieldName, array_keys($relationKeys)) && $fieldName == $fieldNameArray) {

					// respect this only if there are no other keys set within the same relation
					if (!isset($preparedCustomFields[$fieldName])) {
						$dbFields[$fieldName] = $relationKeys[$fieldName]['Type'];
					}
					/*user_error(
						"You've set a relation '{$fieldName}' (should be in {$this->owner}::api_access), but forgot the key. Change it to something like: {$fieldName}.Title", E_USER_WARNING
					);*/
				} 
				// @todo Possible security risk by making methods accessible - implement field-level security
				else if ($this->owner->hasField($fieldName) || $this->owner->hasMethod("get{$fieldName}")) {
					$dbFields[$fieldName] = $fieldName;
				}
				else if (in_array($fieldName, array_keys($relationKeys))) {

					if (!isset($dbFields[$fieldName])) {
						if (is_string($fieldNameArray)) {
							$fieldNameArray = array($fieldNameArray);
						}

						$relFields = $this->ApiFormatter()->getBase()->superUnique(array_merge(
							$fieldNameArray,
							array_keys(array_merge(
								self::$api_default_fields,
								// check here
								$this->getAdditionalApiFields()
							))
						));

						if (is_array($this->ApiFormatter()->getRemoveFields())) {
							$relFields = array_diff(
								$relFields, array_combine( // @todo : what is going on in here?
									$this->ApiFormatter()->getRemoveFields(),
									$this->ApiFormatter()->getRemoveFields()
								)
							);
						}

						$dbFields[$fieldName] = count($fieldNameArray) ? array_merge($relationKeys[$fieldName], array(
							// add default required fields
							'Fields' => $relFields
						)) : $fieldName;
					}
					else {
						if (is_array($dbFields[$fieldName]) && isset($dbFields[$fieldName]['Fields'])) {
							$dbFields[$fieldName]['Fields'] = array_merge($dbFields[$fieldName]['Fields'], $fieldNameArray);
						}
					}
				}
			}
		} 
		else {
			// by default, all database fields are selected
			$dbFields = $this->owner->inheritedDatabaseFields();
		}

		$customAddFields = $this->ApiFormatter()->getCustomAddFields();
		
		if (is_array($customAddFields)) {
			foreach($customAddFields as $fieldName) {
				// @todo Possible security risk by making methods accessible - implement field-level security
				if($this->owner->hasField($fieldName) || $this->owner->hasMethod("get{$fieldName}")) $dbFields[$fieldName] = $fieldName; 
			}
		}

		// add default required fields
		$dbFields = $this->ApiFormatter()->getBase()->superUnique(array_merge(
			$this->owner->stat('api_default_fields'),
			$this->getAdditionalApiFields(),
			$dbFields
		));

		if (is_array($this->ApiFormatter()->getRemoveFields())) {
			$dbFields = array_diff_key($dbFields, array_combine(
				$this->ApiFormatter()->getRemoveFields(),
				$this->ApiFormatter()->getRemoveFields()
			));
		}

		return $dbFields;
	}


	/**
	 * returns the context object for the given api operation
	 *
	 * @param string $operation (view|update|remove)
	 * @return object context with operation ('view') and context ('view.logged_in')
	 */
	public function getApiContext($operation = 'view') {
		$methodName = 'get' . ucfirst($operation) . 'Context';

		$owner = $this->owner instanceof DataList ? singleton($this->owner->dataClass) : $owner; 

		$subContext = $owner->hasMethod($methodName) ? $owner->$methodName() : '';
	
		return JJ_ApiContext::create_from_string($operation, $subContext);
	}


	/**
	 * returns the context name for the given operation
	 *
	 * {@link getApiContext}
	 * @return string API context name 
	 */
	public function getApiContextName($operation = 'view') {
		$context = $this->getApiContext($operation);
		return $context->getContext();
	}


	/**
	 * get Fields by api_access.context
	 *
	 * @param string $context
	 *
	 * @return array
	 */
	public function getApiContextFields(JJ_ApiContext $context = null) {
		$fields = JJ_RestfulServer::fields();
		$context = $context ? $context : JJ_ApiContext::create_from_string();

		$apiAccess = $this->owner->stat('api_access');
		$className = $this->owner->class;
		$con = $context->getContext();
		// try to get subcontext (view.logged_in)
		if (isset($apiAccess[$con])) {
			return $apiAccess[$con];
		}
		// throw warning
		else {
			user_error("No \$api_access context '{$context}' in {$this->owner->class} defined", E_USER_WARNING);
		}

		if (isset($fields[$className])) {
			return array_key_exists($context, $fields[$className]) ? $fields[$className][$context] : $fields[$className];
		}
		
		return array();
	}


	// ! API Search
	
	/**
	 * getApiSearchContext
	 */
	public function getApiSearchContext(JJ_ApiContext $context = null) {		
		return new SearchContext(
			$this->owner->class,
			null,
			$this->getApiSearchFilters($context)
		);
	}

	public function getApiSearchableFields(JJ_ApiContext $context = null) {
		$searchableFields = $this->owner->stat('api_searchable_fields');
		//$searchableFields = $searchableFields ? $searchableFields : $this->owner->searchableFields();
		$searchLabels = $this->owner->fieldLabels();
		$context = $context ? $context : JJ_ApiContext::create_from_string();
		$contextFields = $this->getApiContextFields($context);
		$searchableFields = $searchableFields ? $searchableFields : $contextFields;

		$restrictToContextFields = true;
		$fields = array();

		// find searchable fields scope
		if (isset($searchableFields[$context->getContext()])) {
			$searchableFields = $searchableFields[$context->getContext()];
			$restrictToContextFields = false;
		}
		// try to fall back to operation context fields
		else if (isset($searchableFields[$context->getOperation()])) {
			$searchableFields = $searchableFields[$context->getOperation()];
			$restrictToContextFields = false;
		}

		foreach($searchableFields as $name => $specOrName) {
			$identifer = (is_int($name)) ? $specOrName : $name;

			// restrict searchable fields to context definitions
			if ($restrictToContextFields && !in_array($identifer, $contextFields)) {
				continue;
			}
			
			// Format: array('MyFieldName')
			if (is_int($name)) {
				$field = array();
			}
			// Format: array('MyFieldName' => array('filter' => 'ExactMatchFilter'))
			else if (is_array($specOrName)) {
				$field = array_merge(
					array('filter' => $this->owner->relObject($identifer)->stat('default_search_filter_class')),
					(array)$specOrName
				);
			}
			// Format: array('MyFieldName' => 'ExactMatchFilter')
			else {
				$field = array(
					'filter' => $specOrName
				);
			}

			if (!isset($field['title'])) {
				$field['title'] = isset($labels[$identifer]) ? $labels[$identifer] : FormField::name_to_label($identifer);
			}

			if (!isset($field['filter'])) {
				$field['filter'] = 'PartialMatchFilter';
			}

			$fields[$identifer] = $field;
		}

		$this->owner->extend('updateApiSearchableFields', $fields);

		return $fields;
	}


	/**
	 * returns an associative array filled with {@see SearchFilter} from the given JJ_ApiContext 
	 * 
	 * @param JJ_ApiContext $context
	 * 
	 * @return array
	 */
	public function getApiSearchFilters(JJ_ApiContext $context = null) {
		$filters = array();

		foreach ($this->getApiSearchableFields($context) as $name => $filter) {
			$class = $filter['filter'];

			// if $filterClass is not set a name of any subclass of SearchFilter than assing 'PartialMatchFilter' to it
			if (!is_subclass_of($class, 'SearchFilter')) {
				$class = 'PartialMatchFilter';
			}

			$filters[$name] = new $class($name);
		}
		
		return $filters;
	}


	// ! API DataObject Helper

	/**
	 * returns an array with
	 *	'relationKey'	=> array(
	 *		'className'	=> 'RelationClass',
	 *		'type'		=> 'has_one/belongs_to/has_many/many_many'
	 *	)
	 *
	 * @return array
	 */
	private function getRelationKeyArray() {
		return array(
			'has_one'			=> $this->owner->has_one($component = null),
			'belongs_to'		=> $this->owner->belongs_to($component = null, $classOnly = true),
			'has_many'			=> $this->owner->has_many($component = null, $classOnly = true),
			'many_many'			=> $this->owner->many_many($component = null),
			//'belongs_many_many'			=> array_merge($this->getManyManyRelationKeys(), $this->getBelongsToManyManyRelationKeys())
		);
	}

	private function getStructuralRelationKeyArray() {
		return array(
			'has_one'			=> $this->owner->has_one($component = null),
			'belongs_to'		=> $this->owner->belongs_to($component = null, $classOnly = true),
			'has_many'			=> $this->owner->has_many($component = null, $classOnly = true),
			'many_many'			=> $this->getManyManyRelationKeys(),
			'belongs_many_many'	=> $this->getBelongsToManyManyRelationKeys()
		);
	}

	private function processRelationKeys($relationKeys) {
		$relations = array();

		foreach ($relationKeys as $key => $relation) {
			if (is_array($relation) && !empty($relation)) {
				foreach ($relation as $k => $v) {

					if (!class_exists($v)) continue;

					$relations[$k] = array(
						'ClassName'		=> $v,
						'Type'			=> $key,
						'Key'			=> $k,
						'ReverseKey'	=> singleton($v)->getReverseRelationKey($this->owner->class, $key)
					);
				}
			}
		}
		
		return $relations;
	}

	public function getStructuralRelationKeys() {
		return $this->processRelationKeys($this->getStructuralRelationKeyArray());
	}

	public function getRelationKeys() {
		/*$relationKeys = $this->getRelationKeyArray();

		foreach ($relationKeys as $key => $relation) {
			if (is_array($relation) && !empty($relation)) {
				foreach ($relation as $k => $v) {

					if (!class_exists($v)) continue;

					$relations[$k] = array(
						'ClassName'		=> $v,
						'Type'			=> $key,
						'Key'			=> $k,
						'ReverseKey'	=> singleton($v)->getReverseRelationKey($this->owner->class, $key)
					);
				}
			}
		}
		
		return $relations;*/
		return $this->processRelationKeys($this->getRelationKeyArray());
	}

	private function getManyManyRelationKeys() {
		$newItems = (array)Config::inst()->get($this->owner->class, 'many_many', Config::UNINHERITED);

		// Validate the data
		foreach($newItems as $k => $v) {
			if(!is_string($k) || is_numeric($k) || !is_string($v)) {
				user_error("$class::\$many_many has a bad entry: " 
				. var_export($k,true). " => " . var_export($v,true) . ".  Each map key should be a"
				. " relationship name, and the map value should be the data class to join to.", E_USER_ERROR);
			}
		}

		return isset($items) ? array_merge($newItems, $items) : $newItems;
	}

	private function getBelongsToManyManyRelationKeys() {
		$newItems = (array)Config::inst()->get($this->owner->class, 'belongs_many_many', Config::UNINHERITED);

		// Validate the data
		foreach($newItems as $k => $v) {
			if(!is_string($k) || is_numeric($k) || !is_string($v)) {
				user_error("$class::\$belongs_many_many has a bad entry: " 
				. var_export($k,true). " => " . var_export($v,true) . ".  Each map key should be a"
				. " relationship name, and the map value should be the data class to join to.", E_USER_ERROR);
			}
		}

		return isset($items) ? array_merge($newItems, $items) : $newItems;
	}


	/**
	 * Temporary hack to return an association name, based on class, to get around the mangle
	 * of having to deal with reverse lookup of relationships to determine autogenerated foreign keys.
	 *
	 * This method is a modified version of {@link DataObject.getReverseAssociation}
	 * @return String
	 */
	public function getReverseRelationKey($className, $key) {
		$belongs_many_many = $this->getBelongsToManyManyRelationKeys();
		if (is_array($belongs_many_many)) {
			$belongs_many_many = array_flip($belongs_many_many);
			if (array_key_exists($className, $belongs_many_many) && $key == 'many_many') return $belongs_many_many[$className];
		}

		$many_many = $this->getManyManyRelationKeys();
		if (is_array($many_many)) {
			$many_many = array_flip($many_many);
			if (array_key_exists($className, $many_many) && in_array($key, array('belongs_many_many', 'many_many'))) return $many_many[$className];
		}

		$has_many = $this->owner->has_many();
		if (is_array($has_many)) {
			$has_many = array_flip($has_many);
			if (array_key_exists($className, $has_many) && $key == 'has_one') return $has_many[$className];
		}

		$has_one = $this->owner->has_one();
		if (is_array($has_one)) {
			$has_one = array_flip($has_one);
			if (array_key_exists($className, $has_one) && in_array($key, array('has_many', 'belongs_to'))) return $has_one[$className];
		}

		$belongs_to = $this->owner->belongs_to();
		if (is_array($belongs_to)) {
			$belongs_to = array_flip($belongs_to);
			if (array_key_exists($className, $belongs_to) && $key == 'has_one') return $belongs_to[$className];
		}
		
		return false;
	}


	/**
	 * converts parent.child syntax into multi-dimensional arrays
	 *
	 * @param array $fields
	 * @return array
	 */
	public function convertRelationsNames($fields) {

		if (!is_array($fields)) return $fields;

		$arrayFields = array();

		foreach ($fields as $field) {
			$f = explode('.', $field);
			$arrayFields = array_merge($arrayFields, $this->formatRelationKey($f, $arrayFields));
		}

		return $arrayFields;
	}


	/**
	 * returns the relation object
	 *
	 * @param string $relName
	 * @param string $relType
	 * @return DataList | ManyManyList | DataObject
	 */
	public function getRelation($relName, $relType) {

		$rel = null;

		switch ($relType) {

			case 'has_one':
			case 'belongs_to':
				$rel = $this->owner->getComponent($relName);
				break;	

			case 'has_many':
				$rel = $this->owner->getComponents($relName);
				break;

			case 'many_many':
				$rel = $this->owner->getManyManyComponents($relName);
				break;
		}

		return $rel;
	}


	/**
	 * formats the relation key structure
	 *
	 * @param current node
	 * @param array $arrayFields all fields for the current object
	 */
	protected function formatRelationKey($keyArray, $arrayFields) {
		$out = array();
		// object key
		if (count($keyArray) == 1) {
			$out = array($keyArray[0]);
		}
		// relation key
		else if (count($keyArray) >= 2) {

			$k = $keyArray[0];

			// parent.child
			if (count($keyArray) == 2) {
				$value = $keyArray[1];
			}
			// a further object.parent.child relation
			else {
				array_shift($keyArray);
				$value = implode('.', $keyArray);
			}

			// merge keys together
			if (isset($arrayFields[$k])) {
				$oldField = is_array($arrayFields[$k]) ? $arrayFields[$k] : array($arrayFields[$k]);
				$out[$k] = array_merge($oldField, array($value));
			}
			else {
				$out[$k] = $value;
			}
		}

		return $out;
	}

}

