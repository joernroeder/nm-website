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
class CalendarEntryAdmin extends ModelAdmin {

	public static $managed_models = array(
		'CalendarEntry'
	);

	public static $menu_priority = 80;

	static $url_segment = 'calendar';
	static $menu_title = 'Calendar';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}