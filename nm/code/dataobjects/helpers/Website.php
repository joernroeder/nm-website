<?php
/**
 *
 *    000000  0000000000    000000000000000000
 *    000000  0000000000    00000000000000000000
 *    000000      000000    000000   00000  000000
 *    000000      000000    000000     000  000000
 *     00000      000000    000000       0  000000
 *       000      000000    000000          000000
 *         0      000000    000000          000000
 *
 *    Neue Medien - Kunsthochschule Kassel
 *    http://neuemedienkassel.de
 *
 */

/**
 * Website Helper Object
 *
 * {@see getTitle()}
 * {@see getLink()}
 *
 * @todo implement getTitle()
 * @todo implement getLink()
 */
class Website extends DataObject {

	private static $db = array(
		'Title'			=> 'Varchar(55)',		// Sichtbarer Titel des Links
		'Link'			=> 'Varchar(255)'		// zu verlinkende URL
	);

	private static $has_one = array(
		'CalendarEntry'		=> 'CalendarEntry',	
		'Person'			=> 'Person',	
		'Project'			=> 'Project',
		'Exhibition'		=> 'Exhibition',
		'Excursion'			=> 'Excursion',
		'Workshop'			=> 'Workshop'
	);


	// ! API -------------------------------

	private static $api_access = array(
		'view' => array(
			'Title',
			'Link'
		),
		'edit' => array(
			'Title',
			'Link'
		)
	);

	public function canCreate($member = null) {
		if(!$member || !(is_a($member, 'Member'))) $member = Member::currentUser();

		// No member found
		if(!($member && $member->exists())) return false;

		return true;		
	}

	public function canView($member = null) {
		return true;
	}

	public function canDelete($member = null) {
		return $this->canEdit($member);
	}

	public function canEdit($member = null) {
		if(!$member || !(is_a($member, 'Member'))) $member = Member::currentUser();

		// No member found
		if(!($member && $member->exists())) return false;
		
		// admin can always edit
		if (Permission::check('ADMIN', 'any', $member)) return true;

		$canEdit = false;

		foreach (array('Person', 'Project', 'Exhibition', 'Excursion', 'Workshop') as $type) {
			$object = $this->$type();
			if ($object && $object->canEdit($member)) $canEdit = true;
		}

		return $canEdit;
	}

	function Link() {
		return strpos($this->Link, 'http://') === false ? 'http://' . $this->Link : $this->Link;
	}

}

