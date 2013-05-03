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

	private static $managed_models = array(
		'GroupImage'
	);

	private static $menu_priority = 29;

	private static $url_segment = 'group-images';
	private static $menu_title = 'Group-Images';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);

}