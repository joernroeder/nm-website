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

	static $db = array(
		'Varchar(55)'	=> 'Title'					// Name der Kategorie
	);

	static $belongs_many_many = array(
		'Projects'	=> 'Project'					// Projekte
	);
}

