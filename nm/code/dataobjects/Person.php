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

	static $db = array(
		'FirstName'			=> 'Varchar(55)',		// Vorname
		'Surname'			=> 'Varchar(55)',		// Nachname
		'Email'				=> 'Varchar(55)',		// Email
		'Phone'				=> 'Varchar(55)',		// Telefonnummer
		'Bio'				=> 'Text',				// Biografie
		'GraduationYear'	=> 'Int',				// Abschlussjahr
		'MasterYear'		=> 'Int',				// Meisterschülerjahr
		'IsStudent'			=> 'Boolean',			// Ist ein Student ?
		'IsProfessor'		=> 'Boolean',			// Ist der Professor ?
		'IsAlumni'			=> 'Boolean',			// Ist Alumni ?
		'IsEmployee'		=> 'Boolean',			// Ist ein Mitarbeiter ?
		'IsExternal'		=> 'Boolean',			// Ist eine externe Person ?
	);

	static $has_many = array(
		'Rankings'			=> 'Ranking'			// Bewertungssystem eigener Arbeiten
	);

	static $many_many = array(
		'Projects'			=> 'Project',
		'Websites'			=> 'Website'			// Webseiten
	);

}

