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
 * Project Object
 *
 * {@todo: `RelatedProjects()` that merges ParentProjects and ChildProjects}
 */
class Project extends DataObject {

	// ! Singular und Plural ---------------

	private static $singular_name = 'Project';
	private static $plural_name = 'Projects';

	// ! Datenbank und Beziehungen ---------

	private static $db = array(
		'Title'				=> 'Varchar(255)',			// Projekt Titel
		'TeaserText'		=> 'Varchar(156)',			// Teaser Text
		'Date'				=> 'Date',					// Projekt-Datum: Hierbei werden nur Monat und Jahr berücksichtigt.
		'Text'				=> 'Text',					// Text des Projekts (Markdown formatiert)
		'Code'				=> 'Text',					// Code, der teil des Projektes ist und auf der Projektseite ausgeführt wird

		'IsPortfolio'		=> 'Boolean',				// Flagge: Zeigt an ob das Projekt im Portfolio erscheint
		'IsFeatured'		=> 'Boolean',				// Flagge: Zeigt an ob das Projekt auf der Startseite erscheint
		'IsPublished'		=> 'Boolean',				// Flagge: Zeigt an ob das Projekt veröffentlicht ist
		'UglyHash'			=> 'Varchar'				// Unique Hash, der auf das Projekt zeigt (für URLs, z.B. /portfolio/123234324)
	);

	private static $has_one = array(
		'PreviewImage'	=> 'DocImage'
	);

	private static $has_many = array(
		'Rankings' 		=> 'Ranking',				// Sortierungssystem {@see Ranking}
		'Websites'		=> 'Website'
	);

	private static $many_many = array(
		'ChildProjects'		=> 'Project',			// Verknüpfte "Kind"-Projekte, die zugehörig zu diesem Projekt sind 
		'Categories'		=> 'Category',			// Kategorie (z.B. Installation)
		'Images'			=> 'DocImage'			// Bilder
	);

	private static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',		// Kalendereinträge
		'ParentProjects'	=> 'Project',			// "Eltern"-Projekte, die mit diesem Projekt verknüpft sind.
		'Exhibitions'		=> 'Exhibition',		// Ausstellungen
		'Workshops'			=> 'Workshop',			// Workshops
		'Excursions'		=> 'Excursion',			// Exkursionen
		'Persons'			=> 'Person'				// Projekt-Teilnehmer
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
		'ProjectEditorsExtension'
	);

	// ! Such-Felder -----------------------

	private static $searchable_fields = array(
		'Title',
		'Text',
		'IsPortfolio',
		'IsFeatured'
	);

	private static $date_format = 'F, Y';				// Format des Datums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}
	private static $frontend_date_format = 'M Y';

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	private static $summary_fields = array(
		'Title',
		'FormattedDate',							// ruft $this->FormattedDate() auf {@see: StartEndDateExtension.php}
		'Summary',									// ruft $this->getSummary() auf {@see: DataObjectHasSummaryExtension.php}
		'IsPortfolio',
		'IsFeatured'
	);


	// ! API -------------------------------

	private static $api_access = array(
		'view' => array(
			'ClassName',
			'UglyHash',
			'Title',
			'TeaserText',
			'Date',
			'FrontendDate',
			'Text',
			'MarkdownedText',
			'MarkdownedTeaser',
			'Code',
			'IsPortfolio',
			'IsFeatured',
			'IsPublished',

			'PreviewImage.Urls',
			'Images.Urls',
			'Images.Title',
			'Images.Caption',

			'Websites.Title',
			'Websites.Link',

			'Persons.FirstName',
			'Persons.Surname',
			'Persons.UrlSlug',
			'Persons.Templates.Url',
			'Persons.Templates.IsDetail',

			'Categories.Title',

			'CalendarEntries.DateRangeNice',
			'CalendarEntries.Title',
			'CalendarEntries.UrlHash',

			'ParentProjects.Title',
			'ParentProjects.UglyHash',
			'ParentProjects.IsPortfolio',
			'ChildProjects.Title',
			'ChildProjects.UglyHash',
			'ChildProjects.IsPortfolio',

			'Exhibitions.Title',
			'Exhibitions.UglyHash',
			'Exhibitions.IsPortfolio',

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
			'FrontendDate',
			'YearSearch',
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
			'Persons.Templates.IsDetail',
			'Categories'
		),
		'edit'	=> array(
			'Title',
			'Date',
			'TeaserText',
			'Text',
			'Persons',
			'PreviewImage',
			'Images',
			'IsPublished',
			'ChildProjects',
			'Excursions',
			'Exhibitions',
			'Workshops',
			'Categories',
			'Websites.Title',
			'Websites.Link'
		)
	);

	private static $api_searchable_fields = array(
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

