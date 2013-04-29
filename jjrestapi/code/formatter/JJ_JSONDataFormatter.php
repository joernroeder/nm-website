<?php
/**
 * @package jjrestapi
 * @subpackage formatters
 */
class JJ_JSONDataFormatter extends JSONDataFormatter implements JJ_DataFormatter {

	protected $outputContentType = 'application/json';
	
	/**
	 * Set priority from 0-100.
	 * If multiple formatters for the same extension exist,
	 * we select the one with highest priority.
	 *
	 * Set to 60 to be higher than JSONDataFormatter, cool!
	 *
	 * @var int
	 */
	private static $priority = 60;

	/**
	 *
	 * @var string
	 */
	//public static $href_extension = 'json';

	public function supportedExtensions() {
		return array(
			'json'
		);
	}

	/**
	 *
	 * @var object JJ_BaseDataFormatter
	 */
	protected $baseFormatter = null;

	/**
	 * returns and creates the JJ_BaseDataFormatter
	 *
	 * @return JJ_BaseDataFormatter
	 */
	public function getBase() {
		if (!$this->baseFormatter) {
			$this->baseFormatter = new JJ_BaseDataFormatter($this);
		}

		return $this->baseFormatter;
	}

	/**
	 * Internal function to do the conversion of a single data object. It builds an empty object and dynamically
	 * adds the properties it needs to it. If it's done as a nested array, json_encode or equivalent won't use
	 * JSON object notation { ... }.
	 *
	 * @todo make __call("get{$fieldName}) working
	 *
	 * @param DataObjectInterface $obj
	 * @param  $fields
	 * @param  $relations // it seems like we don't use this!
	 * @return EmptyJSONObject
	 */
	public function convertDataObjectToJSONObject(DataObjectInterface $obj, $fields = null, $relations = null, $depth = 0) {
		
		if(!$obj->canView()) return false;

		$depth++;

		$className = $obj->class;
		$id = $obj->ID;

		$objHref = Director::absoluteURL($this->stat('api_base') . "$obj->class/$obj->ID");
		$serobj = ArrayData::array_to_object();

		foreach ($obj->getApiFields($fields) as $fieldName => $fieldType) {
						
			// Field filtering by key
			//if (!$this->getBase()->fieldFilter($fieldName, $apiFields)) continue;

			// it's an object field
			if (is_string($fieldType)) {

				//check if it's a relation without specified array => get only ids
				if (in_array($fieldType, $this->getBase()->getRelationTypes())) {
					$rel = $obj->getRelation($fieldName, $fieldType);
					//$rel = $this->getBase()->getRelation($obj, $fieldName, $fieldType);
					if (!$rel) continue;

					$serobj->$fieldName = ($rel instanceOf DataList) ? array_keys($rel->getIDList()) : (int) $rel->ID;

				} else {

					// check if we defined a function get$fieldName in the formatter and use it instead getting the value from the object.
					// this hook is used for the objects href-attribute.
					
					//$fieldValue = $this->hasMethod("get{$fieldName}") ? $this->__call("get{$fieldName}", array($obj, $fieldName)) : $obj->$fieldName;
					$fieldValue = 'Href' == $fieldName ? $this->getHref($obj) : $obj->obj($fieldName);
					
					// cast value
					if (null !== $fieldValue) {

						$val = $this->getBase()->castFieldValue($fieldValue);
						
						if ($obj->stat('api_exclude_empty_fields') !== false) {
							if ($val !== null) {
								$serobj->$fieldName = $val;	
							}
						}
						else {
							$serobj->$fieldName = $val;
						}
					}
				}
			} else if (is_array($fieldType) && isset($fieldType['ClassName'])) {
				$rel = $obj->getRelation($fieldName, $fieldType['Type']);
			
				if (!$rel || $rel->ID === 0) continue;

				// has_many, many_many
				if ($rel instanceOf DataList) {

					if ($rel->exists()) {
						$rels = array();
						
						foreach ($rel as $r) {
							$rels[] = $this->convertDataObjectToJSONObject($r, $fieldType['Fields'], null, $depth);
						}

						$serobj->$fieldName = $rels;
					}
				}
				// has_one, belongs_to
				else {
					$serobj->$fieldName = $this->convertDataObjectToJSONObject($rel, $fieldType['Fields'], null, $depth);
				}
			}
		}

		return $serobj;
	}

	/**
	 * converts an object to a json object.
	 *
	 * @todo implement keys
	 *
	 * @param object $obj
	 * @param array $keys
	 *
	 * @return json object
	 */
	public function convertObj($obj, $keys = null) {

		if (is_array($keys)) {
			$keykeys = array();

			foreach($keys as $key) {
				$keykeys[$key] = $key;
			}

			$obj = array_intersect_key($obj, $keykeys);
		}

		return Convert::array2json($obj);
	}

	/**
	 *
	 *
	 */
	public function getDataList(SS_List $set, $fields = null) {
		$items = array();

		foreach ($set as $do) {
			$obj = $this->convertDataObjectToJSONObject($do, $fields);
			
			if ($obj) {
				$items[] = $obj;
			}
		}

		return $items;
	}

	/**
	 * Generate a JSON representation of the given {@link SS_List}.
	 * 
	 * @param SS_List $set
	 * @return String json
	 */
	public function convertDataList(SS_List $set, $fields = null) {
		$this->setRemoveFields(array(
			'ClassName'
		));

		$items = $this->getDataList($set, $fields);

		$serobj = ArrayData::array_to_object(array(
			'Items' => $items
		));

		return Convert::array2json($serobj->Items);
	}


	/**
	 *
	 *
	 */
	public function convert($data, $fields = null) {
		if ($data instanceof SS_List) {
			return $this->convertDataList($data, $fields);
		}
		else if ($data instanceof DataObject) {
			return $this->convertDataObject($data, $fields);
		}
		else {
			return $this->convertObj($data, $fields);
		}
	}


}