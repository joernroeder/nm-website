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
 * @todo: check if this object has a relationshop witz itself
 */
class Workshop extends DataObject {

	// ! Datenbank und Beziehungen ---------

	static $db = array(
		'Title'				=> 'Varchar(255)',						// Workshop Titel
		'TeaserText'		=> 'Varchar(156)',						// Teaser Text
		'StartDate'			=> 'Date',								// Start-Datum des Workshops
		'EndDate'			=> 'Date',								// End-Datum des Workshops
		'Space'				=> 'Varchar(255)',						// Veranstaltungs-Ort (kunsthochschule)
		'Location'			=> 'Varchar(255)',						// Ort des Workshops (Stadt, Land)
		'Text'				=> 'Text',								// Beschreibungstext

		'IsPortfolio'		=> 'Boolean',							// Flagge: Zeigt an ob das Projekt im Portfolio erscheint
		'IsFeatured'		=> 'Boolean',							// Flagge: Zeigt an ob das Projekt auf der Startseite erscheint
		'UglyHash'			=> 'Varchar'							// Unique Hash, der auf das Projekt zeigt (für URLs, z.B. /portfolio/123234324)
	);

	static $has_one = array(
		'PreviewImage'	=> 'DocImage'
	);
		
	static $many_many = array(
		'Exhibitions'	=> 'Exhibition',					// Ausstellungen
		'Projects'		=> 'Project',						// Projekte
		'Images'		=> 'DocImage'						// Bilder
	);

	static $belongs_many_many = array(
		'CalendarEntries'		=> 'CalendarEntry',			// Kalendereinträge
		'Persons'				=> 'Person',				// Personen
		'Excursions'			=> 'Excursion'				// Exkursionen
	);

	// ! Extensions ------------------------
	
	static $extensions = array(
		'StartEndDateExtension',
		'DataObjectHasSummaryExtension',
		'TeaserCMSFieldsExtension',
		'UglyHashExtension'
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

	// ! API -------------------------------

	static $api_access = array(
		'view' => array(
			'Title',
			'PreviewImageID',
			'TeaserText',
			'Date',
			'Space',
			'Location',
			'Text',
			'Exhibitions',
			'Projects',
			'Images',
			'CalendarEntries',
			'Persons',
			'Excursions'
		),
		'view.portfolio_init' => array(
			'Title',
			'StartDate',
			'EndDate',
			'TeaserText',
			'IsFeatured',
			'IsPortfolio',
			'PreviewImageID',
			'Persons',
			'Persons.FirstName',
			'Persons.Surname'
		)
	);

	static $searchable_api_fields = array(
		'Title',
		'IsFeatured'
	);

	public function canView($member = null) {
		return true;
	}
}

