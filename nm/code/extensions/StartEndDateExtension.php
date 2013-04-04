<?php

class StartEndDateExtension extends Extension {

	public function Date() {
		if ($this->owner->hasField('Date')) {
			return $this->owner->hasMethod('getDate') ? $this->owner->getDate() : $this->getFormattedDate();
		}
		else {
			$startFormat = $this->owner->stat('start_date_format');
			$endFormat = $this->owner->stat('end_date_format');

			if (!$startFormat) {
				user_error("you have to set the StartDate formatter (static \$start_date_format) in {$this->owner->class}", E_USER_ERROR);
			}

			if (!$endFormat) {
				user_error("you have to set the StartDate formatter (static \$start_date_format) in {$this->owner->class}", E_USER_ERROR);
			}

			$start = $this->owner->dbObject('StartDate');
			$end = $this->owner->dbObject('EndDate');

			return $end && $end->value ? $start->format($startFormat) . ' - ' . $end->format($endFormat) : $start->format($endFormat);
		}
	}

	/**
	 * Gibt das formatierte Start-Datum zurück
	 *
	 *  @return string
	 */
	public function FormattedStartDate() {
		return $this->getFormattedDate('Start');
	}

	/**
	 * Gibt das formatiert
	 *
	 * 
	 */
	public function getFrontendDate() {
		return $this->getFormattedDate('', 'frontend');
	}

	public function getDateRangeNice() {
		$vals = array();
		$start = $this->owner->dbObject('StartDate');
		$end = $this->owner->dbObject('EndDate');

		if ($start) {
			$vals[] = ($start->format('H:i') == '00:00') ? $start->format('d.m.Y') : $start->format('d.m.Y H:i');
		} else return '';

		if ($end && ($start->format('Y-m-d H:i:s') !== $end->format('Y-m-d H:i:s'))) {
			$vals [] = ($end->format('H:i') == '00:00') ? $end->format('d.m.Y') : $end->format('d.m.Y H:i');
		}

		return implode(' - ', $vals);
	}

	/**
	 * Gibt das formatierte End-Datum zurück
	 * 
	 *  @return string
	 */
	public function FormattedEndDate() {
		return $this->getFormattedDate('End');
	}

	/**
	 * Gibt das formatierte Datum zurück
	 *
	 * @param string $dateName Der Name des Datums z.B. 'Start' oder 'End'
	 *
	 * @return string
	 */
	public function getFormattedDate($dateName = '', $formatName = '') {
		$lowerName = strtolower($dateName);
		$formatName = $formatName ? $formatName : $lowerName;
		$format = $lowerName ? $this->owner->stat($formatName . '_date_format') : $this->owner->stat('date_format');

		if (!$format) {
			user_error("you have to set the {$dateName}Date formatter (static \${$lowerName}_date_format) in {$this->owner->class}", E_USER_ERROR);
		}

		$date = $this->owner->dbObject($dateName . 'Date');

		return $date ? $date->format($format) : '';
	}


}