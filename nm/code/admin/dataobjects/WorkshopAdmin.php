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
class WorkshopAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Workshop'
	);

	public static $menu_priority = 50;

	static $url_segment = 'workshops';
	static $menu_title = 'Workshops';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}