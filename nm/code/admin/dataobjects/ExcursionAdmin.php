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
class ExcursionAdmin extends ModelAdmin {

	private static $managed_models = array(
		'Excursion'
	);

	private static $menu_priority = 60;

	private static $url_segment = 'excursions';
	private static $menu_title = 'Excursions';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);

}