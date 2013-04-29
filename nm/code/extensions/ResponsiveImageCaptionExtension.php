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

class ResponsiveImageCaptionExtension extends DataExtension {

	private static $db = array(
		'Caption' => 'Varchar(255)'
	);

	private static $searchable_fields = array(
		'Caption'
	);

	public function updateSummaryFields(&$fields) {
		$summaryFields = array(
			'Thumbnail',
			'Title',
			'Caption',
			'ID'
		);

		// reset
		$fields = array();

		foreach ($summaryFields as $field) {
			$fields[$field] = $field;
		}
	}
}

