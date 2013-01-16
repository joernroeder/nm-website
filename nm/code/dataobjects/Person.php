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
		'GraduationYear'	=> 'Int',				// Abschlussjahr
		'MasterYear'		=> 'Int',				// Meisterschülerjahr
		'IsStudent'			=> 'Boolean',			// Flagge: Ist ein Student ?
		'IsProfessor'		=> 'Boolean',			// Flagge: Ist der Professor ?
		'IsAlumni'			=> 'Boolean',			// Flagge: Ist Alumni ?
		'IsEmployee'		=> 'Boolean',			// Flagge: Ist ein Mitarbeiter ?
		'IsExternal'		=> 'Boolean',			// Flagge: Ist eine externe Person ?
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

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry'		// Kalendereinträge
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
		'IsProfessor',
		'IsAlumni',
		'IsEmployee',
		'IsExternal'
	);

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	static $summary_fields = array(
		'Name',
		'Email',
		'Phone',
		'GraduationYear'
	);

	public function getName() {
		return $this->dataRecord->FirstName . ' ' . $this->dataRecord->Surname;
	}

}

