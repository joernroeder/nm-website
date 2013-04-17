<?php

class User_RestApiExtension extends JJ_RestApiDataExtension implements TemplateGlobalProvider {

	public static $extension_key = 'User';

	public static $api_access = array(
		'view'	=> array(
			'logged_in',
			'FirstName',
			'Surname',
			'Email'
		)
	);

	/**
	 * returns the member object as array-map
	 * 
	 * @param  string $extension formatter-extension json|xml
	 * @return array
	 */
	public function getData($extension = null) {
		$member = Member::CurrentUserID() ? Member::CurrentUser() : false;
		$res = array();
		if ($member) {
			$res = array(
				'FirstName'	=> $member->FirstName,
				'Surname'	=> $member->Surname ? $member->Surname : false,
				'Email'		=> $member->Email ? $member->Email : false
			);
		}
		return $res;
	}



}

