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
 * DataObjectHasSummary Extension
 *
 *
 */
class DataObjectHasSummaryExtension extends Extension {

	/**
	 * Gibt den ersten Abschnitt des Datenbank-Feldes "Text" falls vorhanden zurück
	 *
	 * @return string
	 */
	public function getSummary() {
		$teaser = $this->owner->dbObject('Teaser');
		$text = $teaser ? $teaser : $this->owner->dbObject('Text');
		if (!$text)  return '';
		$summary = $text->Summary();
		
		return $summary ? $summary : '';
	}

}

