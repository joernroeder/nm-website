<?php

class JJ_Aggregate extends Aggregate {

	protected function query($attr) {
		$singleton = singleton($this->type);
		$query = DataList::create($this->type)->where($this->filter);
		// edit by jj
		$query = $query->dataQuery()->query();
		$query->setSelect($attr);
		$query->setOrderBy(array()); 
		$singleton->extend('augmentSQL', $query);
		return $query;
	}

}