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

	private static $db = array(
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

	private static $has_one = array(
		'PreviewImage'	=> 'DocImage'
	);
		
	private static $many_many = array(
		'Exhibitions'	=> 'Exhibition',					// Ausstellungen
		'Projects'		=> 'Project',						// Projekte
		'Images'		=> 'DocImage'						// Bilder
	);

	private static $belongs_many_many = array(
		'CalendarEntries'		=> 'CalendarEntry',			// Kalendereinträge
		'Persons'				=> 'Person',				// Personen
		'Excursions'			=> 'Excursion'				// Exkursionen
	);

	// ! Indizes ---------------------------
	private static $indexes = array(
		'UglyHash'			=> array(
			'type'	=> 'unique',
			'value'	=> 'UglyHash'
		)
	);

	// ! Extensions ------------------------
	
	private static $extensions = array(
		'StartEndDateExtension',
		'DataObjectHasSummaryExtension',
		'TeaserCMSFieldsExtension',
		'UglyHashExtension',
		'HyphenatedTextExtension',
		'MarkdownDataExtension',
		'MarkdownedTextExtension'
	);


	// ! Such-Felder -----------------------

	private static $searchable_fields = array(
		'Title',
		'StartDate',
		'EndDate',
		'Space',
		'Location',
		'Text'
	);

	private static $start_date_format = 'd.m.Y H:i';			// Format das Anfangsdatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}
	private static $end_date_format = 'd.m.Y H:i';				// Format das Enddatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}


	// ! Admin -----------------------------

	// Felder für dies Listen/Übersichten im Admin
	private static $summary_fields = array(
		'Title',
		'Date',
		'Summary'	// ruft $this->getSummary() auf {@see DataObjectHasSummaryExtension}
	);

	// ! API -------------------------------

	private static $api_access = array(
		'view' => array(
			'ClassName',
			'UglyHash',
			'Title',
			'TeaserText',
			'StartDate',
			'EndDate',
			'DateRangeNice',
			'Text',
			'MarkdownedText',
			'MarkdownedTeaser',
			'IsPortfolio',
			'IsFeatured',

			'Space',
			'Location',

			'PreviewImage.Urls',
			'Images.Urls',
			'Images.Title',
			'Images.Caption',

			'Persons.FirstName',
			'Persons.Surname',
			'Persons.UrlSlug',
			'Persons.Templates.Url',
			'Persons.Templates.IsDetail',

			'CalendarEntries.DateRangeNice',
			'CalendarEntries.Title',
			'CalendarEntries.UrlHash',
			
			'Projects.Title',
			'Projects.UglyHash',
			'Projects.IsPortfolio',

			'Exhibitions.Title',
			'Exhibitions.UglyHash',
			'Exhibitions.IsPortfolio',
			
			'Excursions.Title',
			'Excursions.UglyHash',
			'Excursions.IsPortfolio',
		),
		'view.portfolio_init' => array(
			'ClassName',
			'UglyHash',
			'Title',
			'DateRangeNice',
			'TeaserText',
			'MarkdownedTeaser',
			'IsFeatured',
			'IsPortfolio',
			'PreviewImage.Urls',
			'Persons.FirstName',
			'Persons.Surname',
			'Persons.UrlSlug',
			'Persons.Templates.Url',
			'Persons.Templates.IsDetail'
		)
	);

	private static $searchable_api_fields = array(
		'Title',
		'IsFeatured',
		'UglyHash'	=> 'ExactMatchFilter'
	);

	public function canView($member = null) {
		return true;
	}
}

