<?php

class Authentication_RestApiController extends JJ_RestfulServer {

	protected $currentUser = null;

	private static $url_handlers = array(
		'$Action/$OtherAction'	=> 'handleAction'
	);

	public function init() {
		parent::init();
		$this->setResponseFormatter('json');
		$this->addContentTypeHeader();

		// check for current member
		if (Member::CurrentUserID()) {
			$this->currentUser = Member::CurrentUser();
		}
	}

	public function login() {
		$res = array();
		
		if (!Director::is_ajax() || !$this->request->isPOST()) return $this->methodNotAllowed();
		
		$RAW_data = array();
		$RAW_data['Password'] = $this->request->postVar('pass');
		$RAW_data['Email'] = $this->request->postVar('email');
		$remember = $this->request->postVar('remember');

		// authenticate
		$member = MemberAuthenticator::authenticate($RAW_data);
		if ($member) {
			if ($this->currentUser) $this->currentUser->LogOut();
			$member->LogIn($remember);
			$this->currentUser = $member;
			$res = array(
				'FirstName'		=> $member->FirstName,
				'Surname'		=> $member->Surname,
				'Email'			=> $member->Email,
				'PersonID'		=> (int) $member->PersonID
			);
		}

		return json_encode($res);
	}

	public function logout() {
		if (!Director::is_ajax() || !$this->request->isPOST()) return $this->methodNotAllowed();

		if ($user = $this->currentUser) {
			$this->currentUser->LogOut();
			$this->currentUser = null;
		}

		return json_encode(array(
			'success'	=> true
		));
	}

	public function canEdit() {
		if (!Director::is_ajax() || !$this->request->isGET()) return $this->methodNotAllowed();
		
		$className = $this->request->getVar('className');

		if (in_array($className, array('Project', 'Exhibition', 'Workshop', 'Excursion'))) {
			$uglyHash = $this->request->getVar('UglyHash');
			if ($uglyHash) {
				$uglyHash = Convert::raw2sql($uglyHash);
				$obj = DataObject::get_one(Convert::raw2sql($className), "UglyHash='$uglyHash'");
				return json_encode(array(
					'allowed'	=> $obj->canEdit()
				));
			}
		}
	}

}
