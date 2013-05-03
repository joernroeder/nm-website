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

	private static $managed_models = array(
		'CalendarEntry'
	);

	private static $menu_priority = 80;

	private static $url_segment = 'calendar';
	private static $menu_title = 'Calendar';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);

}