<?php

/**
 * define api_access fields here
 *
 * ClassName, [
 * 		context (view/edit etc)	=>
 *			fields	
 *
 */
/*JJ_RestfulServer::add_fields('User', array(
	'view'	=> array(
		'FirstName',
		'Surname',
	),
	'loggedIn' => array(
		'FirstName',
		'Surname',
		'ID'
	)
));*/

Deprecation::notification_version('0.3.2', 'jjrestapi');

/*
 * module setup
 * --------------
 *
 * - override ResfulServer rule
 * - add extensions to DataObject and DataList
 *
 */
Director::addRules(20, array(
	'api/v2' => 'JJ_RestfulServer'
));

// add extension to DataObject and DataList
Object::add_extension('DataObject', 'JJ_RestApiDataObjectListExtension');
Object::add_extension('DataList', 'JJ_RestApiDataObjectListExtension');

/*JJ_RestfulServer::add_fields('TodoItem', array(
	'view' => array(
		'Created'
	)
));*/