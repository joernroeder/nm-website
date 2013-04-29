<?php

class Structure_RestApiExtension extends JJ_RestApiDataExtension implements TemplateGlobalProvider {

	
	private static $extension_key = 'Structure';

	#public static $cache_key = 'JJ_RestApi_Structure__';

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
	protected static $ignored_objects = array();

	//public static $default_fields = array();

	//protected static $additional_config = array();

	/*public function add_additional_config($key, $value) {
		self::$additional_config[$key] = $value;
	}

	public function remove_additional_config($key) {
		if (isset(self::$additional_config[$key])) unset(self::$additional_config[$key]);
	}*/

	private static $add = array();

	private static $ignore = array();


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

	protected function getCacheKey($extension = 'json') {
		$objects = $this->config()->get('add');
		$ignore = $this->config()->get('ignore');

		$config = $this->getStructureConfig();

		$objectKeys = array_keys($objects);
		sort($objectKeys);

		$ignoreKeys = array_keys($ignore);
		sort($ignoreKeys);

		$configKeys = array_keys($config);
		sort($configKeys);

		$cacheKey = join($objectKeys, '_') . '__2' . join($ignoreKeys, '_') . '__' . join($config, '_') . '_3' . $extension;
		$cacheKey = str_replace('-', '_', Convert::raw2url($cacheKey));

		return md5($cacheKey);
	}

	
	/**
	 * returns the structure as array.
	 *
	 * @param $extension json|xml
	 * @return array
	 */
	public function getData($extension = null) {
		$extension = $extension ? $extension : 'json';
		$cacheKey = $this->getCacheKey($extension);
		$cache = $this->getCache();
		
		if ($data = $cache->load($cacheKey)) {
			$data = unserialize($data);
		}
		else {
			$data = $this->getStructureData($extension);
			$cache->save(serialize($data));
		}

		return $data;
	}

	protected function getStructureData($extension = null) {
		$objects = $this->config()->get('add');
		$ignore = $this->config()->get('ignore');

		if (empty($objects)) return $this->isFalse();

		$config = $this->getStructureConfig();
		$config = !empty($config) ? $config : false;

		$structure = array();
		$i = 0;

		// get classnames array
		//$keys = array_keys($objects);
		$keys = array_merge(array(), $objects);
		while ($i < sizeOf($keys)) {
			$class = $keys[$i];

			if (!class_exists($class)) {
				user_error("You've added '{$class}' to JJ_RestApis Structure-Extension. But '{$class}' doesn't exists.", E_USER_WARNING);
			}
			if (isset($structure[$class]) || array_key_exists($class, $ignore)) {
				$i++;
				continue;
			}
			
			$obj = singleton($class);
			$relationKeys = array();

			foreach ($obj->getStructuralRelationKeys() as $key => $relation) {
				if (!array_key_exists($relation['ClassName'], $ignore)) {
					if (!in_array($relation['ClassName'], $objects)) {
						// update classnames array
						$keys[] = $relation['ClassName'];
						//$keys = array_keys($objects);
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