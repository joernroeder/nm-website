<?php

class JJ_RestApiDataObjectListExtension extends DataExtension {

	/**
	 * default fields for every $api_access[context]
	 *
	 * @static
	 * @var array
	 */
	public static $api_default_fields = array(
		'ID'		=> 'Int',
		//'Created'	=> 'SS_DateTime'
	);

	/**
	 * sets the api
	 *
	 * @static
	 * @var string
	 */
	public static $api_extension = 'json';

	/**
	 *
	 * @static
	 * @var string
	 */
	public static $api_logged_in_context_name = 'logged_in';

	// ! Context Handler
	
	public function getViewContext($member = null) {
		return $this->getContextName($member);
	}

	public function getEditContext($member = null) {
		return $this->getContextName($member);
	}

	public function getDeleteContext($member = null) {
		return $this->getContextName($member);
	}

	/**
	 * @param DataObject $member
	 * @return string context
	 */
	protected function getContextName($member = null) {
		$memberID = $member ? $member->ID : Member::CurrentUserID();

		return (int) $memberID ? self::$api_logged_in_context_name : false;
	}


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
	public function toDataElement($name = '') {
		if (!$name) {
			$name = $this->owner instanceof DataList ? $this->owner->dataClass() : $this->class;
			$name = strtolower($name);
		}

		return new JJ_DataElement($name, $this->owner);
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
	public function getApiFields($fields = null) {
		$dbFields = array();
		$customFields = $fields ? $fields : $this->getApiContextFields();

		//print_r($customFields);

		// if custom fields are specified, only select these
		if (is_array($customFields)) {
			
			// update Relation names
			$preparedCustomFields = $this->convertRelationsNames($customFields);
			
			$relationKeys = $this->getRelationKeys();
			
			foreach ($preparedCustomFields as $key => $fieldNameArray) {
				$fieldName = is_integer($key) ? $fieldNameArray : $key;

				//
				//if (in_array($fieldName, $this->owner->getRemoveFields())) continue;

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
				else if ($this->owner->hasField($fieldName) || $this->owner->hasMethod("get{$fieldName}") || $this->owner->hasMethod("{$fieldName}")) {
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

		} else {
			// by default, all database fields are selected
			$dbFields = $this->owner->inheritedDatabaseFields();
		}

		$customAddFields = $this->ApiFormatter()->getCustomAddFields();
		//print_r("customAddFields");
		//print_r($customAddFields);
		if (is_array($customAddFields)) {
			foreach($customAddFields as $fieldName) {
				// @todo Possible security risk by making methods accessible - implement field-level security
				if($this->owner->hasField($fieldName) || $this->owner->hasMethod("get{$fieldName}")  || $this->owner->hasMethod("{$fieldName}")) $dbFields[$fieldName] = $fieldName; 
			}
		}

		// add default required fields
		$dbFields = $this->ApiFormatter()->getBase()->superUnique(array_merge(
			$this->owner->stat('api_default_fields'),
			$this->getAdditionalApiFields(),
			$dbFields
		));
		
		if(is_array($this->ApiFormatter()->getRemoveFields())) {
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
		$context = ArrayData::array_to_object();

		$methodName = 'get' . ucfirst($operation) . 'Context';
		$subContext = $this->owner->hasMethod($methodName) ? $this->owner->$methodName() : false;

		$context->operation = $operation;
		$context->context = $subContext ? $operation . '.' . $subContext : false;

		return $context;
	}

	/**
	 * returns the context name for the given operation
	 *
	 * {@link getApiContext}
	 * @return string API context name 
	 */
	public function getApiContextName($operation = 'view') {
		$context = $this->getApiContext($operation);
		return $context->context ? $context->context : $context->operation;
	}

	/**
	 * get Fields by api_access.context
	 *
	 * @param string $context
	 *
	 * @return array
	 */
	public function getApiContextFields($operation = 'view') {

		$fields = JJ_RestfulServer::fields(); //$this->stat('fields');

		$context = $this->getApiContext($operation);
		$apiAccess = $this->owner->stat('api_access');
		$className = $this->owner->class;

		// try to get subcontext (view.logged_in)
		if (isset($apiAccess[$context->context])) {
			return $apiAccess[$context->context];
		}
		// fallback to (view)
		else if (isset($apiAccess[$context->operation])) {
			return $apiAccess[$context->operation];
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
	public function getRelationKeys($component = null, $classOnly = true) {

		$relations = array();
		$relationKeys = array(
			'has_one'		=> $this->owner->has_one($component = null),
			'belongs_to'	=> $this->owner->belongs_to($component = null, $classOnly = true),
			'has_many'		=> $this->owner->has_many($component = null, $classOnly = true),
			'many_many'		=> $this->owner->many_many($component = null)
		);

		foreach ($relationKeys as $key => $relation) {
			if (is_array($relation) && !empty($relation)) {
				foreach ($relation as $k => $v) {
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

	/**
	 * Temporary hack to return an association name, based on class, to get around the mangle
	 * of having to deal with reverse lookup of relationships to determine autogenerated foreign keys.
	 *
	 * This method is a modified version of {@link DataObject.getReverseAssociation}
	 * @return String
	 */
	public function getReverseRelationKey($className, $key) {
		if (is_array($this->owner->many_many())) {
			$many_many = array_flip($this->owner->many_many());
			if (array_key_exists($className, $many_many) && in_array($key, array('many_many', 'belongs_many_many'))) return $many_many[$className];
		}
		if (is_array($this->owner->has_many())) {
			$has_many = array_flip($this->owner->has_many());
			if (array_key_exists($className, $has_many) && $key == 'has_one') return $has_many[$className];
		}
		if (is_array($this->owner->has_one())) {
			$has_one = array_flip($this->owner->has_one());
			if (array_key_exists($className, $has_one) && in_array($key, array('has_many', 'belongs_to'))) return $has_one[$className];
		}
		if (is_array($this->owner->belongs_to())) {
			$belongs_to = array_flip($this->owner->belongs_to());
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