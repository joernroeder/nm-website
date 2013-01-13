<?php

class RootURLController extends Controller {

	static $url_handlers = array(
		'$Action/$ID/$OtherID'	=> 'index'
	);

	function index() {
		return $this->customise(array(
		));
	}

}