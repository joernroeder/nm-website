<?php

// ! Server Einstellungen -------------------------

ini_set('memory_limit', '1000M');


// ! Globale Silverstripe Einstellung -------------

Deprecation::notification_version('3.2.0');

global $project;
$project = 'nm';

global $database;
$database = 'db10674345-nm';

MySQLDatabase::set_connection_charset('utf8');

i18n::set_locale('en_US');
if (class_exists('SiteTree')) SiteTree::enable_nested_urls();

// ! Admin-Config ---------------------------------

//CMSMenu::remove_menu_item('Help');

/*SS_Cache::add_backend('two-level', 'TwoLevels', array(
 	'slow_backend' => 'File',
 	'fast_backend' => 'xcache',
 	'slow_backend_options' => array(
 		'cache_dir' => TEMP_FOLDER . DIRECTORY_SEPARATOR . 'cache'
 	)
));

SS_Cache::pick_backend('two-level', 'any', 20);*/


// include environment config 
require_once('conf/ConfigureFromEnv.php');