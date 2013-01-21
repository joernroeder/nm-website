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

	public static $managed_models = array(
		'Project'
	);

	public static $menu_priority = 90;

	static $url_segment = 'projects';
	static $menu_title = 'Projects';

	static $extensions = array(
		'IconizedModelAdminExtension'
	);

}