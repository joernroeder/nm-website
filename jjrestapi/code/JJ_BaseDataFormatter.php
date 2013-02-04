<?php

class JJ_BaseDataFormatter {

	/**
	 *
	 * @var array
	 */
	static $relation_types = array(
		'has_one', 'has_many', 'belongs_to', 'many_many'
	);

	/**
	 * additional fields for every object
	 *
	 * @deprecated
	 * @var array
	 */
	protected $additionalFields = array();

	/** 
	 *
	 * @var JJ_{JSON|XML}DataFormatter;
	 */
	protected $owner = null;

	/**
	 * @param the current JJ_FORMATDataFormatter
	 *
	 */
	public function __construct($extensionFormatter) {
		$this->owner = $extensionFormatter;
	}

	public function getRelationTypes() {
		return self::$relation_types;
	}

	// ! API Helper
	/**
	 * super unique 
	 *
	 * @link http://www.php.net/manual/de/function.array-unique.php#97285
	 *
	 * @param array
	 * @return array
	 */
	public function superUnique($array) {
		$result = array_map('unserialize', array_unique(array_map('serialize', $array)));

		foreach ($result as $key => $value) {
			if (is_array($value)) {
				$result[$key] = $this->superUnique($value);
			}
		}

		return $result;
	}

	/**
	 * checks if the fieldName exists in the fields.
	 *
	 * @param string fieldName
	 * @param array fields
	 * @return boolean exists in fields
	 */
	public function fieldFilter($fieldName, $fields) {
		if ($fields) {
			$filterFields = array();
			foreach ($fields as $field) {
				$f = explode('.', $field);
				$filterFields[] = $f[0];	
			}

			if (!in_array($fieldName, $filterFields)) return false;
		}

		return true;
	}

	/**
	 * casts a DBField Subclass
	 *
	 * @todo look for a better casting solution
	 */
	public function castFieldValue($obj, $context = '') {
		$val = null;

		// cast value manually. 
		// there must be a better solution for this!
		switch ($obj->class) {

			case "Boolean":
				if ($context == 'xml') {
					$val = $obj->getValue() ? 'true' : 'false';
				} else {
					$val = (bool) $obj->getValue();
				}
				break;

			default:
				$val = $obj->getValue();
				$val = is_numeric($val) ? (float) $val : $val;
				break;
		}

		return $val;
	}
}