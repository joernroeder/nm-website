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
		'Space'		=> 'Varchar(255)',				// Veranstaltungs-Ort (z.B. TOCA-ME)
		'Location'	=> 'Varchar(255)',				// Ort (Stadt, Land)
		'Text'		=> 'Text'						// Beschreibungstext (Markdown formatiert)
	);

	static $many_many = array(
		'Workshops'		=> 'Workshop',				// Workshops
		'Exhibitions'	=> 'Exhibition',			// Ausstellungen
		'Projects'		=> 'Project'				// Projekte
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',		// Kalendereinträge
		'Persons'			=> 'Person'				// Personen
	);

}

