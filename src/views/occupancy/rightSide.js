import React, { useState, useEffect, Fragment, useRef } from "react";
import Form from "react-bootstrap/Form";
import DatePicker from "react-datepicker";
import moment from "moment";
import { Row, Col } from "react-bootstrap";
import { cloneDeep } from "common/utils.ts";
import { useUserData } from "contexts/AuthContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";
import { useTranslation } from "react-i18next";

import { TIMES_CHECKBOXES } from "common/constants";

import CloseIcon from "assets/images/close.png";
import CalendarIcon from "assets/images/calendar_datepicker.png";

import "react-datepicker/dist/react-datepicker.css";

const TRANSITIONS_CHECKBOXES = [
  { name: "eat_in", label: "Eat in" },
  { name: "take_away", label: "Eat away" },
];

const START_DATE = new Date(new Date().setDate(new Date().getDate() - 2));
const END_DATE = new Date(new Date().setDate(new Date().getDate() + 2));

function RightSide({ onApply: onSubmit, formData: fd }) {
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
  const [formData, setformData] = useState(filterFormData ?? { });
  const [startEndDate, setStartEndDate] = useState({
    start_date: filterStartEndDate && filterStartEndDate.start_date !== "" ? filterStartEndDate.start_date : START_DATE,
    end_date: filterStartEndDate && filterStartEndDate.end_date !== "" ? filterStartEndDate.end_date : END_DATE,
  });
  const { isFilterShown, setFilterShown, selectedRestaurantId } = useUserData();


  // useEffect(() => {
  //   onApply();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    // prevSelectedRestaurantId.current = selectedRestaurantId;
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

    if (typeof isInitial === "boolean" && isInitial !== false) {
      payload.start_date = getFormattedDate(START_DATE);
      payload.end_date = getFormattedDate(END_DATE);
      TIMES_CHECKBOXES.map((x) => x.name).forEach((t) => delete payload[t]);
      TRANSITIONS_CHECKBOXES.map((x) => x.name).forEach(
        (t) => delete payload[t]
      );
    }

    onSubmit(payload);
  };

  const onCheckboxChange = ({ target: { checked, name } }) => {
    setformData({ ...formData, [name]: checked });
  };
  // const onCheckboxChange = ({ target: { checked, name } }) => {
  //   setformData((prevData) => {
  //     if (TRANSITIONS_CHECKBOXES.some((item) => item.name === name)) {
  //       return {
  //         ...prevData,
  //         service_type: name
  //       };
  //     }
  //     return {
  //       ...prevData,
  //       [name]: checked,
  //     };
  //   });
  // };
  

  const customCheckbox = ({ name, label, checked }) => {
    return (
      <Form.Group className="mb-3">
        <label className="checkbox">
          <input
            type="checkbox"
            onChange={onCheckboxChange}
            name={name}
            checked={checked}
          />
          <span className="me-2" />
          {label}
        </label>
      </Form.Group>
    );
  };

  const onClearTimes = () => {
    const newFormData = cloneDeep(formData);
    TIMES_CHECKBOXES.map((x) => x.name).forEach((t) => delete newFormData[t]);
    setformData({ ...newFormData });
  };

  // const onClearTransitions = () => {
  //   const newFormData = { ...formData };
  //   delete newFormData.service_type;  
  //   setformData(newFormData);
  // };

  const onClearDates = () => {
    setStartEndDate({
      start_date: START_DATE,
      end_date: END_DATE,
    });
  };

  const onClearAll = () => {
    onClearDates();
    setformData({});
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
    setformData(filterFormData);
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

              {/* <div className="mb-5">
                <div className="fltr-heading">
                  <label>{t("TransationType")}</label>
                  <button onClick={onClearTransitions}>{t("Clear")}</button>
                </div>
                {TRANSITIONS_CHECKBOXES.map((check, i) => (
                  <Fragment key={i}>
                    {customCheckbox({
                      name: check.name,
                      label: t(check.label),
                      // checked: formData[check.name],
                      checked: formData.service_type === check.name,
                    })}
                  </Fragment>
                ))}
              </div> */}

              <div>
                <div className="fltr-heading">
                  <label>{t("Time")}</label>
                  <button onClick={onClearTimes}>{t("Clear")}</button>
                </div>
                {TIMES_CHECKBOXES.map((check, i) => {
                  const [labelName, ...rest] = check.label.split(" ");
                  const label = t(labelName) + " " + rest.join(" ");
                  return (
                    <Fragment key={i}>
                      {customCheckbox({
                        name: check.name,
                        label,
                        checked: formData[check.name] || false,
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            <div className="action-btns" style={{
                  display: "flex",
                  justifyContent: "center",
                  flexDirection: "column"
              }}>
                <div 
                  style={{
                    marginBottom : "7px"
                  }}
                >
                  <button onClick={onSaveFilter} className="close-btn me-3" 
                    style={{
                      width : "100%",
                      color : isFilterActive ? "#8b8f94" : "#6353ea"
                    }}
                  >
                    {t("FixFilters")}
                  </button>
                </div>
                <div style={{
                  display:"flex"
                }}>
                  <button onClick={onClearAll} className="close-btn me-3">
                    <img src={CloseIcon} alt="" />
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

export default RightSide;
