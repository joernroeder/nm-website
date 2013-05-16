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

class ResponsiveImageUrlExtension extends DataExtension {

	public function getUrls() {
		$urlNames = array();
		$urls = $this->owner->getImageDataBySize();

		foreach ($urls[0] as $size => $url) {
			$urlNames['_' . $size] = $url;
		}

		return $urlNames;
	}

}