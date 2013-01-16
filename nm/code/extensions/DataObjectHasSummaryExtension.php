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
class DataObjectHasSummaryExtension extends DataExtension {

	/**
	 * Gibt den ersten Abschnitt des Datenbank-Feldes "Text" falls vorhanden zurück
	 *
	 * @return string
	 */
	public function getSummary() {
		$text = $this->dbObject('Text');
		if (!$text)  return '';
		$summary = $text->Summary();
		
		return $summary ? $summary : '';
	}

}

