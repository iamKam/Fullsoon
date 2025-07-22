import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import moment from "moment";
import { Row, Col, Dropdown } from "react-bootstrap";
import { cloneDeep } from "common/utils.ts";
import { useUserData } from "contexts/AuthContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";
import { useTranslation } from "react-i18next";

import { TIMES_CHECKBOXES } from "common/constants";

import CloseIcon from "assets/images/close.png";
import CalendarIcon from "assets/images/calendar_datepicker.png";

import "react-datepicker/dist/react-datepicker.css";
import CompareStatusIcon from "assets/images/icon/compare-status.svg";
const START_DATE = new Date(new Date().setDate(new Date().getDate() - 3));
const END_DATE = new Date(new Date().setDate(new Date().getDate() + 3));

const COMPARE_CHECKBOXES = [
  {
    name: "year",
    label: "Year-1",
  },
  {
    name: "month",
    label: "Month-1",
  },
  {
    name: "week",
    label: "Week-1",
  }
];

function RightYearlyOccupancy({ formData : fd, onApply : onSubmit}) {
  const { t } = useTranslation();
  const {
    filterStartEndDate,
    setFilterStartEndDate,
    filterFormData,
    setFilterFormData,
    isFilterActive,
    updateFilterButton
  } = useFilterData();

  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    year: true,
    month: false,
    week: false
  });
  const [startEndDate, setStartEndDate] = useState({
    start_date: filterStartEndDate && filterStartEndDate.start_date !== "" ? filterStartEndDate.start_date : START_DATE,
    end_date: filterStartEndDate && filterStartEndDate.end_date !== "" ? filterStartEndDate.end_date : END_DATE,
  });
  const { isFilterShown, setFilterShown, selectedRestaurantId } = useUserData();

  useEffect(() => {
    onClearAll();
  }, [selectedRestaurantId]);

  const onDateChange = (name) => (e) => {
    setStartEndDate({ ...startEndDate, [name]: e });
    setIsStartDateOpen(false);
    setIsEndDateOpen(false);
  };

  const onApply = (isInitial = false) => {
    const payload = cloneDeep({ ...formData, ...startEndDate });
    const getFormattedDate = (d) => moment(d).format("YYYY-MM-DD");

    if (payload.start_date) {
      payload.start_date = getFormattedDate(payload.start_date);
    }
    if (payload.end_date) {
      payload.end_date = getFormattedDate(payload.end_date);
    }

      // If year is true, set comparison_start_date and comparison_end_date
    if (payload.year) {
      if (payload.start_date && payload.end_date) {
        payload.comparison_start_date = moment(payload.start_date)
          .subtract(1, "year")
          .format("YYYY-MM-DD");
        payload.comparison_end_date = moment(payload.end_date)
          .subtract(1, "year")
          .format("YYYY-MM-DD");
      }
    } else if (payload.month) {
      if (payload.start_date && payload.end_date) {
        payload.comparison_start_date = moment(payload.start_date)
          .subtract(1, "month")
          .format("YYYY-MM-DD");
        payload.comparison_end_date = moment(payload.end_date)
          .subtract(1, "month")
          .format("YYYY-MM-DD");
      }
    } else if (payload.week) {
      if (payload.start_date && payload.end_date) {
        payload.comparison_start_date = moment(payload.start_date)
          .subtract(1, "week")
          .format("YYYY-MM-DD");
        payload.comparison_end_date = moment(payload.end_date)
          .subtract(1, "week")
          .format("YYYY-MM-DD");
      }
    }
  
    if (typeof isInitial === "boolean" && isInitial !== false) {
      payload.start_date = getFormattedDate(START_DATE);
      payload.end_date = getFormattedDate(END_DATE);
    }

    onSubmit(payload);
  };

  const onDropdownCheckboxChange = (name) => (e) => {
    const checked = e.target.checked;
    setFormData((prevData) => {
      const updatedData = { year: false, month: false, week: false };
      updatedData[name] = checked; // Only check the clicked checkbox
      return updatedData;
    });
  };

  const customCheckbox = ({ name, label, checked }) => (
    <div style={{ display: "flex", alignItems: "center", padding: "5px 10px" }} key={name}>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onDropdownCheckboxChange(name)}
        style={{
          marginRight: "10px",
          appearance: "none",
          width: "20px",
          height: "20px",
          border: "2px solid #E0E0E0",
          borderRadius: "3px",
          backgroundColor: checked ? "rgb(99, 83, 234)" : "#E0E0E0",
          position: "relative",
          cursor: "pointer"
        }}
      />
      <label htmlFor={name} style={{ margin: 0 }}>
        {label}
      </label>
      <style>
        {`
          input[type="checkbox"]:checked::before {
            content: "✔";
            color: white;
            font-weight: bold;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        `}
      </style>
    </div>
  );
  
  const onClearDates = () => {
    setStartEndDate({
      start_date: START_DATE,
      end_date: END_DATE,
    });
  };

  const onClearAll = () => {
    onClearDates();
    setFormData({ year: true, month: false, week: false });
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

  useEffect(() => {
    if (filterStartEndDate && filterStartEndDate.start_date !== "" && filterStartEndDate.end_date !== "") {
      setStartEndDate(filterStartEndDate);
    } else {
      setStartEndDate(startEndDate);
    }   
    // setFormData(filterFormData);
    onApply();
  }, [])

  
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
                      alt=""
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
                      alt=""
                    />
                  </div>
                </div>
              </div>

              <div className="filter-time">
                <Dropdown align="end">
                  <Dropdown.Toggle
                    style={{ width: "100%" }}
                    variant="button"
                    className="btn btn-white dropdown-toggle btn-icon"
                  >
                    <span style={{ color: "rgb(99, 83, 234)", fontWeight: "bold" }}>
                      <img src={CompareStatusIcon} alt="order-status" />
                      {t("Compare with...")}
                    </span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {COMPARE_CHECKBOXES.map((option) => {
                      return customCheckbox({
                        ...option,
                        checked: formData[option.name],
                        label: t(option.label),
                      });
                    })}
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

export default RightYearlyOccupancy;
