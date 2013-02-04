<?php

class User_RestApiExtension extends JJ_RestApiExtension implements TemplateGlobalProvider {

	public static $extension_key = 'User';

	public static $api_access = array(
		'view'	=> array(
			'FirstName',
			'Surname',
		),
		'view.logged_in' => array(
			'FirstName',
			'Surname',
			'ID'
		)
	);

	/**
	 * returns the member object as array-map
	 * 
	 * @param  string $extension formatter-extension json|xml
	 * @return array
	 */
	public function getData($extension = null) {
		$user = Member::CurrentUserID() ? Member::CurrentUser() : false;

		return $user ? $user->toMap() : array();
	}

}

