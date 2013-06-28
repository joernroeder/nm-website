<?php

class CiteFormatter extends MarkdownFormatterExtension {

	public static $indicator = 'Cite';
	public static $regex = '/""(.*?)""/';

	public static function formatMarkdown($mdText, $callee = null) {

		preg_match_all(self::$regex, $mdText, $res, PREG_PATTERN_ORDER);

		if (!empty($res) && sizeof($res) >= 2) {
			foreach ($res[0] as $i => $found) {
				$value = '<cite>' . $res[1][$i] . '</cite>';
				$mdText = str_replace($found, $value, $mdText);
			}
		}

		return $mdText;
	}

}