<?php

global $project;
$project = 'nm';

global $databaseConfig;
$databaseConfig = array(
	"type" => 'MySQLDatabase',
	"server" => 'wp185.webpack.hosteurope.de',
	"username" => 'db10674345-nmer',
	"password" => 'y83WIsZk1SIb',
	"database" => 'db10674345-nm',
	"path" => '',
);

MySQLDatabase::set_connection_charset('utf8');

// Set the current theme. More themes can be downloaded from
// http://www.silverstripe.org/themes/
SSViewer::set_theme('tutorial');

// Set the site locale
i18n::set_locale('en_US');

// Enable nested URLs for this site (e.g. page/sub-page/)
if (class_exists('SiteTree')) SiteTree::enable_nested_urls();