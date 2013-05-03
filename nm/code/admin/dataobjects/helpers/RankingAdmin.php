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
class RankingAdmin extends ModelAdmin {

	private static $managed_models = array(
		'Ranking'
	);

	private static $menu_priority = 20;

	private static $url_segment = 'rankings';
	private static $menu_title = 'Rankings';
	
	private static $extensions = array(
		'IconizedModelAdminExtension'
	);
}