<?php
/**
 * @package jjrestapi
 * @subpackage formatters
 */
class JJ_XMLDataFormatter extends XMLDataFormatter implements JJ_DataFormatter {

	protected $outputContentType = 'application/xml';

	/**
	 * Set priority from 0-100.
	 * If multiple formatters for the same extension exist,
	 * we select the one with highest priority.
	 *
	 * Set to 60 to be higher than XMLDataFormatter, cool!
	 *
	 * @var int
	 */
	public static $priority = 60;

	/**
	 *
	 * @var string
	 */
	//public static $href_extension = 'xml';

	public function supportedExtensions() {
		return array(
			'xml'
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
	 * cache wrapper
	 *
	 * @todo maybe we'll have to reimplement $this->relationDepth, but i'm not sure if we really need it.
	 */
	/*public function convertDataObjectWithoutHeader(DataObject $obj, $fields = null, $relations = null, $depth = 0) {
		return $this->_convertDataObjectWithoutHeader($obj, $fields, $relations, $depth);
	}*/

	/**
	 *
	 * @param string $depth depth indicator.
	 * @todo restrict $depth with <= this->relationDepth
	 */
	public function convertDataObjectWithoutHeader(DataObject $obj, $fields = null, $relations = null, $depth = 0) {

		//print_r("depth: $depth\n");
		$depth++;

		$className = $obj->class;
		$id = $obj->ID;

		$href_appendix = '.xml';// . self::$href_extension;
		$objHref = Director::absoluteURL($this->stat('api_base') . "$obj->class/$obj->ID");
	
		//$xml = "<$className href=\"$objHref{$href_appendix}\">\n";
		$xml = "<$className>";

		foreach($obj->getApiFields($fields) as $fieldName => $fieldType) {
			
			// Field filtering by key
			if (!$this->getBase()->fieldFilter($fieldName, $fields)) continue;

			// it's an object field
			if (is_string($fieldType)) {
				//it's a relation without specified key -> return only id(s)
				if (in_array($fieldType, self::$relation_types)) {
					$rel = $this->getBase()->getRelation($obj, $fieldName, $fieldType);
					if (!$rel) continue;
					$fieldValue = ($rel instanceOf DataList) ? $rel->getIDList() : (int) $rel->ID;
					if (is_array($fieldValue)) {
						foreach ($fieldValue as $v) {
							$xml .= "<$fieldName>$v</$fieldName>";
						}
					} else {
						$xml .= "<$fieldName>$fieldValue</$fieldName>";
					}
				} else {
					$fieldValueObj = $obj->obj($fieldName);
					//$fieldValue = $obj->$fieldName;
					$fieldValue = $fieldValueObj->getValue();
					
					if(!mb_check_encoding($fieldValue,'utf-8')) $fieldValue = "(data is badly encoded)";
					
					if(is_object($fieldValueObj) && is_subclass_of($fieldValueObj, 'Object') && $fieldValueObj->hasMethod('toXML')) {
						$xml .= $fieldValueObj->toXML();
					} else {
						if('HTMLText' == $fieldType) {
							// Escape HTML values using CDATA
							$fieldValue = sprintf('<![CDATA[%s]]>', str_replace(']]>', ']]]]><![CDATA[>', $fieldValue));
						} else {
							$fieldValue = Convert::raw2xml($this->getBase()->castFieldValue($fieldValueObj, 'xml'));
						}
						$xml .= "<$fieldName>$fieldValue</$fieldName>";
					}
				}
			}
			// it's a relation field
			else if (is_array($fieldType) && isset($fieldType['ClassName'])) {
				
				$rel = $this->getBase()->getRelation($obj, $fieldName, $fieldType['Type']);
				
				if (!$rel) continue;

				// update fields

				// has_many, many_many
				if ($rel instanceOf DataList) {

					if ($rel->exists()) {
						$xml .= "<$fieldName linktype=\"{$fieldType['type']}\" href=\"$objHref/$fieldName{$href_appendix}\">";
						
						foreach ($rel as $r) {
							$xml .= $this->convertDataObjectWithoutHeader($r, $fieldType['Fields'], null, $depth);
						}

						$xml .= "</$fieldName>";
					}
				}
				// has_one, belongs_to
				else {
					$xml .= "<$fieldName linktype=\"{$fieldType['type']}\" href=\"$objHref/$fieldName{$href_appendix}\">";
					$xml .= $this->convertDataObjectWithoutHeader($rel, $fieldType['Fields'], null, $depth);
					$xml .= "</$fieldName>";
				}
			}
		}

		$xml .= "</$className>";

		return $xml;
	}

	/**
	 * converts an object to a xml node. keys are limited
	 *
	 * @param object $obj
	 * @param array $keys
	 * @return json object
	 */
	function convertObj(DataObject $obj, $keys = null) {
		$root = $obj && isset($obj->ClassName) ? $obj->ClassName : 'root';
		
		if (!$obj || !is_array($obj)) return "<$root></$root>";

		$xml = "<$root>";

		foreach ($obj as $fieldName => $fieldValue) {
			$fieldValue = Convert::raw2xml($fieldValue);

			if (is_array($fieldValue)) {
				$xml .= $this->convertArray($fieldValue, $fieldName);
				//print_r($fieldValue);
			}
			else {
				$xml .= $this->getKeyValuePair($fieldName, $fieldValue);
			}
		}

		$xml .= "</$root>";

		return $xml;
	}

	public function getDataList(SS_List $list, $fields = null) {

	}

	/**
	 * Generate a XML representation of the given {@link SS_List}.
	 * 
	 * @todo implementation
	 *
	 * @param SS_List $set
	 * @return String xml
	 */
	public function convertDataList(SS_List $set, $fields = null) { 
		$dataClass = $set->dataClass;
		user_error("convert DataLists to xml isn't implemented yet.", E_USER_NOTICE);

		return "<$dataClass></$dataClass>";
	}

	/**
	 * returns a key value pair as xml node (<key>value</key>)
	 * or an empty string if {@link self::$exclude_empty_fields} is set to true
	 *
	 * @param string key
	 * @param string value
	 *
	 * @return string xml node
	 */
	protected function getKeyValuePair($key, $value) {
		if (self::$exclude_empty_fields && empty($value)) return '';

		return "<$key>$value</$key>";
	}

	/**
	 * converts an array to a xml structure
	 *
	 * @param array arr
	 * @param key
	 * @param wrapper
	 *
	 * @return string xml structure
	 */
	protected function convertArray($arr, $name, $wrap = false) {
		$xml = "";

		if (is_array($arr)) {
			$arrKeys = array_keys($arr);

			if (!$wrap) {
				$xml .= "<$name>";
			}

			// is associative array
			// http://stackoverflow.com/questions/173400/php-arrays-a-good-way-to-check-if-an-array-is-associative-or-numeric
			if ($arrKeys !== range(0, count($arr) - 1)) {
				foreach ($arr as $arrKey => $arrVal) {
					$xml .= $this->convertArray($arrVal, $arrKey, true);
				}
			}
			else {
				foreach ($arr as $arrKey => $arrVal) {
					$xml .= $this->convertArray($arrVal, $name, false);
				}
			}

			if (!$wrap) {
				$xml .= "</$name>";
			}

		} else {
			$xml .= $this->getKeyValuePair($name, $arr);
		}

		return $xml;
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