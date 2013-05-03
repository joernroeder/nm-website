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

	private static $managed_models = array(
		'Person'
	);

	private static $menu_priority = 40;

	private static $url_segment = 'persons';
	private static $menu_title = 'Persons';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);

}