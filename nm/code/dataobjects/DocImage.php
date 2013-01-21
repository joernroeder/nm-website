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

}

