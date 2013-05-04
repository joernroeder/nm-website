<?php

class User_RestApiExtension extends JJ_RestApiDataExtension implements TemplateGlobalProvider {

	private static $extension_key = 'User';

	private static $use_cache = false;

	private static $api_access = array(
		'view'	=> array(
			'FirstName',
			'Surname',
			'Email',
			'PersonID'
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
				'Email'		=> $member->Email ? $member->Email : false,
				'PersonID'	=> (int) $member->Person()->ID
			);
		}
		
		return $res;
	}



}

