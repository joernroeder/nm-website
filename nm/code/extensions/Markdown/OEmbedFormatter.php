<?php

class OEmbedFormatter extends MarkdownFormatterExtension {

	public static $indicator = 'OEmbed';

	public static $regex = "^\[embed (.*?)\]^";


	public static function formatMarkdown($mdText, $callee = null) {

		preg_match_all(self::$regex, $mdText, $res, PREG_PATTERN_ORDER);
		$found = $res[0];

		if (!empty($found)) {
			foreach ($found as $key => $value) {
				// remove exceeding whitespaces
				$tmp = trim(preg_replace('/\s+/', ' ',$res[1][$key]));
				$args = explode(' ', $tmp);

				$url = array_shift($args);
				$options = array();

				$discoveredUrl = self::autodiscover_from_url($url);

				foreach ((array) Config::inst()->get('OembedOptions', 'options') as $scheme => $provider_options) {
					if (self::matches_scheme($discoveredUrl, $scheme)) {
						$options = array_merge($provider_options, $args);
					}
				}
				
				$oembed = Oembed::handle_shortcode($options, $tmp, null, null);

				$mdText = str_replace($value, $oembed, $mdText);
			}
		}

		return $mdText;
	}

	/**
	 * Performs a HTTP request to the URL and scans the response for resource links
	 * that mention oembed in their type.
	 *
	 * @param $url Human readable URL.
	 * @returns string/bool Oembed URL, or false.
	 */
	protected static function autodiscover_from_url($url) {
		// Fetch the URL (cache for a week by default)
		$service = new RestfulService($url, 60*60*24*7);
		$body = $service->request();
		if(!$body || $body->isError()) {
			return false;
		}
		$body = $body->getBody();

		// Look within the body for an oembed link.
		$pcreOmbed = '#<link[^>]+?(?:href=[\'"](.+?)[\'"][^>]+?)'
			. '?type=["\']application/json\+oembed["\']'
			. '(?:[^>]+?href=[\'"](.+?)[\'"])?#';

		if(preg_match_all($pcreOmbed, $body, $matches, PREG_SET_ORDER)) {
			$match = $matches[0];
			if(!empty($match[1])) {
				return html_entity_decode($match[1]);
			}
			if(!empty($match[2])) {
				return html_entity_decode($match[2]);
			}
		}
		return false;
	}


	/**
	 * Checks the URL if it matches against the scheme (pattern).
	 *
	 * @param $url Human-readable URL to be checked.
	 * @param $scheme Pattern to be matched against.
	 * @returns bool Whether the pattern matches or not.
	 */
	protected static function matches_scheme($url, $scheme) {
		$urlInfo = parse_url($url);
		$schemeInfo = parse_url($scheme);
		foreach($schemeInfo as $k=>$v) {
			if(!array_key_exists($k, $urlInfo)) {
				return false;
			}
			if(strpos($v, '*') !== false) {
				$v = preg_quote($v, '/');
				$v = str_replace('\*', '.*', $v);
				if($k == 'host') {
					$v = str_replace('*\.', '*', $v);
				}
				if(!preg_match('/' . $v . '/', $urlInfo[$k])) {
					return false;
				}
			} elseif(strcasecmp($urlInfo[$k], $v)) {
				return false;
			}
		}
		return true;
	}

}