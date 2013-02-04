<?php

class JJ_RestApiExtension extends Object {

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
	public static $extension_key = '';


	/**
	 * Enabled flag
	 *
	 * @static
	 * @var bool
	 */
	public static $enabled = true;

	/**
	 *
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
		$extension = JJ_DataElement::$default_extension;
		$elementKey = strtolower(self::extension_key());

		return new JJ_DataElement($elementKey, $self->getData($extension), $extension);
	}

	
	/*public static function for_template() {
		$self = self::create();
		
		return $self->convert($self->getData());
	}*/

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

		$api_access = $self->stat('api_access');
		$fields = array();
		$context = $self->getContext();

		if (!isset($api_access[$context])) {
			user_error('Kein Context definiert.', E_USER_WARNING);
		}
		else {
			$fields = $api_access[$context];
		}

		return $self->convert($self->getData($extension), $fields);
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

	public function getData($extension = null) {
		return array();
	}

	public function getContext() {
		return Member::CurrentUserID() ? 'view.logged_in' : 'view';
	}

	/**
	 * returns the options for a Object
	 *
	 * @param string objName
	 * @param string context -> api_access key (view/edit/delete etc)
	 *
	 * @return object
	 */
	/*function getOptionsFor($objName, $context) {
		$opts = new stdClass();

		$opts->context = $context;
		$opts->fields = $this->getOwner()->getResponseFormatter()->getBase()->getFields($objName, $context);
		$opts->extension = $this->getOwner()->getResponseFormatter()->stat('href_extension');

		return $opts;
	}*/

	/**
	 *
	 * @link JJ_RestApiExtension->getOptions()
	 * 
	 * @param object Object
	 * @param object Options
	 *
	 * @return object
	 */
	/*function toApiObject($obj, $opts) {
		return $obj->toApiObject($opts->context, $opts->extension, $opts->fields);
	}*/

	/**
	 * returns "false" formatted by the current datatype json/xml
	 */
	/*function returnFalse() {
		return $this->getOwner()->getResponseFormatter()->convertObj(false);
	}*/

	/**
	 * returns "true" formatted by the current datatype json/xml
	 *
	 * @todo implement it. it's only a dummy function at the moment
	 */
	/*function returnTrue() {
		return ''; //$this->getOwner()->getResponseFormatter()->convertObj(true);
	}*/
}