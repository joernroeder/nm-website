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

	public static $managed_models = array(
		'Ranking'
	);

	static $url_segment = 'rankings';
	static $menu_title = 'Rankings';
	
	static $extensions = array(
		'IconizedModelAdminExtension'
	);
}