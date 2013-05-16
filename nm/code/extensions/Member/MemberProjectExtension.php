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

}