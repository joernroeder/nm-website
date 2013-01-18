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
class PersonAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Person'
	);

	static $url_segment = 'persons';
	static $menu_title = 'Persons';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}