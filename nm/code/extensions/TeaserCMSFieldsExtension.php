<?php

class TeaserCMSFieldsExtension extends DataExtension {

	public function updateCMSFields(FieldList $fields) {
		$teaserTextArea = new TextareaField('TeaserText', 'Teaser');
		$fields->removeFieldFromTab('Root.Main', 'TeaserText');
		$fields->addFieldToTab('Root.Main', $teaserTextArea, 'StartDate');
	}	

}