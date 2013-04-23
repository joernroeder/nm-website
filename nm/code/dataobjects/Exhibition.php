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
		'TeaserText'		=> 'Varchar(156)',				// Teaser Text
		'StartDate'			=> 'Date',						// Start-Datum
		'EndDate'			=> 'Date',						// End-Datum
		'Space'				=> 'Varchar(255)',				// Veranstaltungs-Ort (Galerie)
		'Location'			=> 'Varchar(255)',				// Ort des Workshops (Stadt, Land)
		'Text'				=> 'Text',						// Beschreibungstext (Markdown formatiert)

		'IsPortfolio'		=> 'Boolean',					// Flagge: Zeigt an ob das Projekt im Portfolio erscheint
		'IsFeatured'		=> 'Boolean',					// Flagge: Zeigt an ob das Projekt auf der Startseite erscheint
		'UglyHash'			=> 'Varchar'					// Unique Hash, der auf das Projekt zeigt (für URLs, z.B. /portfolio/123234324)
	);

	static $has_one = array(
		'PreviewImage'	=> 'DocImage'
	);

	static $many_many = array(
		'Websites'	=> 'Website',					// Webseite
		'Projects'	=> 'Project',					// Projekte
		'Images'		=> 'DocImage'				// Bilder
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
		'TeaserCMSFieldsExtension',
		'UglyHashExtension',
		'HyphenatedTextExtension',
		'MarkdownDataExtension',
		'MarkdownedTextExtension'
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

		// ! API -------------------------------

	static $api_access = array(
		'view' => array(
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

			'Websites.Title',
			'Websites.Link',

			'Projects.Title',
			'Projects.UglyHash',
			'Projects.IsPortfolio',

			'Workshops.Title',
			'Workshops.UglyHash',
			'Workshops.IsPortfolio',
			
			'Excursions.Title',
			'Excursions.UglyHash',
			'Excursions.IsPortfolio',
		),
		'view.portfolio_init' => array(
			'UglyHash',
			'Title',
			'DateRangeNice',
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

	static $searchable_api_fields = array(
		'Title',
		'IsFeatured',
		'UglyHash'	=> 'ExactMatchFilter'
	);

	public function canView($member = null) {
		return true;
	}
}

