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
	
	private static $singular_name = 'Calendar';
	private static $plural_name = 'Calendar';


	// ! Datenbank und Beziehungen ---------

	private static $db = array(
		'Title'		=> 'Varchar(255)',				// Titel der News
		'StartDate'	=> 'SS_DateTime',				// Start-Datum
		'EndDate'	=> 'SS_DateTime',				// End-Datum
		'Text'		=> 'Text',						// News-Text (Markdown formatiert)
		'UrlHash'	=> 'Varchar'					// URLHash, der automatisch generiert wird in der URL einzigartig auf einen Kalendereintrag verweist
	);

	private static $many_many = array(
		'Websites'		=> 'Website',				// Webseiten
		'Workshops'		=> 'Workshop',				// Workshops
		'Excursions'	=> 'Excursion',				// Exkursionen
		'Projects'		=> 'Project',				// Projekte
		'Exhibitions'	=> 'Exhibition'				// Ausstellungen
	);


	// ! Extensions ------------------------
	
	private static $extensions = array(
		'DataObjectHasSummaryExtension',
		'StartEndDateExtension',
		'HyphenatedTextExtension',
		'MarkdownDataExtension',
		'MarkdownedTextExtension'
	);


	// ! Such-Felder -----------------------

	private static $searchable_fields = array(
		'Title',
		'StartDate',
		'EndDate',
		'Text'
	);

	private static $start_date_format = 'd.m.Y H:i';			// Format des Anfangsdatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}
	private static $end_date_format = 'd.m.Y H:i';				// Format des Enddatums (z.B. Tag.Monat.Jahr) {@see: StartEndDateExtension.php}

	
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
			'DateRangeNice',
			'Title',
			'MarkdownedText',
			'UrlHash',
			'Websites',
			'Exhibitions',
			'Workshops',
			'Projects',
			'Excursions'
		),
		'view.upcoming_init' => array(
			'DateRangeNice',
			'Title',
			'UrlHash'
		)
	);

	private static $api_searchable_fields = array(
		'UrlHash',
		'Title'
	);

	public function canView($member = null) {
		return true;
	}

	public function onBeforeWrite() {
		if (!$this->EndDate && $this->StartDate) {
			$this->EndDate = $this->StartDate;
		}

		if (!$this->UrlHash) {
			$this->UrlHash = md5(time());
		}
		parent::onBeforeWrite();
	}

}



