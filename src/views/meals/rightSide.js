import React, { useState, Fragment, useRef, useMemo, useCallback, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import DatePicker from "react-datepicker";
import moment from "moment";
import { Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import request from "services/request";

import SelectAsyncPaginate from "components/selectAsyncPaginate/index.tsx";
import { TIMES_CHECKBOXES } from "common/constants";
import { cloneDeep } from "common/utils";
import { useFilterData } from "contexts/FilterContextManagment";
import { useUserData } from "contexts/AuthContextManagement";

import CloseIcon from "assets/images/close.png";
import CalendarIcon from "assets/images/calendar_datepicker.png";
import tableMealsDummy from "../../data/table_meals.json";

import "react-datepicker/dist/react-datepicker.css";
import CustomModal from "./mealListModal";
import { myResturants } from "views/occupancy/data";

const START_DATE = new Date(new Date().setDate(new Date().getDate() - 1));
const END_DATE = new Date(new Date().setDate(new Date().getDate() - 1));

function RightSide({ onApply: onSubmit }) {
  const { t } = useTranslation();
  
  const {
    isFilterShown,
    setFilterShown,
    restaurants,
    hasRetaurants,
    isRestaurantLoaded,
    selectedRestaurant,
    selectedRestaurantId,
  } = useUserData();

  const {
    selectedFilterMeals,
    setSelectedFilterMeals,
    selectedFilterMyRestaurants,
    setSelectedFilterMyRestaurants,
    filterStartEndDate,
    setFilterStartEndDate,
    filterFormData,
    setFilterFormData,
    isFilterActive,
    updateFilterButton
  } = useFilterData();

  const selectMyRestaurantRef = useRef(null);
  const [selectedOption, setSelectedOption] = useState(selectedFilterMeals ?? []);
  const [selectedMyRestaurants, setSelectedMyRestaurants] = useState(selectedFilterMyRestaurants ?? []);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [formData, setformData] = useState(filterFormData ?? { total: true });
  const [isModal, setIsModal] = useState(false);
  const [mealsList, setMealsList] = useState([]);
  const [timeCheckboxes, setTimeCheckboxes] = useState([]);
  const [resturantOptions, setResturantOptions] = useState(restaurants);
  const [startEndDate, setStartEndDate] = useState({
    start_date: filterStartEndDate && filterStartEndDate.start_date !== "" ? filterStartEndDate.start_date : START_DATE,
    end_date: filterStartEndDate && filterStartEndDate.end_date !== "" ? filterStartEndDate.end_date : END_DATE,
  });

  let dummyDatasource = useMemo(
    () =>
      tableMealsDummy.meals.map((m) => ({
        value: m.name,
        label: m.name,
        name: m.name,
        item_id: m.id,
      })),
    []
  );

  let dummyRestaurantDatasource = useMemo(
    () =>
      myResturants.map((m) => ({
        value: m.name,
        label: m.name,
        name: m.name,
        id: m.id,
      })),
    []
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setSelectedMyRestaurants(selectedFilterMyRestaurants);
      setSelectedOption(selectedFilterMeals);
      setformData(filterFormData ?? { total: true });
      setStartEndDate(
        filterStartEndDate?.start_date && filterStartEndDate?.end_date 
          ? filterStartEndDate 
          : { start_date: START_DATE, end_date: END_DATE }
      );

      // Load time filters
      try {
        const timeCheckboxes = await getFilterTimeRanges();
        setTimeCheckboxes(timeCheckboxes);
        // Call onApply with the dynamic checkboxes directly
        onApply(false, timeCheckboxes);
      } catch (error) {
        console.error("Failed to load time checkboxes:", error);
        setTimeCheckboxes(TIMES_CHECKBOXES);
        onApply(); // Still call onApply with defaults
      }
    };

    loadInitialData();
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (isRestaurantLoaded && !hasRetaurants) {
      onClearAll();
      setResturantOptions(dummyRestaurantDatasource);
    }
    setResturantOptions(restaurants)
  }, [hasRetaurants, isRestaurantLoaded, dummyRestaurantDatasource]);

  useEffect(() => {
    if (restaurants[0]?.id !== selectedRestaurantId) {
      onClearAll();
    }
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    if (isModal === false) {
      const getMealsList = async () => {
        const result = await request.get("meal-lists", {
          restaurant_id: selectedRestaurantId
        });
        setMealsList(result.meal_lists);
      };
      getMealsList();
    }
  }, [isModal, selectedRestaurantId]);

  const getFilterTimeRanges = async () => {
    if (!selectedRestaurantId) {
      return TIMES_CHECKBOXES; // Return defaults instead of setting state
    }

    try {
      const result = await request.get("filters", {
        restaurant_id: selectedRestaurantId,
      });
      
      const subtractOneMinute = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        date.setMinutes(date.getMinutes() - 1);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      };

      const addOneMinute = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        date.setMinutes(date.getMinutes() + 1);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      };

      const dynamicTimeCheckboxes = [];

      if (result?.time) {
        const timeData = result.time;
        
        // Process all time ranges
        const ranges = Object.entries(timeData).map(([key, [start, end]]) => {
          const isOvernight = end < start;
          const adjustedEnd = subtractOneMinute(end);
          
          dynamicTimeCheckboxes.push({
            name: key,
            label: `${capitalizeFirstLetter(key)} (${start} - ${end})`,
            time: `${start}-${adjustedEnd}`,
          });

          return { start, end: adjustedEnd, isOvernight, originalEnd: end };
        });

        // Sort ranges by start time
        const sortedRanges = ranges.sort((a, b) => a.start.localeCompare(b.start));
        const missingRanges = [];

        // Separate overnight and normal ranges
        const overnightRange = sortedRanges.find(range => range.isOvernight);
        const normalRanges = sortedRanges.filter(range => !range.isOvernight);

        // Check gaps between normal ranges
        for (let i = 0; i < normalRanges.length - 1; i++) {
          const gapStart = addOneMinute(normalRanges[i].end);
          const gapEnd = subtractOneMinute(normalRanges[i + 1].start);
          if (gapStart <= gapEnd) {
            missingRanges.push(`${gapStart}-${gapEnd}`);
          }
        }

        // Handle the overnight range case
        if (overnightRange) {
          // Check gap between last normal range and overnight range start
          if (normalRanges.length > 0) {
            const lastNormalEnd = normalRanges[normalRanges.length - 1].end;
            const gapStart = addOneMinute(lastNormalEnd);
            const gapEnd = subtractOneMinute(overnightRange.start);
            if (gapStart <= gapEnd) {
              missingRanges.push(`${gapStart}-${gapEnd}`);
            }
          }

          // The time after overnight end (02:00) until first normal range start
          const overnightEnd = overnightRange.end;
          const firstNormalStart = normalRanges[0]?.start || "00:00";
          
          // Only add this gap if it's before the first normal range
          if (overnightEnd < firstNormalStart) {
            const gapStart = addOneMinute(overnightEnd);
            const gapEnd = subtractOneMinute(firstNormalStart);
            if (gapStart <= gapEnd) {
              missingRanges.push(`${gapStart}-${gapEnd}`);
            }
          }
        } else {
          // Handle non-overnight case (original logic)
          if (normalRanges.length > 0) {
            // Check gap before first range
            const firstStart = normalRanges[0].start;
            if (firstStart > "00:00") {
              missingRanges.push(`00:00-${subtractOneMinute(firstStart)}`);
            }

            // Check gap after last range
            const lastEnd = normalRanges[normalRanges.length - 1].end;
            if (lastEnd < "23:59") {
              missingRanges.push(`${addOneMinute(lastEnd)}-23:59`);
            }
          }
        }

        // Add outsideServiceTimeslot if there are missing ranges
        if (missingRanges.length > 0) {
          dynamicTimeCheckboxes.push({
            name: "outsideServiceTimeslot",
            label: "Outside services timeslots",
            time: missingRanges.join(','),
          });
        }

        return dynamicTimeCheckboxes; // Return the processed time checkboxes
      }
      
      return TIMES_CHECKBOXES; // Return defaults if no time data
      
    } catch (error) {
      if (error?.status === 404) {
        return TIMES_CHECKBOXES; // Return defaults on 404 error
      }
      throw error; // Re-throw other errors
    }
  };
  // Helper functions
  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  
  const onDateChange = (name) => (e) => {
    setStartEndDate({ ...startEndDate, [name]: e });
    setIsStartDateOpen(false);
    setIsEndDateOpen(false);
  };

  const onApply = useCallback((isInitial = false, customTimeCheckboxes = null) => {
    const force = typeof isInitial === "boolean" ? isInitial : false; // use to forcefully send default filter states/values on clear button
    let payload = cloneDeep({ ...formData, ...startEndDate });
    const getFormattedDate = (d) => moment(d).format("YYYY-MM-DD");

    // Use customTimeCheckboxes if provided, otherwise fall back to state
    const effectiveTimeCheckboxes = customTimeCheckboxes || timeCheckboxes;

    const mealListsItems = force ? [] : selectedOption
      .filter((o) => !!o.details)
      .flatMap((o) => o.details);

    const mealItems = force ? [] : selectedOption.filter((o) => !o.details);

    const myRestaurants = selectedMyRestaurants.map((s) =>
      resturantOptions.find((r) => r.id === s.value)
    );

    if (force) {
      effectiveTimeCheckboxes.map((x) => x.name).forEach((t) => delete payload[t]);
      CATEGORIES.map((x) => x.name).forEach((t) => delete payload[t]);
      payload = { ...payload, total: true }
    }

    onSubmit((prev) => ({ 
      ...prev,
      ...payload,
      meals: [...mealListsItems, ...mealItems.map((m) => m.item_id)],
      mealTypes: Object.keys(formData?.mealTypes ?? {}).filter((y) => {
        if (formData.mealTypes[y]) {
          return y;
        }
      }),
      ...(effectiveTimeCheckboxes && { time_check_boxes: effectiveTimeCheckboxes }),
      myRestaurants: [...myRestaurants.map((r) => r?.id)],
      ...(payload.start_date && {
        start_date: getFormattedDate(payload.start_date),
      }),
      ...(payload.end_date && { end_date: getFormattedDate(payload.end_date) }),
      ...(force && {
        meals: [],
        mealTypes: [],
        myRestaurants: [],
        start_date: getFormattedDate(START_DATE),
        end_date: getFormattedDate(END_DATE),
        breakfast: false,
        lunch: false,
        dinner: false,
        afternoon: false,
        outsideServiceTimeslot: false
      }),
    }));
  }, [
    formData, 
    startEndDate, 
    selectedOption, 
    selectedMyRestaurants, 
    timeCheckboxes, 
    resturantOptions
  ]);

  const onCheckboxChange =
    (type) =>
      ({ target: { checked, name } }) => {
        setformData({
          ...formData,
          ...(type === null && { [name]: checked }),
          ...(type === "mealTypes" && {
            [type]: { ...formData[type], [name]: checked },
          }),
          // ...(name === "eat_in" && { service_type: "eat_in" }),
          // ...(name === "take_away" && { service_type: "take_away" }),
          ...(name === "total" && { average: false }),
          ...(name === "average" && { total: false }),
        });
      };

  const customCheckbox = ({ name, label, checked, type = null }) => (
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

  const onClearTimes = () => {
    const newFormData = JSON.parse(JSON.stringify(formData));
    timeCheckboxes.map((x) => x.name).forEach((t) => delete newFormData[t]);
    setformData({ ...newFormData });
  };

  const onClearDates = () => {
    setStartEndDate({ start_date: START_DATE, end_date: END_DATE });
  };

  const onClearAll = (apply = true) => {
    onClearDates();
    setformData({ total: true });
    onClearMeals();
    onClearMyRestaurants();
    if (apply) onApply(true);
  };

  const setDateOpen =
    (type, checked = false) =>
      () => {
        type === "start_date"
          ? setIsStartDateOpen(checked)
          : setIsEndDateOpen(checked);
      };

  const onClearMeals = () => {
    setSelectedOption([]);
  };

  const onClearMyRestaurants = () => {
    if (selectMyRestaurantRef?.current) {
      selectMyRestaurantRef.current.clearValue();
    }
  };

  const onClearMealTypes = () => {
    setformData({ ...formData, mealTypes: {} });
  };

  const onMealSelect = () => (v) => {
    setSelectedOption([...v]);
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

  // const TRANSITIONS_CHECKBOXES = [
  //   { name: "eat_in", label: "Eat in" },
  //   { name: "take_away", label: "Eat away" },
  // ];

  const CATEGORIES = [
    { name: "total", label: "Total" },
    { name: "average", label: "Average" },
  ];

  // const onClearTransitions = () => {
  //   const newFormData = { ...formData };
  //   delete newFormData.service_type;  
  //   setformData(newFormData);
  // };
  

  const createList = () => {
    setIsModal(true);
  };

  const onModalHide = () => {
    setIsModal(false);
  };

  const onSaveFilter = () => {
    setSelectedFilterMeals(selectedOption);
    setSelectedFilterMyRestaurants(selectedMyRestaurants);
    setFilterStartEndDate(startEndDate);
    setFilterFormData(formData);
    updateFilterButton(true);
  }

  return (
    <>
      <CustomModal show={isModal} onHide={onModalHide} />
      {isFilterShown && (
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

              <div className="rightcontent-fltr meals-right-side">
                <div className="mb-3">
                  <div className="fltr-heading">
                    <label>{t("Meals")}</label>
                    <button onClick={() => onClearMeals()}>{t("Clear")}</button>
                  </div>

                  <SelectAsyncPaginate
                    {...(!selectedRestaurant && {
                      datasource: dummyDatasource,
                    })}
                    dataField="is_external"
                    placeholder={t("SelectMeals")}
                    onChange={onMealSelect}
                    value={selectedOption}
                    count={selectedOption.length}
                    isMulti
                    query="meals"
                    // key={(mealsList ?? []).join("_")}
                    key={`${selectedRestaurantId}_${(mealsList ?? []).join("_")}`} // <-- Forces re-render on restaurant change
                    multiOptions={mealsList}
                  />

                  <label onClick={createList} className="mt-3 fw-bold">
                    {t("ManageList")}
                  </label>
                </div>

                <div className="mb-5">
                  <div className="fltr-heading">
                    <label>{t("MyRestaurants")}</label>
                    <button onClick={onClearMyRestaurants}>{t("Clear")}</button>
                  </div>
                  <Select
                    ref={selectMyRestaurantRef}
                    styles={colourStyles}
                    defaultValue={selectedMyRestaurants}
                    value={selectedMyRestaurants}
                    onChange={setSelectedMyRestaurants}
                    components={makeAnimated()}
                    options={resturantOptions.map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                    isMulti
                    isSearchable
                    placeholder={t("SelectRestaurants")}
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        danger: "#fff",
                        dangerLight: "hsl(53deg 2% 73%)",
                      },
                    })}
                  />
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

                <div className="mb-5">
                  <div className="fltr-heading">
                    <label>{t("Operation")}</label>
                  </div>
                  {CATEGORIES.map((check, i) => {
                    const label = t(check.label);
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

                {/* eat in and take away */}
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
                        type: "service_type",
                        checked: formData.service_type === check.name
                      })}
                    </Fragment>
                  ))}
                </div> */}

                <div>
                  <div className="fltr-heading">
                    <label>{t("Time")}</label>
                    <button onClick={onClearTimes}>{t("Clear")}</button>
                  </div>
                  {timeCheckboxes?.map((check, i) => {
                    // Special case for outsideServiceTimeslot - translate the whole label
                    if (check.name === "outsideServiceTimeslot") {
                      return (
                        <Fragment key={i}>
                          {customCheckbox({
                            name: check.name,
                            label: t(check.label), // Translate the entire label
                            checked: formData[check.name] || false,
                          })}
                        </Fragment>
                      );
                    }
                    
                    // Original logic for other checkboxes
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
                  
                {/* <div className="mt-4">
                  <div className="fltr-heading">
                    <label>{t("MealTypes")}</label>
                    <button onClick={onClearMealTypes}>{t("Clear")}</button>
                  </div>
                  {((isRestaurantLoaded && !hasRetaurants) ? MEAL_CATEGORIES_DEMO : MEAL_CATEGORIES.slice(1)).map((check, i) => {
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
                </div> */}
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
      )}
    </>
  );
}

export default RightSide;
