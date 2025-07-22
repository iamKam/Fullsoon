import React, { useState, useEffect, useCallback } from "react";
import Form from "react-bootstrap/Form";
import DatePicker from "react-datepicker";
import moment from "moment";
import request from "services/request";
import { Row, Col, Dropdown } from "react-bootstrap";
import { cloneDeep } from "common/utils.ts";
import { useUserData } from "contexts/AuthContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";
import { useTranslation } from "react-i18next";

import { TIMES_CHECKBOXES } from "common/constants";

import CloseIcon from "assets/images/close.png";
import CalendarIcon from "assets/images/calendar_datepicker.png";
import CompareStatusIcon from "assets/images/icon/compare-status.svg";

import "react-datepicker/dist/react-datepicker.css";

const SERVICE_CHECKBOXES = [
  { name: "breakfast", label: "Breakfast" },
  { name: "lunch", label: "Lunch" },
  { name: "afternoon", label: "Afternoon" },
  { name: "dinner", label: "Dinner" },
  { name: "outsideServiceTimeslot", label: "Outside services timeslots" }
];

const START_DATE = new Date(new Date().setDate(new Date().getDate() - 3));
const END_DATE = new Date(new Date().setDate(new Date().getDate() + 3));

function RightDailyOccupancy({ formData: propFormData, onApply: onSubmit }) {
  const { t } = useTranslation();
  const { isFilterShown, setFilterShown, selectedRestaurantId } = useUserData();
  const { filterStartEndDate, setFilterStartEndDate, filterFormData, setFilterFormData, isFilterActive, updateFilterButton } = useFilterData();

  const [timeCheckboxes, setTimeCheckboxes] = useState([]);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    breakfast: false,
    lunch: false,
    afternoon: false,
    dinner: false,
    ...(timeCheckboxes.some(c => c.name === "outsideServiceTimeslot") && { 
      outsideServiceTimeslot: false 
    }),
    ...propFormData,
  });

  const [startEndDate, setStartEndDate] = useState({
    start_date: filterStartEndDate && filterStartEndDate.start_date !== "" ? filterStartEndDate.start_date : START_DATE,
    end_date: filterStartEndDate && filterStartEndDate.end_date !== "" ? filterStartEndDate.end_date : END_DATE,
  });
  
  useEffect(() => {
    const loadInitialData = async () => {
      if (filterStartEndDate && filterStartEndDate.start_date !== "" && filterStartEndDate.end_date !== "") {
        setStartEndDate(filterStartEndDate);
      }
      
      if (filterFormData) {
        setFormData(filterFormData);
      }

      try {
        const timeCheckboxes = await getFilterTimeRanges();
        setTimeCheckboxes(timeCheckboxes);
        // Include the time checkboxes in the initial apply
        onApply(false, timeCheckboxes);
      } catch (error) {
        setTimeCheckboxes(TIMES_CHECKBOXES);
        onApply(false, TIMES_CHECKBOXES);
      }
    };

    loadInitialData();
  }, [selectedRestaurantId]);

  const onDateChange = (name) => (e) => {
    setStartEndDate({ ...startEndDate, [name]: e });
    setIsStartDateOpen(false);
    setIsEndDateOpen(false);
  };

  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const getFilterTimeRanges = async () => {
    if (!selectedRestaurantId) return TIMES_CHECKBOXES;
    try {
      const result = await request.get("filters", { restaurant_id: selectedRestaurantId });
      if (!result?.time) return TIMES_CHECKBOXES;

      // Subtract 1 minute from time (handles midnight crossing)
      const subOneMinute = (time) => {
        let [h, m] = time.split(':').map(Number);
        if (m-- === 0) { m = 59; h = (h - 1 + 24) % 24; }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      // Add 1 minute to time (handles midnight crossing)
      const addOneMinute = (time) => {
        let [h, m] = time.split(':').map(Number);
        if (m++ === 59) { m = 0; h = (h + 1) % 24; }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      // Create time slots with adjusted end times
      const timeSlots = Object.entries(result.time)
        .map(([name, [start, end]]) => ({
          name,
          label: `${capitalizeFirstLetter(name)} (${start} - ${end})`,
          time: `${start}-${subOneMinute(end)}`,
          isOvernight: end < start,
          start,
          end: subOneMinute(end)
        }))
        .sort((a, b) => a.start.localeCompare(b.start));

      // Find gaps between consecutive slots
      const findGaps = (slots) => {
        const gaps = [];
        for (let i = 0; i < slots.length - 1; i++) {
          const gapStart = addOneMinute(slots[i].end);
          const gapEnd = subOneMinute(slots[i+1].start);
          if (gapStart <= gapEnd) gaps.push(`${gapStart}-${gapEnd}`);
        }
        return gaps;
      };

      const normalSlots = timeSlots.filter(s => !s.isOvernight);
      const overnightSlot = timeSlots.find(s => s.isOvernight);
      let gaps = findGaps(normalSlots);

      // Handle overnight gaps
      if (overnightSlot && normalSlots.length) {
        const gap1 = `${addOneMinute(normalSlots[normalSlots.length-1].end)}-${subOneMinute(overnightSlot.start)}`;
        const gap2 = `${addOneMinute(overnightSlot.end)}-${subOneMinute(normalSlots[0].start)}`;
        if (overnightSlot.start > normalSlots[normalSlots.length-1].end) gaps.push(gap1);
        if (overnightSlot.end < normalSlots[0].start) gaps.push(gap2);
      } else if (normalSlots.length) {
        if (normalSlots[0].start > "00:00") gaps.push(`00:00-${subOneMinute(normalSlots[0].start)}`);
        if (normalSlots[normalSlots.length-1].end < "23:59") gaps.push(`${addOneMinute(normalSlots[normalSlots.length-1].end)}-23:59`);
      }

      if (gaps.length) {
        timeSlots.push({
          name: "outsideServiceTimeslot",
          label: "Outside services timeslots",
          time: gaps.join(',')
        });
      }

      return timeSlots;
    } catch (error) {
      return TIMES_CHECKBOXES;
    }
  };

  const onApply = useCallback((isInitial = false, customTimeCheckboxes = null) => {
    const force = typeof isInitial === "boolean" ? isInitial : false;
    const effectiveTimeCheckboxes = customTimeCheckboxes || timeCheckboxes;
    // Create timeDurations object from time checkboxes
    const timeDurations = {};
    effectiveTimeCheckboxes.forEach(slot => {
      timeDurations[slot.name] = [slot.time];
    });
    let payload = cloneDeep({ 
      ...formData, 
      ...startEndDate,
      time_check_boxes: effectiveTimeCheckboxes,
      timeDurations // Add the new timeDurations property
    });

    const getFormattedDate = (d) => moment(d).format("YYYY-MM-DD");

    if (force) {
      // Reset all time-related checkboxes when clearing
      payload = { 
        ...payload,
        breakfast: false,
        lunch: false,
        afternoon: false,
        dinner: false,
        outsideServiceTimeslot: false,
        start_date: getFormattedDate(START_DATE),
        end_date: getFormattedDate(END_DATE)
      };
    } else {
      // Format dates for normal apply
      if (payload.start_date) {
        payload.start_date = getFormattedDate(payload.start_date);
      }
      if (payload.end_date) {
        payload.end_date = getFormattedDate(payload.end_date);
      }
    }

    onSubmit(payload);
  }, [formData, startEndDate, timeCheckboxes, onSubmit]);

  const onCheckboxChange = ({ target: { name } }) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const getFilteredServiceCheckboxes = () => {
    // Check if outsideServiceTimeslot exists in timeCheckboxes
    const hasOutsideServiceSlot = timeCheckboxes.some(
      checkbox => checkbox.name === "outsideServiceTimeslot"
    );

    // Filter SERVICE_CHECKBOXES based on presence of outsideServiceTimeslot
    return SERVICE_CHECKBOXES.filter(checkbox => 
      checkbox.name !== "outsideServiceTimeslot" || hasOutsideServiceSlot
    );
  };

  const onClearDates = () => {
    setStartEndDate({
      start_date: START_DATE,
      end_date: END_DATE,
    });
  };

  const onClearAll = () => {
    onClearDates();
    setFormData({
      breakfast: false,
      lunch: false,
      afternoon: false,
      dinner: false,
      ...(timeCheckboxes.some(c => c.name === "outsideServiceTimeslot") && { 
        outsideServiceTimeslot: false 
      })
    });
    onApply(true);
  };

  const setDateOpen =
    (type, checked = false) =>
    () => {
      type === "start_date"
        ? setIsStartDateOpen(checked)
        : setIsEndDateOpen(checked);
    };

  const onSaveFilter = () => {
    setFilterStartEndDate(startEndDate)
    setFilterFormData(formData); 
    updateFilterButton(true);
  }

  return (
    isFilterShown && (
      <div className="rightcontent">
        <div className="card">
          <div className="card-body">
            <Row>
              <Col lg={4}>
                <h1 style={{ whiteSpace: "nowrap" }}>{t("Filters")}</h1>
              </Col>
              <Col lg={8}>
                <div
                  className="hide-filter"
                  onClick={() => setFilterShown(false)}
                >
                  {t("HideFilters")}
                </div>
              </Col>
            </Row>

            <div className="rightcontent-fltr">
              <div className="mb-5">
                <div className="fltr-heading">
                  <label>{t("Date")}</label>
                  <button onClick={onClearDates}>{t("Clear")}</button>
                </div>
                <div className="d-flex datepicker-wrapper">
                  <span>{t("Start")}</span>
                  <div className="datepicker-wrapper-img">
                    <DatePicker
                      selected={startEndDate.start_date}
                      dateFormat="dd MMM yyyy"
                      placeholderText={t("Start date")}
                      onChange={onDateChange("start_date")}
                      className="date-picker"
                      open={isStartDateOpen}
                      onClickOutside={setDateOpen("start_date")}
                      onClick={setDateOpen("start_date", true)}
                    />
                    <img
                      src={CalendarIcon}
                      onClick={setDateOpen("start_date", !isStartDateOpen)}
                      alt="calendar"
                    />
                  </div>
                </div>
                <hr className="hr-separator" />
                <div className="d-flex datepicker-wrapper">
                  <span>{t("End")}&nbsp;&nbsp;</span>
                  <div className="datepicker-wrapper-img">
                    <DatePicker
                      selected={startEndDate.end_date}
                      dateFormat="dd MMM yyyy"
                      placeholderText={t("End date")}
                      onChange={onDateChange("end_date")}
                      className="date-picker"
                      open={isEndDateOpen}
                      onClickOutside={setDateOpen("end_date")}
                      onClick={setDateOpen("end_date", true)}
                    />
                    <img
                      src={CalendarIcon}
                      onClick={setDateOpen("end_date", !isEndDateOpen)}
                      alt="calendar"
                    />
                  </div>
                </div>
              </div>

              <div className="filter-time">
                <Dropdown align="end">
                  <Dropdown.Toggle
                    style={{ width: "100%" }}
                    variant="button"
                    className="btn btn-white dropdown-toggle btn-icon filter-time-dropdown"
                  >
                    <span style={{ color: "rgb(99, 83, 234)", fontWeight: "bold" }}>
                      <img src={CompareStatusIcon} alt="order-status" />
                      {t("Service")}
                    </span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ padding: "7px 17px" }}>
                    {getFilteredServiceCheckboxes().map(({ name, label }) => (
                      <Form.Group className="mb-2 d-flex align-items-center" key={name}>
                        <Form.Check
                          type="checkbox"
                          label={t(label)}
                          name={name}
                          checked={!!formData[name]}
                          onChange={onCheckboxChange}
                        />
                      </Form.Group>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            <div className="action-btns">
              <div className="action-btn">
                <button
                  onClick={onSaveFilter}
                  className={`close-btn full-width ${isFilterActive ? 'inactive' : 'active'}`}
                >
                  {t("FixFilters")}
                </button>
              </div>
              <div className="action-row">
                <button onClick={onClearAll} className="close-btn me-3">
                  <img src={CloseIcon} alt="clear" />
                  {t("Clear")}
                </button>
                <button onClick={onApply} className="apply-btn">
                  {t("Apply")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default RightDailyOccupancy;