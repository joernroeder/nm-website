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

class TemplateFile extends File {
	
	static $db = array(
		'IsDetail'	=> 'Boolean'
	);

	static $has_one = array(
		'Person'	=> 'Person'
	);

	public function canView($member = null) {
		return true;
	}
}

