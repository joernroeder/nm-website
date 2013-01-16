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
 * Project Object
 *
 */
class Project extends DataObject {

	static $db = array(
		'Title'			=> 'Varchar(255)',	// Projekt Titel
		'Date'			=> 'Date',			// Projekt-Datum. Hierbei werden nur Monat und Jahr berücksichtigt.
		'Text'			=> 'Text',			//
		'Code'			=> 'Text',			//
		'IsPortfolio'	=> 'Boolean',		//
		'IsFeatured'	=> 'Boolean'		//
	);

	static $has_many = array(
		'Rankings' => 'Ranking'				// 
	);
}

