<?php

class CSRFProtection_RestApiExtension extends JJ_RestApiDataExtension implements TemplateGlobalProvider {

	public static $extension_key = 'SecurityID';

	/**
	 * key of POST var which may store the token
	 * @var string
	 */
	public static $var_name = 'SecurityID';

	/**
	 * key of request header which may store the token
	 * @var string
	 */
	public static $request_header_name = 'X-Csrf-Token';

	/**
	 * holds our token instance
	 * @var SecurityToken
	 */
	public static $token_inst = null;

	/**
	 * defines which http methods to check token against
	 * @var array
	 */
	public static $enabled_for = array(
		'HEAD'	=> false,
		'GET'	=> false,
		'POST'	=> false,
		'PUT'	=> false,
		'DELETE'=> false,
		'PATCH'	=> false	
	);

	/**
	 * gets the SecurityToken instance
	 * @return SecurityToken
	 */
	public static function token() {
		if (!self::$token_inst) self::$token_inst = new SecurityToken();
		return self::$token_inst;
	}

	/**
	 * sets self::$enabled_for
	 * @param [string | array] 	$httpMethods
	 * @param [boolean] 		$bool  value to set
	 */
	protected static function set_enabled_for($httpMethods, $bool) {
		$httpMethods = is_string($httpMethods) ? array($httpMethods) : $httpMethods;
		if (!is_array($httpMethods)) user_error("Request type '{$requestType}' must be string or array", E_USER_WARNING);
		foreach ($httpMethods as $type) {
			if (isset(self::$enabled_for[$type])) self::$enabled_for[$type] = $bool;
		}
	}

	/**
	 * enables CSRF token for {$httpMethods}
	 */
	public static function enable_for($httpMethods = null) {
		self::set_enabled_for($httpMethods, true);
	}

	/**
	 * disables CSRF token for {$httpMethods}
	 */
	public static function disable_for($httpMethods = null) {
		self::set_enabled_for($httpMethods, false);
	}

	/**
	 * enables CSRF token for all http methods
	 */
	public static function enable_all() {
		self::set_enabled_for(array_keys(self::$enabled_for), true);
	}

	/**
	 * disables CSRF token for all http methods
	 */
	public static function disable_all() {
		self::set_enabled_for(array_keys(self::$enabled_for), false);
	}

	/**
	 * Compares the CSRF token sent with the request to the stored security token.
	 * Checks the request headers (self::$request_header_name) first and falls back to a POST var (self::$var_name).
	 * Ignores GET params.
	 * @param  [SS_HTTPRequest] $request
	 * @return [bool]          	result of comparison
	 */
	public static function compare_request($request) {

		if (!self::$enabled_for[$request->httpMethod()]) return true;

		$compare = $request->getHeader(self::$request_header_name);

		// otherwise only check POST vars
		$compare = $compare ? $compare : $request->postVar(self::$var_name);
		$token = self::token();
		return ($compare && $token->getValue() && $compare == $token->getValue());
	}

	/**
	 * @return data for template
	 */
	public function getData($extension = null) {
		return array(
			'SecurityID'	=> self::token()->getValue(),
			'RequestHeader'	=> self::$request_header_name
		);
	}

}