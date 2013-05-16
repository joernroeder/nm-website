<?php

class MarkdownedTextExtension extends DataExtension {

	private static $markdown_extensions = array(
		'Text' => array(
			'Image',
			'ImageBlock',
			'Embed'
		),

		'TeaserText' => array(
		)
	);

	private function get_markdown_extensions() {
		return self::$markdown_extensions;
	}

	public function getMarkdownedText() {
		return $this->owner->MarkdownHyphenated('Text', array('ResponsiveImage', 'OEmbed', 'Cite'));
	}

	public function getMarkdownedTeaser() {
		return $this->owner->MarkdownHyphenated('TeaserText');
	}

}