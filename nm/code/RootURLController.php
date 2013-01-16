<?php

class RootURLController extends Controller {

	static $url_handlers = array(
		'$Action/$ID/$OtherID'	=> 'index'
	);

	/**
	 * resets the controller. there is nothing to reset yet, but it's required for the tests
	 */
	static function reset() {
	}

	function index() {
		return $this->customise(array(
		));
	}

}