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

class DocImage extends ResponsiveImage {

	static $belongs_many_many = array(
		'Excursions'	=> 'Excursion',		// Exkursionen
		'Exhibitions'	=> 'Exhibition',	// Ausstellungen
		'Projects'		=> 'Project',		// Projekte
		'Workshops'		=> 'Workshop'		// Workshops
	);

	static $singular_name = 'Image';
	static $plural_name = 'Images';


	// ! API -------------------------------

	static $api_access = array(
		'view' => array(
			'Title',
			'Caption',
			'Urls'
		)
	);

	public function getUrls() {
		//print_r($this->getLinksBySize());

		return $this->getLinksBySize();
	}
}

