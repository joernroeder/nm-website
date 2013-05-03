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
class CategoryAdmin extends ModelAdmin {

	private static $managed_models = array(
		'Category'
	);

	private static $menu_priority = 20;

	private static $url_segment = 'categories';
	private static $menu_title = 'Categories';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);

}