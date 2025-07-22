import React, { useState, useEffect, Fragment, useRef } from "react";
import Form from "react-bootstrap/Form";
import { Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { useTranslation } from "react-i18next";

import { useUserData } from "contexts/AuthContextManagement";
import { MEAL_CATEGORIES, TIMES_CHECKBOXES } from "common/constants";
import { meals } from "../occupancy/data";

import CloseIcon from "../../assets/images/close.png";
import CalendarIcon from "../../assets/images/calendar_datepicker.png";

import "react-datepicker/dist/react-datepicker.css";

const TRANSITIONS_CHECKBOXES = [
  {
    name: "eat_in",
    label: "Eat in",
  },
  {
    name: "eat_away",
    label: "Eat away",
  },
];

const options = meals.map((m) => ({ value: m, label: m }));

function RightSide({ onApply: onSubmit, formData: fd }) {
  const selectRef = useRef(null);
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState([]);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [formData, setformData] = useState({});
  const [startEndDate, setStartEndDate] = useState({
    start_date: new Date(),
    end_date: new Date(),
  });
  const { isFilterShown, setFilterShown, selectedRestaurantId } = useUserData();
  const prevSelectedRestaurantId = useRef(selectedRestaurantId);

  // useEffect(() => {
  //   onApply(true);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    if (prevSelectedRestaurantId.current === selectedRestaurantId) return;
    // prevSelectedRestaurantId.current = selectedRestaurantId;
    onClearAll();
  }, [selectedRestaurantId]);

  const onDateChange = (name) => (e) => {
    setStartEndDate({ ...startEndDate, [name]: e });
    setIsStartDateOpen(false);
    setIsEndDateOpen(false);
  };

  const onApply = (isInitial = false) => {
    const payload = JSON.parse(
      JSON.stringify({
        ...formData,
        ...startEndDate,
        mealTypes: Object.keys(formData?.mealTypes ?? {}).filter((y) => {
          if (formData.mealTypes[y]) {
            return y;
          }
        }),
      })
    );
    if (payload.start_date) {
      payload.start_date = new Date(payload.start_date)
        .toISOString()
        .split("T")[0];
    }
    if (payload.end_date) {
      payload.end_date = new Date(payload.end_date).toISOString().split("T")[0];
    }
    payload.meals = selectedOption.map((s) => s.value);
    if (typeof isInitial === "boolean" || payload.meals.length === 0) {
      payload.meals = meals;
    }
    if (typeof isInitial === "boolean" && isInitial !== false) {
      TIMES_CHECKBOXES.map((x) => x.name).forEach((t) => delete payload[t]);
      payload.mealTypes = [];
    }

    onSubmit(payload);
  };

  const onCheckboxChange =
    (type) =>
    ({ target: { checked, name } }) => {
      setformData({
        ...formData,
        ...(type === null && { [name]: checked }),
        ...(type === "mealTypes" && {
          [type]: { ...formData[type], [name]: checked },
        }),
      });
    };

  const customCheckbox = ({ name, label, checked, type = null }) => {
    return (
      <Form.Group className="mb-3">
        <label className="checkbox">
          <input
            type="checkbox"
            onChange={onCheckboxChange(type)}
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
    const newFormData = JSON.parse(JSON.stringify(formData));
    TIMES_CHECKBOXES.map((x) => x.name).forEach((t) => delete newFormData[t]);
    setformData({ ...newFormData });
  };

  const onClearTransitions = () => {
    const newFormData = JSON.parse(JSON.stringify(formData));
    TRANSITIONS_CHECKBOXES.map((x) => x.name).forEach(
      (t) => delete newFormData[t]
    );
    setformData({ ...newFormData });
  };

  const onClearDates = () => {
    setStartEndDate({
      start_date: new Date().setDate(new Date().getDate() - 30),
      end_date: new Date(),
    });
  };

  const onClearAll = () => {
    onClearDates();
    setformData({});
    setSelectedOption([]);
    onClearMeals();
    onApply(true);
  };

  const setDateOpen =
    (type, checked = false) =>
    () => {
      type === "start_date"
        ? setIsStartDateOpen(checked)
        : setIsEndDateOpen(checked);
    };

  const colourStyles = {
    option: (styles, { data, isDisabled, isFocused, isSelected, ...args }) => {
      return {
        ...styles,
        backgroundColor: isDisabled
          ? undefined
          : isSelected
          ? data.color
          : isFocused
          ? "#F3F4FB"
          : undefined,
        color: isDisabled ? "#ccc" : isSelected ? "black" : "black",
      };
    },
    multiValueLabel: (base) => ({ ...base }),
  };

  const onClearMeals = () => {
    if (selectRef?.current) {
      selectRef.current.clearValue();
    }
  };

  const onClearMealTypes = () => {
    setformData({ ...formData, mealTypes: {} });
  };

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
                  <label>{t("Meals")}</label>
                  <button onClick={onClearMeals}>{t("Clear")}</button>
                </div>
                <Select
                  ref={selectRef}
                  styles={colourStyles}
                  defaultValue={selectedOption}
                  onChange={setSelectedOption}
                  components={makeAnimated()}
                  options={options}
                  isMulti
                  isSearchable
                  placeholder={t("SelectMeals")}
                  theme={(theme) => {
                    return {
                      ...theme,
                      borderRadius: 10,
                      colors: {
                        ...theme.colors,
                        danger: "#fff",
                        dangerLight: "hsl(53deg 2% 73%)",
                      },
                    };
                  }}
                />
              </div>

              <div className="mb-5">
                <div className="fltr-heading">
                  <label>{t("Transation type")}</label>
                  <button onClick={onClearTransitions}>{t("Clear")}</button>
                </div>
                {TRANSITIONS_CHECKBOXES.map((check, i) => (
                  <Fragment key={i}>
                    {customCheckbox({
                      name: check.name,
                      label: t(check.label),
                      checked: formData[check.name] || false,
                    })}
                  </Fragment>
                ))}
              </div>
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

              <div className="mt-4">
                <div className="fltr-heading">
                  <label>{t("Meal Types")}</label>
                  <button onClick={onClearMealTypes}>{t("Clear")}</button>
                </div>
                {MEAL_CATEGORIES.map((check, i) => {
                  const label = t(check.label);
                  return (
                    <Fragment key={i}>
                      {customCheckbox({
                        name: check.id,
                        label,
                        checked: formData?.["mealTypes"]?.[check.id] || false,
                        type: "mealTypes",
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            <div className="action-btns">
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
    )
  );
}

export default RightSide;
