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
 * Sortierungssystem für Arbeiten einer {@link Person}
 */
class Ranking extends DataObject {

	static $db = array(
		'Ranking'	=> 'Integer'	// Sortierung: Größer -> Wichtiger
	);

}

