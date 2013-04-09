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

	static $singular_name = 'Person';
	static $plural_name = 'Persons';

	// ! Datenbank und Beziehungen ---------

	static $db = array(
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

	static $has_one = array(
		'Image'				=> 'PersonImage'		// Foto der Person
	);

	static $has_many = array(
		'Rankings'			=> 'Ranking'			// Sortierungssystem eigener Arbeiten
	);

	static $many_many = array(
		'Projects'			=> 'Project',			// Projekte
		'Websites'			=> 'Website',			// Webseiten
		'Exhibitions'		=> 'Exhibition',		// Ausstellungen
		'Excursions'		=> 'Excursion',			// Exkursionen
		'Workshops'			=> 'Workshop',			// Workshops
	);

	static $belongs_to = array(
		'Member'			=> 'Member'				// Benutzer
	);

	// ! Such-Felder -----------------------

	static $searchable_fields = array(
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
	static $summary_fields = array(
		'FullName',
		'Email',
		'Phone',
		'GraduationYear'
	);

	public function getFullName() {
		return $this->FirstName . ' ' . $this->Surname;
	}

	public function getCMSFields() {
		$fields = parent::getCMSFields();

		return $fields;
	}


	// ! API -------------------------------

	static $api_access = array(
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
			'Bio',
			'GraduationYear',
			'MasterYear',
			'Projects',
			'Websites.Title',
			'Websites.Link',
			'Exhibitions',
			'Excursions',
			'Workshops'
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
		)
	);

	public function canView($member = null) {
		return true;
	}

}

