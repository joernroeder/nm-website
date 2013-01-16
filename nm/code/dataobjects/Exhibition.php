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
 * Exhibition Object
 *
 */
class Exhibition extends DataObject {

	static $db = array(
		'Title'		=> 'Varchar(255)',
		'StartDate'	=> 'Date',
		'EndDate'	=> 'Date',
		'Space'		=> 'Varchar(255)',
		'Location'	=> 'Varchar(255)',
		'Text'		=> 'Text'
	);

}

