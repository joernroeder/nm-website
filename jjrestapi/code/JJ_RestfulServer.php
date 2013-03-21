<?php

class JJ_RestfulServer extends RestfulServer {

	static $url_handlers = array(
		'$ClassName/$ID/$Relation' => 'handleAction'
	);

	public static $allowed_actions = array(
		'handleAction',
		'handleExtension'
	);
	
	// ! Static extensions

	public static $default_extension = 'json';

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
		$url_handlers = $this->stat('url_handlers');
		krsort($url_handlers);

		$this->set_stat('url_handlers', $url_handlers);

		return parent::init();
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

	// ! Extensions handling
	public function getExtensions() {
		$subClasses = ClassInfo::subclassesFor('JJ_RestApiExtension');
		$result = array();
		foreach (array_keys($subClasses) as $class) {
			if ('JJ_RestApiExtension' != $class) {
				$result[] = $class;
			}
		}

		return $result;
	}

	// ! HTTP Handling

	public function index($request = null) {
		$extensions = $this->getExtensions();

		$className = $request->param('ClassName');
		$keys = array();

		foreach ($extensions as $extension) {
			// skip disabled extensions
			if (!Config::inst()->get($extension, 'enabled')) continue;

			$key = Config::inst()->get($extension, 'extension_key');
			

			if (!$key) {
				// empty key
				//user_error("", E_USER_WARNING)
			}

			$keys[$extension] = $key;

			if (ClassInfo::exists($key)) {
				$class = new $key();
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
		$sort = '';
		
		if ($this->request->getVar('sort')) {
			$dir = $this->request->getVar('dir');
			$sort = array($this->request->getVar('sort') => ($dir ? $dir : 'ASC'));
		}
		
		$limit = array(
			'start' => $this->request->getVar('start'),
			'limit' => $this->request->getVar('limit')
		);
		
		$params = $this->request->getVars();

		//$extension = $this->request->getExtension();
		//$extension = $extension ? $extension : $this->stat('default_extension');
		
		$responseFormatter = $this->getResponseDataFormatter($className);
		if (!$responseFormatter) return $this->unsupportedMediaType();
		
		// $obj can be either a DataObject or a SS_List,
		// depending on the request
		if ($id) {
			// Format: /api/v1/<MyClass>/<ID>
			$obj = $this->getObjectQuery($className, $id, $params)->First();

			if (!$obj) return $this->notFound();
			if (!$obj->canView()) return $this->permissionFailure();

			// Format: /api/v1/<MyClass>/<ID>/<Relation>
			if ($relationName) {
				$obj = $this->getObjectRelationQuery($obj, $params, $sort, $limit, $relationName);
				if (!$obj) return $this->notFound();
				
				// TODO Avoid creating data formatter again for relation class (see above)
				$responseFormatter = $this->getResponseDataFormatter($obj->dataClass());
			} 
			
		} else {
			// Format: /api/v1/<MyClass>
			$obj = $this->getObjectsQuery($className, $params, $sort, $limit);
		}

		$this->addContentTypeHeader();

		$rawFields = $this->request->getVar('fields');
		$fields = $rawFields ? explode(',', $rawFields) : null;
		$context = $this->getContext();

		if ($obj instanceof SS_List) {
			$fields = singleton($obj->dataClass())->getApiContextFields($context->getOperation(), $context->getSubContext());
			return $responseFormatter->convertDataList($obj, $fields);
		}
		else if (!$obj) {
			// @todo check setTotalSize
			$responseFormatter->setTotalSize(0);
			return $responseFormatter->convertDataList(new ArrayList(), $fields);
		}
		else {
			return $responseFormatter->convertDataObject($obj, $fields);
		}
	}

	// ! Filter/Search

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

		// @todo check that there are no more search params
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
			return DataList::create($className)->byIDs($ids);
		}
		else {
			return $this->getSearchQuery($className, $params, $sort, $limit);	
		}
	}

	protected function getContext($operation = 'view') {
		$context = (string) $this->request->getVar('context');

		return JJ_ApiContext::create_from_string($context);
		#return strpos($context, '.') !== false ? JJ_ApiContext::create_from_string($context) : JJ_ApiContext::create_from_string($operation, $context);
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

		#$fields = $sing->getApiContextFields($context->getOperation(), $context->getSubContext());

		// @todo rename method
		if ($sing->hasMethod('getRestfulSearchContext')) {
			$searchContext = $sing->{'getRestfulSearchContext'}();
		}
		else {
			$searchContext = $sing->getApiSearchContext($context->getOperation(), $context->getSubContext());
		}
		
		return $searchContext->getQuery($params, $sort, $limit, $existingQuery);
	}

}