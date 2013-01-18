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
 * @todo: check if this object has a relationshop witz itself
 */
class Exhibition extends DataObject {

	// ! Singular und Plural ---------------

	static $singular_name = 'Exhibition';
	static $plural_name = 'Exhibitions';

	// ! Datenbank und Beziehungen ---------

	static $db = array(
		'Title'				=> 'Varchar(255)',				// Ausstellungs-Titel
		'PreviewImageID'	=> 'Int',						// ID des Vorschaubildes
		'TeaserText'		=> 'Varchar(156)',				// Teaser Text
		'StartDate'			=> 'Date',						// Start-Datum
		'EndDate'			=> 'Date',						// End-Datum
		'Space'				=> 'Varchar(255)',				// Veranstaltungs-Ort (Galerie)
		'Location'			=> 'Varchar(255)',				// Ort des Workshops (Stadt, Land)
		'Text'				=> 'Text'						// Beschreibungstext (Markdown formatiert)
	);

	static $many_many = array(
		'Websites'	=> 'Website',					// Webseite
		'Projects'	=> 'Project'					// Projekte
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',		// Kalendereinträge
		'Persons'	=> 'Person',					// Personen
		'Workshops'	=> 'Workshop',					// Workshops
		'Excursions'	=> 'Excursion'				// Exkursionen
	);

	// ! Erweiterungen ---------------------

	static $extensions = array(
		'DataObjectHasSummaryExtension',
		'StartEndDateExtension',
		'TeaserCMSFieldsExtension'
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

	static $start_date_format = 'd.m.Y';			// Format das Anfangsdatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}
	static $end_date_format = 'd.m.Y';				// Format das Enddatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	static $summary_fields = array(
		'Title',
		'Date',										// ruft $this->getDate() auf {@see: StartEndDateExtension.php}
		'Space',
		'Location',
		'Summary'									// ruft $this->getSummary() auf {@see: DataObjectHasSummaryExtension.php}
	);


}
