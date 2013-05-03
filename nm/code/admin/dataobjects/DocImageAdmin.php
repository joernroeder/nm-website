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
class DocImageAdmin extends ModelAdmin {

	private static $managed_models = array(
		'DocImage'
	);

	private static $menu_priority = 30;

	private static $url_segment = 'images';
	private static $menu_title = 'Images';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);

}

