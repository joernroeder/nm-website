<?php

// ! Server Einstellungen -------------------------

ini_set('memory_limit', '1000M');


// ! Globale Silverstripe Einstellung -------------

global $project;
$project = 'nm';

global $database;
$database = 'db10674345-nm';

MySQLDatabase::set_connection_charset('utf8');

SSViewer::set_theme('nm');

i18n::set_locale('en_US');
if (class_exists('SiteTree')) SiteTree::enable_nested_urls();


// ! DataObject Extensions ------------------------

DataObject::add_extension('Member', 'MemberPersonExtension');


// ! Admin-Config ---------------------------------

DateField::set_default_config('showcalendar', true);


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