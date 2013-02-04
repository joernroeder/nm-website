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
 * Category Object
 *
 * Used for {@link Project} filtering
 *
 */
class Category extends DataObject {

	// ! Singular und Plural ---------------
	
	static $singular_name = 'Category';
	static $plural_name = 'Categories';

	// ! Datenbank und Beziehungen ---------

	static $db = array(
		'Title'		=> 'Varchar(55)'				// Name der Kategorie
	);

	static $belongs_many_many = array(
		'Projects'	=> 'Project'					// Projekte
	);

	// ! Such-Felder -----------------------

	static $searchable_fields = array(
		'Title'
	);

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	static $summary_fields = array(
		'Title'
	);


	// ! API -------------------------------

	static $api_access = array(
		'view' => array(
			'Title',
			'Projects'
		)
	);

}
