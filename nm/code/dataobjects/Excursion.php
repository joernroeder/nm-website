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
 * Excursion Object
 *
 */
class Excursion extends DataObject {

	static $db = array(
		'Title'		=> 'Varchar(255)',				// Titel der Exkursion
		'StartDate'	=> 'Date',						// Start-Datum
		'EndDate'	=> 'Date',						// End-Datum
		'Location'	=> 'Varchar(255)',				// Ort (Stadt, Land)
		'Text'		=> 'Text'						// Beschreibungstext (Markdown formatiert)
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',
		'Persons'			=> 'Person'
	);

}

