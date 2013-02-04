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
		'Title'			=> 'Varchar(55)',		// Sichtbarer Titel des Links
		'Link'			=> 'Varchar(255)'		// zu verlinkende URL
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',			// Kalendereinträge
		'Persons'			=> 'Person',				// Personen
		'Exhibitions'		=> 'Exhibition'				// Ausstellungen
	);


	// ! API -------------------------------

	static $api_access = array(
		'view' => array(
			'Title',
			'Link'
		)
	);

}

