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

	// ! Singular und Plural ---------------
	
	static $singular_name = 'Calendar';
	static $plural_name = 'Calendar';


	// ! Datenbank und Beziehungen ---------

	static $db = array(
		'Title'		=> 'Varchar(255)',				// Titel der News
		'StartDate'	=> 'SS_DateTime',				// Start-Datum
		'EndDate'	=> 'SS_DateTime',				// End-Datum
		'Text'		=> 'Text'						// News-Text (Markdown formatiert)
	);

	static $many_many = array(
		'Websites'		=> 'Website',				// Webseiten
		'Workshops'		=> 'Workshop',				// Workshops
		'Excursions'	=> 'Excursion',				// Exkursionen
		'Projects'		=> 'Project',				// Projekte
		'Exhibitions'	=> 'Exhibition'				// Ausstellungen
	);


	// ! Extensions ------------------------
	
	static $extensions = array(
		'DataObjectHasSummaryExtension',
		'StartEndDateExtension'
	);


	// ! Such-Felder -----------------------

	static $searchable_fields = array(
		'Title',
		'StartDate',
		'EndDate',
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

