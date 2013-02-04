<?php

class StartEndDateExtension extends Extension {

	public function Date() {
		if ($this->owner->hasField('Date')) {
			return $this->owner->hasMethod('Date') ? $this->owner->Date() : $this->getFormattedDate();
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
	 * Gibt das formattierte Start-Datum zurück
	 *
	 *  @return string
	 */
	public function FormattedStartDate() {
		return $this->getFormattedDate('Start');
	}

	/**
	 * Gibt das formattierte End-Datum zurück
	 *
	 *  @return string
	 */
	public function FormattedEndDate() {
		return $this->getFormattedDate('End');
	}

	/**
	 * gibt das formatierte Datum zurück
	 *
	 * @param string $dateName Der Name es Datums z.B. 'Start' oder 'End'
	 *
	 * @return string
	 */
	public function getFormattedDate($dateName = '') {
		$lowerName = strtolower($dateName);
		$format = $lowerName ? $this->owner->stat($lowerName . '_date_format') : $this->owner->stat('date_format');

		if (!$format) {
			user_error("you have to set the {$dateName}Date formatter (static \${$lowerName}_date_format) in {$this->owner->class}", E_USER_ERROR);
		}

		$date = $this->owner->dbObject($dateName . 'Date');

		return $date ? $date->format($format) : '';
	}


}