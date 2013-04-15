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
 * @todo: check if this object has a relationshop witz itself
 */
class Excursion extends DataObject {

	// ! Singular und Plural ---------------

	static $singular_name = 'Excursion';
	static $plural_name = 'Excursions';

	// ! Datenbank und Beziehungen ---------

	static $db = array(
		'Title'				=> 'Varchar(255)',				// Titel der Exkursion
		'TeaserText'		=> 'Varchar(156)',				// Teaser Text
		'StartDate'			=> 'Date',						// Start-Datum
		'EndDate'			=> 'Date',						// End-Datum
		'Space'				=> 'Varchar(255)',				// Veranstaltungs-Ort (z.B. TOCA-ME)
		'Location'			=> 'Varchar(255)',				// Ort (Stadt, Land)
		'Text'				=> 'Text',						// Beschreibungstext (Markdown formatiert)

		'IsPortfolio'		=> 'Boolean',					// Flagge: Zeigt an ob das Projekt im Portfolio erscheint
		'IsFeatured'		=> 'Boolean',					// Flagge: Zeigt an ob das Projekt auf der Startseite erscheint
		'UglyHash'			=> 'Varchar'					// Unique Hash, der auf das Projekt zeigt (für URLs, z.B. /portfolio/123234324)
	);

	static $has_one = array(
		'PreviewImage'	=> 'DocImage'
	);

	static $many_many = array(
		'Workshops'		=> 'Workshop',				// Workshops
		'Exhibitions'	=> 'Exhibition',			// Ausstellungen
		'Projects'		=> 'Project',				// Projekte
		'Images'		=> 'DocImage'				// Bilder
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',		// Kalendereinträge
		'Persons'			=> 'Person'				// Personen
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
			'Location',
			'Space',
			'Date',
			'TeaserText',
			'Text',
			'Projects',
			'CalendarEnties',
			'Workshops',
			'Persons',
			'Exhibitions',
			'Persons.FirstName',
			'Persons.Surname',
			'Persons.UrlSlug',
			'Persons.Templates.Url',
			'Persons.Templates.IsDetail'
		),
		'view.portfolio_init' => array(
			'UglyHash',
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
		'IsFeatured',
		'UglyHash'	=> 'ExactMatchFilter'
	);

	public function canView($member = null) {
		return true;
	}

}

