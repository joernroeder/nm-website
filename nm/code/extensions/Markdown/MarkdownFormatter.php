<?php

interface MarkdownFormatter {

	public static function formatMarkdown($input, $callee = null);

	public static function removeMarkdown($input);

}