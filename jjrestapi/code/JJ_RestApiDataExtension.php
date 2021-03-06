<?php

class JJ_RestApiDataExtension extends Object {

	/**
	 * is readonly through api calls
	 *
	 * @todo test this
	 * @var boolean
	 */
	protected $isReadOnly = true;


	/**
	 * Use the template key to make your extension accessable in as Template-Var
	 * 
	 * @example
	 * // in your extension
	 * self::$template_key = 'Foo'
	 *
	 * // in your template
	 * $JJ_RestApi.Foo
	 *
	 * @static
	 * @var string
	 */
	private static $extension_key = '';


	/**
	 * Enabled flag
	 *
	 * @static
	 * @var bool
	 */
	private static $enabled = true;

	/**
	 * Defines whether data should be cached or not
	 *
	 * @static
	 * @var bool
	 */
	private static $use_cache = true;	


	/**
	 * owner, ussually a JJ_RestfulServer instance
	 * 
	 * @var JJ_RestfulServer
	 */
	protected $owner = null;


	/**
	 * registers your {@link self::$template_key} as global variable
	 *
	 * @return array
	 */
	public static function get_template_global_variables() {
		$called_class = get_called_class();
		$class = get_class();

		if ($called_class == $class) return array();

		// get template key from subclass
		$extensionKey = self::extension_key();
		
		if ($extensionKey) {
			return array(
				$extensionKey => 'for_template'
			);
		}
		else {
			return array();
		}
	}


	/**
	 * returns the structure in a script tag for the template.
	 *
	 * @todo make this a non-static method
	 * @return string
	 */
	public static function for_template() {
		$self = self::create();
		$extension = JJ_DataElement::get_default_extension();
		$elementKey = strtolower(self::extension_key());

		return new JJ_DataElement($elementKey, $self->getData($extension), $extension);
	}


	/**
	 * returns the extension data to the API
	 *
	 * @param JJ_RestfulServer
	 * @return string json|xml representation
	 */
	public static function for_api(JJ_RestfulServer $restfulServer) {
		$self = self::create($restfulServer);
		$self->handleExtension();

		$extensions = $self->getOwner()->getResponseFormatter()->supportedExtensions();
		$extension = !empty($extensions) ? $extensions[0] : $self->getOwner()->stat('default_extension');

		$fields = $self->getFields($self->stat('api_access'));

		$data = $self->cachedOrGetData($extension);

		return $self->convert($data, $fields);
	}


	/**
	 *
	 * @return JJ_RestApiExtension
	 */
	public static function create($restfulServer = null) {
		$className = get_called_class();
		$self = new $className();
		
		if ($restfulServer) {
			$self->owner = $restfulServer;
		}

		return $self;
	}


	/**
	 * returns the extension key defined in a subclass
	 *
	 * @return string extension key
	 */
	public static function extension_key() {
		return Config::inst()->get(get_called_class(), 'extension_key');
	}


	// -------------------------------------------------------------------


	public function getOwner() {
		if (!$this->owner) {
			$this->owner = new JJ_RestfulServer();
		}

		return $this->owner;
	}


	/**
	 * abstract handle method.
	 * call parent::handle() for security and response header in your sub-class
	 *
	 */
	public function handleExtension($request = null) {
		
		// find handler
		if (!$this->getOwner()->getResponseFormatter()) {
			return $this->getOwner()->unsupportedMediaType();
		}

		// check read only
		if ($this->isReadOnly && !($this->getOwner()->request->isGET() || $this->getOwner()->request->isHEAD())) {
			return $this->getOwner()->isReadOnly();	
		}

		// set output headers
		$this->getOwner()->addContentTypeHeader();
	}


	public function convert($data, $fields = null) {
		return $this->getOwner()->getResponseFormatter()->convert($data, $fields);
	}

	public function cachedOrGetData($extension = null) {
		$use_cache = Config::inst()->get(get_called_class(), 'use_cache');

		$data = null;
		$save_to_cache = false;

		if ($use_cache) {
			$extension = $extension ? $extension  :'json';
			$cacheKey = $this->getCacheKey($extension);
			$cache = $this->getCache();

			if ($data = $cache->load($cacheKey)) {
				$data = unserialize($data);
			} else {
				$save_to_cache = true;
			}
		}

		if (!$data) {
			$data = $this->getData($extension);
		}

		if ($use_cache && $save_to_cache) {
			$cache->save(serialize($data));
		}

		return $data;	
	}

	public function getData($extension = null) {
		return array();
	}


	public function getContext() {
		return 'view';
	}


	public function getFields($api_access = array(), $context = null) {
		$fields = null;
		$context = $context ? $context : $this->getContext();

		// api access fields defined. going to check context
		if (!empty($api_access)) {
			if (!isset($api_access[$context])) {
				user_error("You have defined your api-fields throught the static \$api_access but there is no context $context", E_USER_WARNING);
			}
			else {
				$fields = $api_access[$context];
			}
		}

		return $fields;
	}

	public function getCache() {
		return SS_Cache::factory(JJ_RestfulServer::get_cache_prefix() . self::extension_key() . '_');
	}

	/**
	 * gets the key for caching. Default is a md5 of $extension_key . $extension
	 * @param  String $extension json|xml
	 * @return String
	 */
	public function getCacheKey($extension) {
		$key = $this->config()->get('extension_key');
		return md5($extension . '.' . $key);
	}

}

