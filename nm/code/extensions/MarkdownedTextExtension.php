<?php

class MarkdownedTextExtension extends DataExtension {

	public function getMarkdownedText() {
		return $this->owner->MarkdownHyphenated('Text');
	}

	public function getMarkdownedTeaser() {
		return $this->owner->MarkdownHyphenated('TeaserText');
	}

}