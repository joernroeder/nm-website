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

	public static $managed_models = array(
		'Category'
	);

	public static $menu_priority = 20;

	static $url_segment = 'categories';
	static $menu_title = 'Categories';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}