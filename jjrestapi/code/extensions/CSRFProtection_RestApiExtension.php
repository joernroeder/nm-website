<?php

class CSRFProtection_RestApiExtension extends JJ_RestApiDataExtension implements TemplateGlobalProvider {

	private static $extension_key = 'SecurityID';

	/**
	 * key of POST var which may store the token
	 * @var string
	 */
	private static $var_name = 'SecurityID';

	/**
	 * key of request header which may store the token
	 * @var string
	 */
	private static $request_header_name = 'X-Csrf-Token';

	/**
	 * holds our token instance
	 * @var SecurityToken
	 */
	private static $token_inst = null;

	/**
	 * defines which http methods to check token against
	 * @var array
	 */
	private static $enabled_for = array(
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
	 * Compares the CSRF token sent with the request to the stored security token.
	 * Checks the request headers (self::$request_header_name) first and falls back to a POST var (self::$var_name).
	 * Ignores GET params.
	 * @param  [SS_HTTPRequest] $request
	 * @return [bool]          	result of comparison
	 */
	public static function compare_request($request) {

		$enabled_for = Config::inst()->get(get_called_class(), 'enabled_for');
		if (!$enabled_for[$request->httpMethod()]) return true;

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