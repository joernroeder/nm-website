<?php

class MemberProjectTypesExtension extends DataExtension {

	private static $belongs_many_many = array(
		'BlockedProjects'		=> 'Project',
		'EditableWorkshops'		=> 'Workshop',
		'EditableExcursions'	=> 'Excursion',
		'EditableExhibitions'	=> 'Exhibition'
	);

}

/**
 * only for "Project"
 */
class ProjectEditorsExtension extends DataExtension {

	/*
	** By default, every contributor can edit a project, except if they are blocked
	 */

	private static $many_many = array(
		'BlockedEditors'	=> 'Member'
	);

	public function canEdit($member = null) {
		$person = $member->Person();

		// check if Person is attached to this project
		$attachedPersons = $this->owner->Persons();
		if (!$attachedPersons->exists() || !$attachedPersons->byID($person->ID)) return false;

		// check if Member is a blocked editor
		$blockedEditors = $this->owner->BlockedEditors();
		if ($blockedEditors->exists() && $blockedEditors->byID($member->ID)) return false;

		return true;
	}

	public function getEditableByMember() {
		return $this->owner->canEdit();
	}

}

/**
 * only for "Workshop", "Excursion", "Exhibition"
 */
class EditorsExtension extends DataExtension {

	/*
	** By default, only the Member who created the DataObject can edit, except if they are added
	 */

	private static $many_many = array(
		'Editors'			=> 'Member'
	);

	public function onBeforeWrite() {
		/*
		** add the current user to the editors on first write
		 */
		if (!$this->owner->ID) {
			$current_member = Member::CurrentUserID() ? Member::CurrentUser() : null;	
			if ($current_member) $this->owner->Editors()->add($current_member);
		}
		parent::onBeforeWrite();
	}

	public function canEdit($member = null) {
		$editors = $this->owner->Editors();
		if ($editors->exists() && $editors->byID($member->ID)) return true;
		return false;
	}

	public function getEditableByMember() {
		return $this->owner->canEdit();
	}

}