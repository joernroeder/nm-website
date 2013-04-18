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
class PersonImageAdmin extends ModelAdmin {

	public static $managed_models = array(
		'PersonImage'
	);

	public static $menu_priority = 30;

	static $url_segment = 'person-images';
	static $menu_title = 'Person-Images';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}

