<?php

class Lists_Controller extends Controller {

	protected $currentUser = null;

	private static $url_handlers = array(
		'$Action/$OtherAction'	=> 'handleAction'
	);

	public function init() {
		parent::init();

		if (Member::CurrentUserID()) {
			$this->currentUser = Member::CurrentUser();
		}
	}

	/**
	 * This function returns basic lists (ID and Title/Name) of:
	 * 	- Project @todo : check if published
	 * 	- Exhibition @todo : check if published
	 * 	- Workshop @todo : check if published
	 * 	- Excursion @todo : check if published
	 * 	- Person
	 * 	- Category
	 * 	
	 */
	public function all() {
		if (!$this->currentUser) return json_encode(array());

		

	}

}