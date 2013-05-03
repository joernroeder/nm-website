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

	private static $db = array(
		'Ranking'	=> 'Int'		// Sortierung: Größer -> Wichtiger
	);

	private static $has_one = array(
		'Person'		=> 'Person',	// Person, die von ihrer Seite aus das Projekt sortiert
		'Project'		=> 'Project',	// Das zu sortierende Projekt
		'Workshop'		=> 'Workshop',
		'Excursion'		=> 'Excursion',
		'Exhibition'	=> 'Exhibition'
	);

	public function canView($member = null) {
		return true;
	}

}

