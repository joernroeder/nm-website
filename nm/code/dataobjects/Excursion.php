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

	// ! Singular und Plural ---------------

	static $singular_name = 'Excursion';
	static $plural_name = 'Excursions';

	// ! Datenbank und Beziehungen ---------

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

	// ! Erweiterungen ---------------------

	static $extensions = array(
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

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	static $summary_fields = array(
		'Title',
		'StartDate',
		'EndDate',
		'Space',
		'Location',
		'Summary'
	);

}

