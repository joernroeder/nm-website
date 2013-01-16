<?php


ini_set('memory_limit', '1000M');

global $project;
$project = 'nm';

global $database;
$database = 'db10674345-nm';

MySQLDatabase::set_connection_charset('utf8');

// Set the current theme. More themes can be downloaded from
// http://www.silverstripe.org/themes/
SSViewer::set_theme('nm');

// Set the site locale
i18n::set_locale('en_US');

// Enable nested URLs for this site (e.g. page/sub-page/)
if (class_exists('SiteTree')) SiteTree::enable_nested_urls();

require_once('conf/ConfigureFromEnv.php');

// Database config for php unit testing
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