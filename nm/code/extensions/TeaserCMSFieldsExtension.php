<?php

class TeaserCMSFieldsExtension extends DataExtension {

	public function updateCMSFields(FieldList $fields) {
		$fields->removeByName('TeaserText');
		$fields->insertBefore(new TextareaField('TeaserText', 'Teaser'), 'Text');
	}

}