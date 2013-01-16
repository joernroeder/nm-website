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

	// ! Datenbank und Beziehungen ---------

	static $db = array(
		'Title'		=> 'Varchar(255)',						// Workshop Titel
		'StartDate'	=> 'Date',								// Start-Datum des Workshops
		'EndDate'	=> 'Date',								// End-Datum des Workshops
		'Space'		=> 'Varchar(255)',						// Veranstaltungs-Ort (kunsthochschule)
		'Location'	=> 'Varchar(255)',						// Ort des Workshops (Stadt, Land)
		'Text'		=> 'Text'								// Beschreibungstext
	);
		
	static $many_many = array(
		'Exhibitions'	=> 'Exhibition',					// Ausstellungen
		'Projects'		=> 'Project'						// Projekte
	);

	static $belongs_many_many = array(
		'CalendarEntries'		=> 'CalendarEntry',			// Kalendereinträge
		'Persons'				=> 'Person',				// Personen
		'Excursions'			=> 'Excursion'				// Exkursionen
	);

	// ! Extensions ------------------------
	
	static $extensions = array(
		'StartEndDateExtension',
		'DataObjectHasSummaryExtension'
	);


	// ! Such-Felder -----------------------

	static $searchable_fields = array(
		'Title',
		'StartDate',
		'EndDate',
		'Space',
		'Location',
		'Text'
	);

	static $start_date_format = 'd.m.Y H:i';			// Format das Anfangsdatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}
	static $end_date_format = 'd.m.Y H:i';				// Format das Enddatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}


	// ! Admin -----------------------------

	// Felder für dies Listen/Übersichten im Admin
	static $summary_fields = array(
		'Title',
		'Date',
		'Summary'	// ruft $this->getSummary() auf {@see DataObjectHasSummaryExtension}
	);
}

