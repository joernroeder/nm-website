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
	
	private static $singular_name = 'Category';
	private static $plural_name = 'Categories';

	// ! Datenbank und Beziehungen ---------

	private static $db = array(
		'Title'		=> 'Varchar(55)'				// Name der Kategorie
	);

	private static $belongs_many_many = array(
		'Projects'	=> 'Project'					// Projekte
	);

	// ! Such-Felder -----------------------

	private static $searchable_fields = array(
		'Title'
	);

	// ! Admin -----------------------------

	// Felder für die Listen/Übersichten im Admin
	private static $summary_fields = array(
		'Title'
	);


	// ! API -------------------------------

	private static $api_access = array(
		'view' => array(
			'Title'
		)
	);

	public function canView($member = null) {
		return true;
	}

}
