<?php

class MarkdownedTextExtension extends DataExtension {

	static $markdown_extensions = array(
		'Text' => array(
			'Image',
			'ImageBlock',
			'Embed'
		),

		'TeaserText' => array(
		)
	);

	public function getMarkdownedText() {
		return $this->owner->MarkdownHyphenated('Text');
	}

	public function getMarkdownedTeaser() {
		return $this->owner->MarkdownHyphenated('TeaserText');
	}

}