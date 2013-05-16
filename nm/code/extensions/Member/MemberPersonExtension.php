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

class MemberPersonExtension extends DataExtension {

	private static $has_one = array(
		'Person'	=> 'Person'		// Personenobjekt
	);

	public function updateCMSFields(FieldList $fields) {

		$dropDownField = new DropdownField(
			'PersonID',
			'Person',
			Person::get()->map('ID', 'FullName')
        );
        
        $dropDownField->setHasEmptyDefault(true);
        $dropDownField->setEmptyString('(none)');

        $fields->addFieldToTab('Root.Main', $dropDownField);
	}

	public function updateSummaryFields(&$fields) {
		$fields = array(
			'FullName' 	=> 'Full Name',
			'Email'		=> 'Email',
			'Person.FullName'	=> 'Person'
		);
	}

	public function getFullName() {
		$name = '';
		$name .= $this->owner->FirstName ? $this->owner->FirstName . ' ' : '';
		$name .= $this->owner->Surname ? $this->owner->Surname : '';
		return $name;
	}

}