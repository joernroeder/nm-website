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

class DocImage extends SubdomainResponsiveImage {

	private static $belongs_many_many = array(
		'Excursions'	=> 'Excursion',		// Exkursionen
		'Exhibitions'	=> 'Exhibition',	// Ausstellungen
		'Projects'		=> 'Project',		// Projekte
		'Workshops'		=> 'Workshop'		// Workshops
	);

	private static $singular_name = 'Image';
	private static $plural_name = 'Images';


	// ! API -------------------------------

	private static $api_access = array(
		'view' => array(
			'Title',
			'Caption',
			'Urls',
			'Projects',
			'Excursions',
			'Exhibitions',
			'Workshops'
		)
	);

	/*public function getUrls() {
		//print_r($this->getLinksBySize());
		$urlNames = array();
		$urls = $this->getLinksBySize();
		foreach ($urls[0] as $size => $url) {
			$urlNames['_' . $size] = $url;
		}

		return $urlNames;
	}*/

	public function canDelete($member = null) {
		if(!$member || !(is_a($member, 'Member'))) $member = Member::currentUser();

		// No member found
		if(!($member && $member->exists())) return false;
		
		// admin can always edit
		if (Permission::check('ADMIN', 'any', $member)) return true;

		// iterate over project types and check if any of the can be edited by the current member.
		// if yes, allow deletion
		$canDelete = false;
		foreach (Gallery_Controller::$project_types as $projectTypes) {
			foreach ($this->$projectTypes() as $p) {
				if ($p->canEdit($member)) $canDelete = true;
				break;
			}
			if ($canDelete) break;
		}

		return $canDelete;
	}

	public function canView($member = null) {
		return true;
	}
}

