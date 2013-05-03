<?php

class JJ_RestfulServer extends RestfulServer {

	private static $url_handlers = array(
		'$ClassName/$ID/$Relation' => 'handleAction'
	);

	private static $allowed_actions = array(
		'handleAction',
		'handleExtension'
	);
	
	// ! Static extensions

	private static $default_extension = 'json';

	private static $cache_prefix = 'JJ_RestApi_';

	private static $search_and		= ';';
	private static $search_or		= '|';
	private static $search_equals	= ':'; 

	/**
	 * Populates fields for "non-model" requests such as Security, User, Base etc.
	 * Can be used by adding the following code to your _config.php
	 *
	 * @example
	 * JJ_RestfulServer::add_fields('module-key', array(
	 *     'fieldName'
	 * ));
	 *
	 * @static
	 * @var array
	 */
	protected static $fields = array();

	public static function get_cache_prefix() {
		return self::$cache_prefix;
	}
	/**
	 * @todo check fields
	 * @todo merge with existing fields
	 * @static
	 */
	public static function add_fields($key, $fields) {
		self::$fields[$key] = $fields;
	}

	/**
	 * @todo check fields
	 * @static
	 */
	public static function remove_fields($key, $fields = array()) {
		if (isset(self::$fields[$key])) {
			$foo = array_intersect(self::$fields[$key], $fields);
			print_r($foo);
			unset($foo);
			//unset(self::$fields[$key]);
		}
	}

	/**
	 * @todo check fields
	 * @static
	 */
	public static function fields($key = '') {
		if ($key) {
			return isset(self::$fields[$key]) ? self::$fields[$key] : array();
		}
		else {
			return self::$fields;
		}
	}

	/**
	 * we have to sort the url_handler keys to be sure that 
	 * $ClassName/$ID/$Relation is the last rule in the list 
	 * and extension handler will be processed before.
	 *
	 */
	function init() {
		parent::init();
		// check Security token
		if (!CSRFProtection_RestApiExtension::compare_request($this->getRequest())) return $this->httpError(400, "Security token doesn't match.");

		$url_handlers = $this->stat('url_handlers');
		krsort($url_handlers);

		$this->set_stat('url_handlers', $url_handlers);
	}

	// ! ResponseFormatter

	/**
	 * response formatter json/xml
	 *
	 * @var DataFormatter
	 */
	protected $responseFormatter = null;

	public function getResponseFormatter() {
		if (!$this->responseFormatter) {
			$this->setResponseFormatter();
		}

		return $this->responseFormatter;
	}

	public function setResponseFormatter($extension = null) {
		if ($extension) {
			$this->responseFormatter = DataFormatter::for_extension($extension);
		} else {
			$this->responseFormatter = $this->getDataFormatterByExtension(true);
		}

		return $this->responseFormatter;
	}

	/**
	 * returns the DataFormatter by extension.
	 * checks the accepted mime-types header
	 *
	 * @param bool $includeAcceptHeader
	 * @return DataFormatter
	 */
	public function getDataFormatterByExtension($includeAcceptHeader = false) {
		$extension = $this->request->getExtension();
		$accept = $this->request->getHeader('Accept');
		$mimetypes = $this->request->getAcceptMimetypes();
		$contentTypeWithEncoding = $this->request->getHeader('Content-Type');
		$formatter = false;
		
		preg_match('/([^;]*)/',$contentTypeWithEncoding, $contentTypeMatches);
		$contentType = $contentTypeMatches[0];

		// get formatter
		if (!empty($extension)) {
			$formatter = DataFormatter::for_extension($extension);
		}
		elseif ($includeAcceptHeader && !empty($accept) && $accept != '*/*') {
			$formatter = DataFormatter::for_mimetypes($mimetypes);
		}
		elseif (!empty($contentType)) {
			$formatter = DataFormatter::for_mimetype($contentType);
		}
		
		return $formatter ? $formatter : DataFormatter::for_extension(self::$default_extension);
	}

	/**
	 * adds the current content type as to the response 
	 *
	 */
	public function addContentTypeHeader() {
		$contentType = $this->getResponseFormatter()->getOutputContentType() . '; charset="utf-8"';
		$response = $this->getResponse();

		$response->removeHeader('Content-Type');
		$response->addHeader('Content-Type', $contentType);
	}

	/**
	 * adds the current content type as to the response 
	 *
	 */
	public function addNotModifiedHeader($result, $cacheData) {
		$response = $this->getResponse();
		$response->setStatusCode(304);
		$etag = md5($result);
		
		$response->removeHeader('Cache-Control');

		$response->addHeader('Etag', $etag);
		$response->addHeader('Last-Modified', gmdate("D, d M Y H:i:s", $cacheData['mtime']) . ' GMT'); 
	}

	// ! Extensions handling
	public function getSubclasses($className) {
		if (!$className) return false;
		$subClasses = ClassInfo::subclassesFor($className);
		$result = array();
		foreach (array_keys($subClasses) as $class) {
			if ($className != $class) {
				$result[] = $class;
			}
		}

		return $result;
	}

	// ! HTTP Handling

	public function index(SS_HTTPRequest $request = null) {

		// check if the ClassName points to a DataExtension
		$extensions = $this->getSubclasses('JJ_RestApiDataExtension');
		$className = $request->param('ClassName');
		$keys = array();

		foreach ($extensions as $extension) {

			// skip disabled extensions
			if (!Config::inst()->get($extension, 'enabled')) continue;

			// skip abstract classes
			/*$refl = new ReflectionClass($extension);
			if ($refl->isAbstract()) continue;*/

			$key = Config::inst()->get($extension, 'extension_key');
			

			if (!$key) {
				// empty key
				//user_error("", E_USER_WARNING)
			}

			$keys[$extension] = $key;

			if (ClassInfo::exists($key)) {
				$class = $key::create($this);
				$api_access = $class->stat('api_access');

				// check api_access of DataObject and throw error if nessessary
				// 
				// @todo check $api_access in extension here!
				if (false !== $api_access || !empty($api_access)) {
					// Du hast eine Erweiterung (name) erstellt, die unter /foo zu erreichen ist. Es gibt aber auch eine Classe Foo, die über die API auf dem gleichen Pfad zu erreichen ist.
					//
					//user_error("You've created an extension {$extension} . But {$class} doesn't exists.", E_USER_WARNING)
				}
			}

			if ($className == $keys[$extension]) {
				// @todo
				//$inst->handleExtension($request);
				return $extension::for_api($this);
			}
		}

		return parent::index();
	}
	/**
	 * Handler for object read.
	 * 
	 * @todo Access checking
	 * @todo check sort, limit
	 * 
	 * @param String $className
	 * @param Int $id
	 * @param String $relation
	 * @return String The serialized representation of the requested object(s) - usually XML or JSON.
	 */
	protected function getHandler($className, $id, $relationName) {
		$sort = array();
		
		if ($this->request->getVar('sort')) {
			$dir = $this->request->getVar('dir');
			$sort = array($this->request->getVar('sort') => ($dir ? $dir : 'ASC'));
		}
		
		$limit = array(
			'start' => $this->request->getVar('start'),
			'limit' => $this->request->getVar('limit')
		);
		
		$params = $this->request->getVars();
		$urlSearchString = $this->getSearchString($params);

		if ($urlSearchString) {
			$params = $this->urlSearchStringToArray($urlSearchString);
		}

		//$extension = $this->request->getExtension();
		//$extension = $extension ? $extension : $this->stat('default_extension');
		$responseFormatter = $this->getResponseDataFormatter($className);
		if (!$responseFormatter) return $this->unsupportedMediaType();
		
		// $obj can be either a DataObject or a SS_List,
		// depending on the request
		if ($id) {
			// Format: /api/v1/<MyClass>/<ID>
			$obj = $this->getObjectQuery($className, array($id), $params)->first();

			if (!$obj) return $this->notFound();
			if (!$obj->canView()) return $this->permissionFailure();

			
		} else {
			// Format: /api/v1/<MyClass>
			$obj = $this->getObjectsQuery($className, $params, $sort, $limit);
		}

		$this->addContentTypeHeader();

		$rawFields = $this->request->getVar('fields');
		$fields = $rawFields ? explode(',', $rawFields) : null;
		$context = $this->getContext($obj);

		// check cached $obj
		// if ($currentCacheKey_json)
		
		$md5Obj = md5($obj);
		$md5Fields = md5($fields);
		$md5Context = md5($context->getContext());
		$md5ResponseFormatter = md5($responseFormatter->class);
		$currentUserId = (int) Member::currentUserId();

		$cacheKey = md5($md5Obj . '_' . $id . '_' . $md5Fields . '_' . $md5Context . '_' . $md5ResponseFormatter . '_' . $currentUserId) . '_formatted';
		$cache = SS_Cache::factory(self::$cache_prefix . $className . '_');
		$result = $cache->load($cacheKey);

		if ($result) {
			$result = unserialize($result);
		}
		else {
			if ($obj instanceof ArrayList) {
				$result = $responseFormatter->convertDataList($obj, $fields, $context);
			}
			else if (!$obj) {
				// @todo check setTotalSize
				$responseFormatter->setTotalSize(0);
				$result = $responseFormatter->convertDataList(new ArrayList(), $fields);
			}
			else {
				$result = $responseFormatter->convertDataObject($obj, $fields, $context);
			}
		
			$cache->save(serialize($result));
		}

		return $result;
	}

	// ! Filter/Search

	/**
	 * Gets a single DataObject by ID,
	 * through a request like /api/v1/<MyClass>/<MyID>
	 * 
	 * @param string $className
	 * @param int $id
	 * @param array $params
	 * @return DataList
	 */
	protected function getObjectQuery($className, $ids, $params) {
		$cacheKey =  md5(implode('_', array_merge($ids, $params))) . '_ObjectQuery';
		$cache = SS_Cache::factory(self::$cache_prefix . $className . '_');
		$result = $cache->load($cacheKey);

		if ($result) {
			$result = unserialize($result);
		}
		else {
			$result = DataList::create($className)->byIDs($ids);
			$result = $result->toArray();
			$cache->save(serialize($result));
		}


	    return new ArrayList($result);
	}

	/**
	 * returns the ObjectsQuery
	 * filter Objects by id if param?ids=1,2 is set.
	 *
	 * @todo redirect to className/id if just one id set.
	 * @todo check limit
	 * @todo check sort
	 *
	 * @param DataObject $obj
	 * @param array $params
	 * @param int|array $sort
	 * @param int|array $limit
	 * @return SQLQuery
	 */
	protected function getObjectsQuery($className, $params, $sort, $limit) {
		$ids = array();

		// @todo: check that there are no more search params
		if (isset($params['ids']) && !empty($params['ids'])) {
			$pIds = explode(',',$params['ids']);

			foreach ($pIds as $id) {
				$id = (int) $id;

				if ($id) {
					$ids[] = $id;
				}
			}
		}

		if (!empty($ids)) {
			// @todo: check cache
			return $this->getObjectQuery($className, $ids, $params);
		}
		else {
			return $this->getSearchQuery($className, $params, $sort, $limit);	
		}
	}

	protected function getContext($obj = null) {
		$context = (string) $this->request->getVar('context');	
		if ($context) {
			return JJ_ApiContext::create_from_string($context);
		}

		if ($obj instanceof SS_List) $obj = $obj->first();
		if ($obj) {
			return $obj->getApiContext();
		}
		return JJ_ApiContext::create_from_string();
	}

	protected function getSearchString($params = null) {
		$params = $params ? $params : $this->request->getVars();
		$searchString = '';

		if (isset($params['s'])) {
			$searchString = $params['s'];
		}
		else if (isset($params['search'])) {
			$searchString = $params['search'];
		}
		
		return $searchString;
	}

	/**
	 * Uses the default {@link SearchContext} specified through
	 * {@link DataObject::getDefaultSearchContext()} to augument
	 * an existing query object (mostly a component query from {@link DataObject})
	 * with search clauses. 
	 * 
	 * @todo Allow specifying of different searchcontext getters on model-by-model basis
	 *
	 * @param string $className
	 * @param array $params
	 * @return SS_List
	 */
	protected function getSearchQuery($className, $params = null, $sort = null, $limit = null, $existingQuery = null) {
		$context = $this->getContext();
		$sing = singleton($className);

		//$searchString = isset($params['search']) ? (String) $params['search'] : '';
		//$searchArray = $this->urlSearchStringToArray($searchString);
		//$result = $searchContext->getQuery($searchArray, $sort, $limit, $existingQuery);




		// @todo rename method
		if ($sing->hasMethod('getApiCustomSearchContext')) {
			$searchContext = $sing->getApiCustomSearchContext($context);
		}
		else {
			$searchContext = $sing->getApiSearchContext($context);
		}

		$cacheKey = $this->getSearchQueryCacheKey($searchContext, $context, $params, $sort, $limit, $existingQuery);
		$cache = SS_Cache::factory(self::$cache_prefix . $className . '_');
		$result = $cache->load($cacheKey);

		//$this->currentCache = $cache;
		/*if (Director::isDev()) {
			$result = false;
		}*/

		if ($result) {
			$result = unserialize($result);
		}
		else {
			$result = $searchContext->getQuery($params, $sort, $limit, $existingQuery);
			$result = $result->toArray();
			$cache->save(serialize($result));
		}

		return new ArrayList($result);
		//return $result;
	}

	// this could be an extension for SearchContext
	/*protected function getCachedSearchQuery($className, $params = null, $sort = null, $limit = null, $existingQuery = null) {

	}*/


	/**
	 * calculates a unique cache key for the given params
	 * 
	 * @todo implement $existingQuery
	 * 
	 * @param  SearchContext 	$searchContext
	 * @param  array			$searchParams 
	 * @param  boolean			$sort
	 * @param  boolean			$limit
	 * @param  [type]			$existingQuery
	 * 
	 * @return string	generated cache key
	 */
	protected function getSearchQueryCacheKey($searchContext, $context, $searchParams, $sort = array(), $limit = false, $existingQuery = null) {
		$cacheKey = $searchContext->class . '_' . $context->getContext() . '_' . Member::currentUserID() . '_';

		if (isset($searchParams['url'])) {
			unset($searchParams['url']);
		}

		$paramsLimit = array_merge($searchParams, $sort, $limit);

		foreach ($paramsLimit as $key => $value) {
			$cacheKey .= '-' . $key .'_' . $value;
		}

		// @todo replace . and - via regular expression
		return md5($cacheKey) . '_SearchQuery';
	}

	/**
	 * transforms a search string in JJ_Fashion (i.e. "Title=foo|bar+Content=foobar") to an associative array
	 * @param  String $s
	 * @return array	transformed array (default empty)
	 */
	protected function urlSearchStringToArray($searchString) {
		$result	= array();

		// split it up by 'and'
		foreach (explode(self::$search_and, $searchString) as $el) {
			if (!$el) continue;
			// split it up again
			$eq = explode(self::$search_equals, $el);
			// set key
			$key = Convert::raw2sql($eq[0]);

			if (count($eq) < 2) {
				// throw warning
				user_error("No value specified for search key {$key}", E_USER_WARNING);
			}
			else {
				$va = explode(self::$search_or, $eq[1]);
				
				if (count($va) == 1) {
					$value = Convert::raw2sql($va[0]);
				}
				else {
					$value = array();
					foreach ($va as $v) {
						$value[] = Convert::raw2sql($v);
					}
				}
			}

			$result[$key] = $value;
		}
	
		return $result;
	}

}

