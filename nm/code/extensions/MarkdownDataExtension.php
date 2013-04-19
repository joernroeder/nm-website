<?php

class MarkdownDataExtension extends DataExtension {

	public static $markdown_path = '/code/thirdparty/markdown/markdown.php';

	static $regex_img = "^\[img (.*?)\]^";
	static $img_class = 'ResponsiveImage';

	static $excerpt_len = 200;

	public function __construct() {
		global $project;

		include_once (Director::baseFolder() . '/' . $project . self::$markdown_path);
		parent::__construct();
	}

	public function Markdown($fieldName) {
		$mdText = $this->owner->$fieldName;
		if (!$mdText) return '';

		return $this->MarkdownText($mdText);
	}

	public function MarkdownText($text) {
		$mdText = Markdown($text);

		if (!$mdText) return '';

		preg_match_all(self::$regex_img, $text, $ids, PREG_PATTERN_ORDER);

		$found = $ids[0];
		if (!empty($found)) {
			foreach ($found as $key => $value) {
				$imgID = $ids[1][$key];
				$arr = explode(' ', $imgID);
				$imgID = (int) $arr[0];
				$maxWidth = (isset($arr[1]) && $arr[1]) ? 'max-width:' . $arr[1] : null;
				$img = DataObject::get_by_id(self::$img_class, (int) $imgID);
				if ($img->exists()) {
					$mdText = str_replace($value, $img->getTag(null, null, $maxWidth), $mdText);
				}
			}
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

	public function MarkdownHyphenated($fieldName) {
		return $this->owner->getHyphenatedText($this->owner->Markdown($fieldName));
	}

	public function ExcerptMarkdownHyphenated($fieldName) {
		return $this->owner->getHyphenatedText($this->owner->ExcerptMarkdown($fieldName));
	}
}