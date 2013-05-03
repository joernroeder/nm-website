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


class StaticsUrlExtension extends DataExtension {

	public function getLink() {
		$link = $this->owner->Link();
		print_r('$getlink');
		return $link;
	}

	public function Link() {
		$link = $this->owner->Link();
		print_r('$link');
		return $link;
	}

	public function getFoo() {
		print_r('bar');
		return false;
	}

}