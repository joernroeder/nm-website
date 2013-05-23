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
 * Person Object
 *
 */
class Person extends DataObject {

	// ! Singular und Plural ---------------

	private static $singular_name = 'Person';
	private static $plural_name = 'Persons';

	// ! Datenbank und Beziehungen ---------

	private static $db = array(
		'FirstName'			=> 'Varchar(55)',		// Vorname
		'Surname'			=> 'Varchar(55)',		// Nachname
		'Email'				=> 'Varchar(55)',		// Email
		'Phone'				=> 'Varchar(55)',		// Telefonnummer
		'Bio'				=> 'Text',				// Biografie
		'JobTitle'			=> 'Varchar(55)',		// Titel des Jobs, der angezeigt wird (z.B. 'Professor' oder 'Research Assistant')
		'UrlSlug'			=> 'Varchar(55)',		// Unique URL-Slug, der auf die Person verweist, z.B. joel-baumann
		'GraduationYear'	=> 'Int',				// Abschlussjahr
		'MasterYear'		=> 'Int',				// Meisterschülerjahr
		'IsStudent'			=> 'Boolean',			// Flagge: Ist ein Student ?
		'IsAlumni'			=> 'Boolean',			// Flagge: Ist Alumni ?
		'IsEmployee'		=> 'Boolean',			// Flagge: Ist ein Mitarbeiter ?
		'IsExternal'		=> 'Boolean',			// Flagge: Ist eine externe Person ?
	);

	private static $has_one = array(
		'Image'				=> 'PersonImage',		// Foto der Person
	);

	private static $has_many = array(
		'Rankings'			=> 'Ranking',			// Sortierungssystem eigener Arbeiten
		'Templates'			=> 'TemplateFile'		// Eigenes Template
	);

	private static $many_many = array(
		'Projects'			=> 'Project',			// Projekte
		'Websites'			=> 'Website',			// Webseiten
		'Exhibitions'		=> 'Exhibition',		// Ausstellungen
		'Excursions'		=> 'Excursion',			// Exkursionen
		'Workshops'			=> 'Workshop',			// Workshops
	);

	private static $belongs_to = array(
		'Member'			=> 'Member'				// Benutzer
	);


	// ! Extensions ------------------------
	
	private static $extensions = array(
		'HyphenatedTextExtension',
		'MarkdownDataExtension'
	);


	// ! Indizes ---------------------------
	
	private static $indexes = array(
		'UrlSlug'			=> array(
			'type'	=> 'unique',
			'value'	=> 'UrlSlug'
		)
	);

	// ! Such-Felder -----------------------

	private static $searchable_fields = array(
		'FirstName',
		'Surname',
		'Email',
		'Phone',
		'Bio',
		'GraduationYear',
		'MasterYear',
		'IsStudent',
		'IsAlumni',
		'IsEmployee',
		'IsExternal'
	);

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	private static $summary_fields = array(
		'Title',
		'Email',
		'Phone',
		'GraduationYear'
	);

	// admin helper
	public function getTitle() {
		return $this->FirstName . ' ' . $this->Surname;
	}

	public function getCMSFields() {
		$fields = parent::getCMSFields();

		return $fields;
	}


	// ! API -------------------------------

	private static $api_access = array(
		'view' => array(
			'FirstName',
			'Surname',
			'UrlSlug',
			'JobTitle',
			'Image.Urls',
			'IsExternal',
			'IsEmployee',
			'IsStudent',
			'IsAlumni',
			'Email',
			//'Bio',
			'MarkdownedBio',
			'GraduationYear',
			'MasterYear',
			'Websites.Title',
			'Websites.Link',
			'Projects.ClassName',
			'Projects.UglyHash',
			'Projects.Title',
			'Projects.FrontendDate',
			'Projects.MarkdownedTeaser',
			'Projects.IsFeatured',
			'Projects.IsPortfolio',
			'Projects.PreviewImage.Title',
			'Projects.PreviewImage.Caption',
			'Projects.PreviewImage.Urls',

			'Workshops.ClassName',
			'Workshops.UglyHash',
			'Workshops.Title',
			'Workshops.DateRangeNice',
			'Workshops.MarkdownedTeaser',
			'Workshops.IsFeatured',
			'Workshops.IsPortfolio',
			'Workshops.PreviewImage.Title',
			'Workshops.PreviewImage.Caption',
			'Workshops.PreviewImage.Urls',

			'Exhibitions.ClassName',
			'Exhibitions.UglyHash',
			'Exhibitions.Title',
			'Exhibitions.DateRangeNice',
			'Exhibitions.MarkdownedTeaser',
			'Exhibitions.IsFeatured',
			'Exhibitions.IsPortfolio',
			'Exhibitions.PreviewImage.Title',
			'Exhibitions.PreviewImage.Caption',
			'Exhibitions.PreviewImage.Urls',

			'Excursions.ClassName',
			'Excursions.UglyHash',
			'Excursions.Title',
			'Excursions.DateRangeNice',
			'Excursions.MarkdownedTeaser',
			'Excursions.IsFeatured',
			'Excursions.IsPortfolio',
			'Excursions.PreviewImage.Title',
			'Excursions.PreviewImage.Caption',
			'Excursions.PreviewImage.Urls',

			'Templates.IsDetail',
			'Templates.Url',

			'Rankings.Ranking',
			'Rankings.Project',
			'Rankings.Exhibition',
			'Rankings.Excursion',
			'Rankings.Workshop',

			// secure fields
			'Phone'
		),
		'view.about_init'	=> array(
			'FirstName',
			'Surname',
			'UrlSlug',
			'JobTitle',
			'Image.Urls',
			'IsExternal',
			'IsEmployee',
			'IsStudent',
			'IsAlumni'
		),
		'edit'	=> array(
			'Image'
		)
	);


	public function canView($member = null) {
		return true;
	}

	public function canEdit($member = null) {
		if(!$member || !(is_a($member, 'Member'))) $member = Member::currentUser();

		// No member found
		if(!($member && $member->exists())) return false;

		// check if member's person is $this
		if ($member->Person() && $member->Person()->ID == $this->ID) return true;
		
		// admin can always edit
		if (Permission::check('ADMIN', 'any', $member)) return true;

		return false;
	}

	public function canViewContext($fields) {
		$currentMemberID = Member::currentUserID();
		$owner = $this->Member();
		if ($currentMemberID && $owner && $owner->ID == $currentMemberID) return $fields;
		
		unset($fields['Phone']);
		return $fields;
	}

	/*public function canViewSecureContext($member = null) {
		$currentMemberID = Member::currentUserID();
		$owner = $this->Member();
		if ($currentMemberID && $owner && $owner->ID == $currentMemberID) return true;
		return false;
	}*/

	public function getMarkdownedBio() {
		return $this->MarkdownHyphenated('Bio');
	}

	public function getFullName() {
		$name = '';
		$name .= $this->FirstName ? $this->FirstName . ' ' : '';
		$name .= $this->Surname ? $this->Surname : '';
		return $name;
	}

	public function onBeforeWrite() {
		if (!$this->UrlSlug) {
			$this->UrlSlug = Convert::raw2url($this->getTitle());
		}

		parent::onBeforeWrite();
	}

}

