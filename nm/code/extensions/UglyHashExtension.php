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
 * UglyHash Extension
 *
 *
 */
class UglyHashExtension extends DataExtension {

	private static $class_enc = array(
		'Project'		=> '0',
		'Excursion'		=> '1',
		'Exhibition'	=> '2',
		'Workshop'		=> '3'
	);

	public function onBeforeWrite() {
		if (!$this->owner->UglyHash && $this->owner->ID) {
			$this->generateUglyHash();
		}
		parent::onBeforeWrite();
	}

	public function generateUglyHash() {
		// check if the project has Persons. If yes, take the first and his/her phone number
		$hashToSort = null;
		$persons = $this->owner->Persons();
		if ($persons->exists()) {
			foreach ($persons as $person) {
				if ($phone = $person->Phone) {
					$hashToSort = (int) preg_replace("/[^0-9]/", "", $phone);
				}
			}
		}
		$hashToSort = $hashToSort ? $hashToSort : time();

		// sort
		$digits = str_split($hashToSort);
		sort($digits, SORT_NUMERIC);
		$key = array_rand($digits, 1);
		$digits[$key] = $digits[$key] + $this->owner->ID;
		$classEnc = self::$class_enc[$this->owner->class];
		$md5 = md5(implode('', $digits));
		$hash = $classEnc . $md5;
		$this->owner->UglyHash = $hash;
	}

}

