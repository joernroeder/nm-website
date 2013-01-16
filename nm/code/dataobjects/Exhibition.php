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
 * Exhibition Object
 *
 */
class Exhibition extends DataObject {

	static $db = array(
		'Title'		=> 'Varchar(255)',				// Ausstellungs-Titel
		'StartDate'	=> 'Date',						// Start-Datum
		'EndDate'	=> 'Date',						// End-Datum
		'Space'		=> 'Varchar(255)',				// Veranstaltungs-Ort (Galerie)
		'Location'	=> 'Varchar(255)',				// Ort des Workshops (Stadt, Land)
		'Text'		=> 'Text'						// Beschreibungstext (Markdown formatiert)
	);

	static $many_many = array(
		'Websites'	=> 'Website',
		'Projects'	=> 'Project'
	);

	static $belongs_many_many = array(
		'Persons'	=> 'Person'
	);

}

