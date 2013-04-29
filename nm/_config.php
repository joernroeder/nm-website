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

SSViewer::set_theme('nm');

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

// ! JJRestApi ------------------------------------


Structure_RestApiExtension::add(array(
	'Person'
));

Structure_RestApiExtension::ignore(array(
	'Member',
	'Ranking',
	//'DashboardPanel',
	'Group',
	'Permission',
	'PermissionRole',
	'PermissionRoleCode',
	'ResponsiveImage',
	'ResponsiveImageObject',
	'File'
));

CSRFProtection_RestApiExtension::enable_for(array(
	'POST',
	'PUT',
	'DELETE',
	'PATCH'
));


// include environment config 
require_once('conf/ConfigureFromEnv.php');



// ! Database config for php unit testing ---------

if (Director::isDev()) {
	Session::start();
	if(@$_GET['db']) {
		$db = $_GET['db'];
	} elseif(@$_SESSION['db']) {
		$db = $_SESSION['db'];
	} else {
		$db = null;
	}

	if($db) {
		global $databaseConfig;
		if($db == 'test') {
			$databaseConfig['type'] = 'MySQLDatabase';
			$databaseConfig['server'] = TEST_DB_SERVER;
			$databaseConfig['username'] = TEST_DB_USER;
			$databaseConfig['password'] = TEST_DB_PASS;
		} 
	}
}