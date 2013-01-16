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
 * Website Helper Object
 *
 * {@see getTitle()}
 * {@see getLink()}
 *
 * @todo implement getTitle()
 * @todo implement getLink()
 */
class Website extends DataObject {

	static $db = array(
		'Varchar(55)'	=> 'Title',						// Sichtbarer Titel des Links
		'Varchar(255)'	=> 'Link'						// zu verlinkende URL
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',
		'Exhibitions'		=> 'Exhibition',
		'Persons'			=> 'Person'
	);
}

