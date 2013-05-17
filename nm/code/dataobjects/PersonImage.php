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

class PersonImage extends SubdomainResponsiveImage {

	private static $belongs_to = array(
		'Person'	=> 'Person'
	);

	private static $has_one = array(
		'Owner'		=> 'Member'
	);

	private static $api_access = array(
		'view' => array(
			'Title',
			'Caption',
			'Urls'
		)
	);

	public function canView($member=null) {
		return true;
	}
}

