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

	public static $managed_models = array(
		'Excursion'
	);

	static $url_segment = 'excursions';
	static $menu_title = 'Excursions';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}