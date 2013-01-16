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
 * CalendarEntry Object
 *
 */
class CalendarEntry extends DataObject {

	static $db = array(
		'Title'		=> 'Varchar(255)',				// Titel der News
		'StartDate'	=> 'Date',						// Start-Datum
		'EndDate'	=> 'Date',						// End-Datum
		'Text'		=> 'Text'						// News-Text (Markdown formatiert)
	);

	static $many_many = array(
		'Websites'		=> 'Website',				// Webseiten
		'Workshops'		=> 'Workshop',				// Workshops
		'Excursions'	=> 'Excursion',				// Exkursionen
		'Projects'		=> 'Project',				// Projekte
		'Exhibitions'	=> 'Exhibition'				// Ausstellungen
	);

}

