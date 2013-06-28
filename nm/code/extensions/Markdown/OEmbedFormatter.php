<?php

class OEmbedFormatter extends MarkdownFormatterExtension {

	public static $indicator = 'OEmbed';

	public static $regex = "^\[embed (.*?)\]^";

	public static $default_opts = array(
	);

	public static function formatMarkdown($mdText, $callee = null) {

		preg_match_all(self::$regex, $mdText, $res, PREG_PATTERN_ORDER);
		$found = $res[0];

		if (!empty($found)) {
			foreach ($found as $key => $value) {
				// remove exceeding whitespaces
				$tmp = trim(preg_replace('/\s+/', ' ',$res[1][$key]));
				$args = explode(' ', $tmp);

				// @todo: possible options
				$url = array_shift($args);
				$options = array_merge(self::$default_opts, $args);
				
				$oembed = Oembed::handle_shortcode($options, $tmp, null, null);
				$mdText = str_replace($value, $oembed, $mdText);
			}
		}

		return $mdText;
	}

}