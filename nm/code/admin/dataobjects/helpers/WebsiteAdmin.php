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
class WebsiteAdmin extends ModelAdmin {

	private static $managed_models = array(
		'Website'
	);

	private static $menu_priority = 20;

	private static $url_segment = 'websites';
	private static $menu_title = 'Websites';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);
}