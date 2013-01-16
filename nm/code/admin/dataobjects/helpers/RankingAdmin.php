<?php

class RankingAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Ranking',
	);

	static $url_segment = 'rankings';
	static $menu_title = 'Rankings';

}