<?php

class MarkdownDataExtension extends DataExtension {

	public static $markdown_path = '/code/thirdparty/markdown/markdown.php';

	static $excerpt_len = 200;

	public function __construct() {
		global $project;

		include_once (Director::baseFolder() . '/' . $project . self::$markdown_path);
		parent::__construct();
	}

	public function Markdown($fieldName, $extensions = null) {
		$mdText = $this->owner->$fieldName;
		if (!$mdText) return '';

		return $this->MarkdownText($mdText, $extensions);
	}

	public function MarkdownText($text, $extensions = null) {

		// normal markdown
		$mdText = Markdown($text);

		if (!$mdText) return '';
		if (!$extensions || !is_array($extensions)) $extensions = array();

		// check for extensions
		$possible = MarkdownFormatterExtension::getSubclasses();
		$use = array();
		$remove = array();
		foreach ($possible as $p) {
			$key = isset($p::$indicator) ? $p::$indicator : $p;
			if (in_array($key, $extensions)) {
				$use[] = $p;
			} else {
				$remove[] = $p;
			}
		}
		// remove unnecessary markdown tags
		foreach ($remove as $r) {
			$mdText = $r::removeMarkdown($mdText);
		}
		foreach ($use as $u) {
			$mdText = $u::formatMarkdown($mdText);
		}
		
		return $mdText;
	}

	public function ExcerptMarkdown($fieldName) {
		$mdText = $this->owner->$fieldName;
		if (!$mdText) return '';

		//$mdText = Markdown($mdText);

		// get the first image
		preg_match_all(self::$regex_img, $mdText, $ids, PREG_PATTERN_ORDER);
		$found = $ids[0];
		$imgTag = '';
		if (!empty($found)) {
			$imgID = $ids[1][0];
			$img = DataObject::get_by_id(self::$img_class, (int) $imgID);
			$imgTag = $img->getTag();
		}


		// remove image occurences and shorten text
		$mdText = Markdown($this->owner->dbObject($fieldName)->FirstParagraph());
		$mdText = preg_replace(self::$regex_img, '', $mdText);
		return $imgTag . $mdText;

	}

	/*
	** Hyphenations
	*/

	public function MarkdownHyphenated($fieldName, $extensions = null) {
		return $this->owner->getHyphenatedText($this->owner->Markdown($fieldName, $extensions));
	}

	public function ExcerptMarkdownHyphenated($fieldName, $extensions = null) {
		return $this->owner->getHyphenatedText($this->owner->ExcerptMarkdown($fieldName, $extensions));
	}
}