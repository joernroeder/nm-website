<?php

class Editors_RestApiController extends JJ_RestfulServer {

	protected $currentUser = null;

	private static $url_handlers = array(
		'$Action/$OtherAction'	=> 'handleAction'
	);

	private static $allowed_actions = array(
		'getEditors',
		'changeEditors'
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


	public function getEditors() {
		if (!Director::is_ajax() || !$this->request->isGET() || !$this->currentUser) return $this->methodNotAllowed();
		
		$className = $this->request->getVar('className');
		$id = (int) $this->request->getVar('id');

		$out = array();

		if (in_array($className, array('Project', 'Exhibition', 'Workshop', 'Excursion'))) {
			if (!$className || !$id) return $this->methodNotAllowed();
			$object = DataObject::get_by_id($className, $id);
			if ($object) {
				$relation = ($className == 'Project') ? 'BlockedEditors' : 'Editors';
				foreach ($object->$relation() as $member) {
					if ($member->ID != $this->currentUser->ID) $out[] = $member->PersonID;
				}
			}
		}

		return json_encode($out);
	}

	public function changeEditors() {
		if (!Director::is_ajax() || !$this->request->isPOST() || !$this->currentUser) return $this->methodNotAllowed();
		
		$className = $this->request->postVar('className');
		$id = (int) $this->request->postVar('id');

		$out = array();

		Debug::dump($className);
		Debug::dump($id);
	}


}
