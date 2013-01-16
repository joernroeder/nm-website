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
 * Workshop Object
 *
 */
class Workshop extends DataObject {

	static $db = array(
		'Title'		=> 'Varchar(255)',			// Workshop Titel
		'StartDate'	=> 'Date',					// Start-Datum des Workshops
		'EndDate'	=> 'Date',					// End-Datum des Workshops
		'Space'		=> 'Varchar(255)',			// Veranstaltungs-Ort (kunsthochschule)
		'Location'	=> 'Varchar(255)',			// Ort des Workshops (Stadt, Land)
		'Text'		=> 'Text'					// Beschreibungstext
	);

	static $belongs_many_many = array(
		'CalendarEntries'		=> 'CalendarEntry',
		'Persons'				=> 'Person'
	);
}

