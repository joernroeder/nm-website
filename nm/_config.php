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
DataObject::add_extension('ResponsiveImage', 'ResponsiveImageCaptionExtension');


// ! Admin-Config ---------------------------------

DateField::set_default_config('showcalendar', true);
SecurityAdmin::$menu_icon = '/nm/images/admin/login16.png'; // Überschreiben des Security-Admin icons
SecurityAdmin::$menu_priority = 39;
Object::add_extension('LeftAndMain', 'LeftAndMainExtension');

//CMSMenu::remove_menu_item('Help');


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