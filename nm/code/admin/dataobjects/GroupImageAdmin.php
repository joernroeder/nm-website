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
class GroupImageAdmin extends ModelAdmin {

	public static $managed_models = array(
		'GroupImage'
	);

	public static $menu_priority = 29;

	static $url_segment = 'group-images';
	static $menu_title = 'Group-Images';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}