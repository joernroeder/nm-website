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
					if ($member->ID != $this->currentUser->ID) $out[] = (int) $member->PersonID;
				}
			}
		}

		return json_encode($out);
	}

	public function changeEditors() {
		if (!Director::is_ajax() || !$this->request->isPOST() || !$this->currentUser) return $this->methodNotAllowed();
		
		$className = $this->request->postVar('className');
		$id = (int) $this->request->postVar('id');

		$editors = array();

		$out = array();

		if (in_array($className, array('Project', 'Exhibition', 'Workshop', 'Excursion'))) {

			if (!$className || !$id) return $this->methodNotAllowed();
			$object = DataObject::get_by_id($className, $id);
			if ($object) {
				$relation = ($className == 'Project') ? 'BlockedEditors' : 'Editors';
				if ($relation == 'Editors') $editors[] = $this->currentUser->ID;
				$personArray = $object->Persons()->toArray();
				if ($postedEditors = $this->request->postVar('editors')) {
					foreach ($postedEditors as $potentialID) {
						foreach ($personArray as $person) {
							if ($person->ID == $potentialID) {
								$memberID = $person->Member()->ID;
								$editors[] = $memberID;
								$out[] = (int) $potentialID;
							}
						}
					}
				}

				$object->$relation()->setByIDList($editors);
				$object->write();
			}

		}

		return json_encode($out);
	}


}
