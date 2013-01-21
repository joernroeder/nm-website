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
class ExhibitionAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Exhibition'
	);

	public static $menu_priority = 70;

	static $url_segment = 'exhibitions';
	static $menu_title = 'Exhibitions';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}