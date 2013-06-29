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

	private static $singular_name = 'Exhibition';
	private static $plural_name = 'Exhibitions';

	// ! Datenbank und Beziehungen ---------

	private static $db = array(
		'Title'				=> 'Varchar(255)',				// Ausstellungs-Titel
		'TeaserText'		=> 'Varchar(156)',				// Teaser Text
		'StartDate'			=> 'Date',						// Start-Datum
		'EndDate'			=> 'Date',						// End-Datum
		'Space'				=> 'Varchar(255)',				// Veranstaltungs-Ort (Galerie)
		'Location'			=> 'Varchar(255)',				// Ort des Workshops (Stadt, Land)
		'Text'				=> 'Text',						// Beschreibungstext (Markdown formatiert)

		'IsPortfolio'		=> 'Boolean',					// Flagge: Zeigt an ob das Projekt im Portfolio erscheint
		'IsFeatured'		=> 'Boolean',					// Flagge: Zeigt an ob das Projekt auf der Startseite erscheint
		'IsPublished'		=> 'Boolean',					// Flagge: Zeigt an ob das Projekt veröffentlicht ist
		'UglyHash'			=> 'Varchar'					// Unique Hash, der auf das Projekt zeigt (für URLs, z.B. /portfolio/123234324)
	);

	private static $has_one = array(
		'PreviewImage'	=> 'DocImage'
	);

	private static $has_many = array(
		'Rankings'			=> 'Ranking',			// Sortierungssystem eigener Arbeiten
		'Websites'			=> 'Website'
	);

	private static $many_many = array(
		'Projects'		=> 'Project',					// Projekte
		'Images'		=> 'DocImage'					// Bilder
	);

	private static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',		// Kalendereinträge
		'Persons'	=> 'Person',					// Personen
		'Workshops'	=> 'Workshop',					// Workshops
		'Excursions'	=> 'Excursion'				// Exkursionen
	);

	// ! Indizes ---------------------------
	private static $indexes = array(
		'UglyHash'			=> array(
			'type'	=> 'unique',
			'value'	=> 'UglyHash'
		)
	);

	// ! Erweiterungen ---------------------

	private static $extensions = array(
		'DataObjectHasSummaryExtension',
		'StartEndDateExtension',
		'TeaserCMSFieldsExtension',
		'UglyHashExtension',
		'HyphenatedTextExtension',
		'MarkdownDataExtension',
		'MarkdownedTextExtension',
		'EditorsExtension'
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

	private static $start_date_format = 'd.m.Y';			// Format das Anfangsdatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}
	private static $end_date_format = 'd.m.Y';				// Format das Enddatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	private static $summary_fields = array(
		'Title',
		'Date',										// ruft $this->getDate() auf {@see: StartEndDateExtension.php}
		'Space',
		'Location',
		'Summary'									// ruft $this->getSummary() auf {@see: DataObjectHasSummaryExtension.php}
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
			'IsPublished',

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
			'ClassName',
			'UglyHash',
			'Title',
			'DateRangeNice',
			'TeaserText',
			'MarkdownedTeaser',
			'IsFeatured',
			'IsPortfolio',
			'IsPublished',

			'PreviewImage.Urls',
			'Persons.FirstName',
			'Persons.Surname',
			'Persons.UrlSlug',
			'Persons.Templates.Url',
			'Persons.Templates.IsDetail'
		),
		'edit'	=> array(
			'Title',
			'StartDate',
			'EndDate',
			'TeaserText',
			'Text',
			'Persons',
			'PreviewImage',
			'Images',
			'IsPublished',
			'Projects',
			'Workshops',
			'Excursions',
			'Websites.Title',
			'Websites.Link'
		)
	);

	private static $searchable_api_fields = array(
		'Title',
		'IsFeatured',
		'UglyHash'	=> 'ExactMatchFilter'
	);

	public function canCreate($member = null) {
		if(!$member || !(is_a($member, 'Member'))) $member = Member::currentUser();

		// No member found
		if(!($member && $member->exists())) return false;

		return true;
	}

	public function canView($member = null) {
		if ($this->IsPublished) return true;

		return $this->canEdit();
	}

	public function canDelete($member = null) {
		return $this->canEdit($member);
	}

	public function canEdit($member = null) {
		if(!$member || !(is_a($member, 'Member'))) $member = Member::currentUser();

		// No member found
		if(!($member && $member->exists())) return false;
		
		// admin can always edit
		if (Permission::check('ADMIN', 'any', $member)) return true;
		
		// extended access checks
		$results = $this->extend('canEdit', $member);
		if($results && is_array($results)) {
			if(!min($results)) return false;
			else return true;
		}

		return false;
	}
}

