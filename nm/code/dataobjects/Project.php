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

	static $singular_name = 'Project';
	static $plural_name = 'Projects';

	// ! Datenbank und Beziehungen ---------

	static $db = array(
		'Title'				=> 'Varchar(255)',			// Projekt Titel
		'PreviewImageID'	=> 'Int',					// ID des Vorschaubildes
		'TeaserText'		=> 'Varchar(156)',			// Teaser Text
		'Date'				=> 'Date',					// Projekt-Datum: Hierbei werden nur Monat und Jahr berücksichtigt.
		'Text'				=> 'Text',					// Text des Projekts (Markdown formatiert)
		'Code'				=> 'Text',					// Code, der teil des Projektes ist und auf der Projektseite ausgeführt wird

		'IsPortfolio'		=> 'Boolean',				// Flagge: Zeigt an ob das Projekt im Portfolio erscheint
		'IsFeatured'		=> 'Boolean',				// Flagge: Zeigt an ob das Projekt auf der Startseite erscheint
		'UglyHash'			=> 'Varchar'				// Unique Hash, der auf das Projekt zeigt (für URLs, z.B. /portfolio/123234324)
	);

	static $has_many = array(
		'Rankings' 		=> 'Ranking'				// Sortierungssystem {@see Ranking}
	);

	static $many_many = array(
		'ChildProjects'		=> 'Project',			// Verknüpfte "Kind"-Projekte, die zugehörig zu diesem Projekt sind 
		'Categories'		=> 'Category',			// Kategorie (z.B. Installation)
		'Images'			=> 'DocImage'			// Bilder
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',		// Kalendereinträge
		'ParentProjects'	=> 'Project',			// "Eltern"-Projekte, die mit diesem Projekt verknüpft sind.
		'Exhibitions'		=> 'Exhibition',		// Ausstellungen
		'Workshops'			=> 'Workshop',			// Workshops
		'Excursions'		=> 'Excursion',			// Exkursionen
		'Persons'			=> 'Person'				// Projekt-Teilnehmer
	);

	// ! Erweiterungen ---------------------

	static $extensions = array(
		'DataObjectHasSummaryExtension',
		'StartEndDateExtension',
		'TeaserCMSFieldsExtension',
		'UglyHashExtension'
	);

	// ! Such-Felder -----------------------

	static $searchable_fields = array(
		'Title',
		'Text',
		'IsPortfolio',
		'IsFeatured'
	);

	static $date_format = 'F, Y';				// Format des Datums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}
	static $frontend_date_format = 'M Y';

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	static $summary_fields = array(
		'Title',
		'FormattedDate',							// ruft $this->FormattedDate() auf {@see: StartEndDateExtension.php}
		'Summary',									// ruft $this->getSummary() auf {@see: DataObjectHasSummaryExtension.php}
		'IsPortfolio',
		'IsFeatured'
	);


	// ! API -------------------------------

	static $api_access = array(
		'view' => array(
			'Title',
			'TeaserText',
			'FrontendDate',
			'Text',
			'Code',
			'IsPortfolio',
			'IsFeatured',

			'Categories.Title',
			'Images',
			'Images.Urls',
			'Images.Title',
			'Images.Caption',
			'CalendarEntries',
			'ParentProjects',
			'Exhibitions',
			'Workshops',
			'Excursions',
			'Persons',
		),
		'view.portfolio_init' => array(
			'Title',
			'FrontendDate',
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

