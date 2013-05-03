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
class ProjectAdmin extends ModelAdmin {

	private static $managed_models = array(
		'Project'
	);

	private static $menu_priority = 90;

	private static $url_segment = 'projects';
	private static $menu_title = 'Projects';

	private static $extensions = array(
		'IconizedModelAdminExtension'
	);

}