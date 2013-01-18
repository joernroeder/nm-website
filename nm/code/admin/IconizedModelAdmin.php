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

/**
 * Iconized Model-Admin
 *
 */
class IconizedModelAdminExtension extends DataExtension {

	function extraStatics($class = NULL, $extension = NULL) {
		$className = str_replace('admin', '', strtolower($class));

		return array(
			'menu_icon'	=> 'nm/images/admin/' . $className . '16.png'
		);
	}
}