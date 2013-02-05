<?php

class Structure_RestApiExtension extends JJ_RestApiExtension implements TemplateGlobalProvider {

	
	public static $extension_key = 'Structure';

	/**
	 * holds the structured objects
	 *
	 * @static
	 * @var array
	 */
	protected static $structured_objects = array();

	/**
	 * holds the ignore objects
	 *
	 * @static
	 * @var array
	 */
	protected static $ignore_objects = array();

	//public static $default_fields = array();

	//protected static $additional_config = array();

	/*public function add_additional_config($key, $value) {
		self::$additional_config[$key] = $value;
	}

	public function remove_additional_config($key) {
		if (isset(self::$additional_config[$key])) unset(self::$additional_config[$key]);
	}*/

	
	/**
	 * Adds a class to the structure.
	 * 
	 * @param string|array classnames you want to add to the structure.
	 */
	public static function add($objects) {
		self::add_to('structure', $objects);
	}

	/**
	 * Adds a class to the structure ignore-list
	 *
	 * @param string|array object(s) you want to ignore for the structure
	 */
	public static function ignore($objects) {
		self::add_to('ignore', $objects);
	}

	/**
	 * add handler
	 *
	 * @param string list flag
	 * @param string|array object(s)
	 */
	protected static function add_to($list_flag, $objects) {

		// get list
		$list = 'ignore' == $list_flag ? self::$ignore_objects : self::$structured_objects;

		if (!is_array($objects)) {
			$objects = array($objects);
		}

		foreach ($objects as $class) {
			if (!class_exists($class)) {
				user_error("You've added {$class} to JJ_RestApis Structure-Extension. But {$class} doesn't exists.", E_USER_WARNING);
			}
			else if (!array_key_exists($class, $list)) {
				$list[$class] = $class;
			}
		}

		// push back
		if ('ignore' == $list_flag) {
			self::$ignore_objects = $list;
		}
		else {
			self::$structured_objects = $list;
		}
	}


	/**
	 * removes a class from the structure.
	 *
	 * @param string|array object(s)
	 */
	public static function remove($objects) {
		self::remove_from('structure', $objects);
	}

	/**
	 * removes a class from the structureignore ignore-list.
	 *
	 * @param string|array object(s)
	 */
	public static function unignore($objects) {
		self::remove_from('ignore', $objects);
	}


	/**
	 * remove handler
	 *
	 * @param string list flag
	 * @param string|array object(s)
	 */
	protected static function remove_from($list_flag, $objects) {

		// get list
		$list = 'ignore' == $list_flag ? self::$ignore_objects : self::$structured_objects;

		if (!is_array($objects)) {
			$objects = array($objects);
		}

		foreach ($objects as $class) {
			if (array_key_exists($class, $list)) {
				unset($list[$class]);
			}
		}

		// push back
		if ('ignore' == $list_flag) {
			self::$ignore_objects = $list;
		}
		else {
			self::$structured_objects = $list;
		}

	}


	/**
	 * Returns all class-names that are part of the structure.
	 *
	 * @return array
	 */
	public static function get() {
		return self::$structured_objects;
	}


	/**
	 * Request Handler
	 *
	 * @param SS_HTTPRequest $request
	 */
	/*public function handleExtension($request = null) {
		parent::handleExtension();
		return $this->convert($this->getStructure());
	}*/

	/**
	 * returns configuration options for the structure such as @link self::$default_fields
	 *
	 * @return array
	 */
	protected function getStructureConfig() {
		$config = array();

		if (!empty(self::$default_fields)) {
			$config['DefaultFields'] = self::$default_fields;
		}

		// @todo maybe unset ['Fields'] from self::$additional_config and throw an error.
		// use $default_fields instead.
		if (!empty(self::$additional_config)) {
			$config = array_unique(array_merge($config, self::$additional_config));
		}

		return !empty($config) ? array('Config' => $config) : array();
	}

	
	/**
	 * returns the structure as array.
	 *
	 * @param $extension json|xml
	 * @return array
	 */
	public function getData($extension = null) {
		$extension = $extension ? $extension : 'json';
		$objects = is_array(self::$structured_objects) ? array_keys(self::$structured_objects) : array();
		$ignore = is_array(self::$ignore_objects) ? self::$ignore_objects : array();
		
		if (empty($objects)) return $this->isFalse();

		$config = $this->getStructureConfig();
		$config = !empty($config) ? $config : false;

		$structure = array();
		$i = 0;

		while ($i < sizeOf($objects)) {
			$class = $objects[$i];
			//$className = $objs[$i];
			if (!class_exists($class)) {
				user_error("You've added '{$class}' to JJ_RestApis Structure-Extension. But '{$class}' doesn't exists.", E_USER_WARNING);
			}
			if (isset($structure[$class]) || array_key_exists($class, $ignore)) {
				$i++;
				continue;
			}
			
			$obj = singleton($class);

			$relationKeys = array();

			foreach ($obj->getRelationKeys() as $key => $relation) {
				if (!array_key_exists($relation['ClassName'], $ignore)) {
					if (!in_array($relation['ClassName'], $objects)) {
						$objects[] = $relation['ClassName'];
					}
					$relationKeys[] = $relation;
				}
			}

			// relation key for xml formatter
			$structure[$class] = ('xml' == $extension) ? array('relation' => $relationKeys) : $relationKeys;

			$i++;
		}

		$structure = $config ? array_merge(array('Objects' => $structure),  $this->getStructureConfig()) : $structure;

		return $structure;
	}

}