import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { cloneDeep } from "common/utils.ts";
import { useUserData } from "contexts/AuthContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import moment from "moment";

import request from "services/request";

import SelectAsyncPaginate from "components/selectAsyncPaginate";
import CustomModal from "components/ingredientListModel";

import CloseIcon from "assets/images/close.png";
import tableIngredientsDummy from "../../data/ingredients.json";
import "react-datepicker/dist/react-datepicker.css";
import CalendarIcon from "assets/images/calendar_datepicker.png";

const START_DATE = new Date(new Date().setDate(new Date().getDate()));
const END_DATE = new Date(new Date().setDate(new Date().getDate()));

function RightSide({ onApply: onSubmit, formData: fd, setClear }) {
  const { t } = useTranslation();
  const {
    filterFormData,
    setFilterFormData,
    isFilterActive,
    updateFilterButton,
    selectedIngredients, 
    setSelectedIngredients, 
    filterStartEndDate,
  } = useFilterData();
  const [ingredientList, setIngredientList] = useState([]);
  const [isModal, setIsModal] = useState(false);
  const [formData, setFormData] = useState(filterFormData ?? { });
  const [selectedIngredientOption, setSelectedIngredientOption] = useState(selectedIngredients ?? []);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [startEndDate, setStartEndDate] = useState({
    start_date: filterStartEndDate && filterStartEndDate.start_date !== "" ? filterStartEndDate.start_date : START_DATE,
    end_date: filterStartEndDate && filterStartEndDate.end_date !== "" ? filterStartEndDate.end_date : END_DATE,
  });
  
  const { isFilterShown, setFilterShown, selectedRestaurant, selectedRestaurantId } = useUserData();

  useEffect(() => {
    onClearAll();
  }, [selectedRestaurantId]);

  const setDateOpen =
  (type, checked = false) =>
    () => {
      type === "start_date"
        ? setIsStartDateOpen(checked)
        : setIsEndDateOpen(checked);
    };

  useEffect(() => {
    if (!selectedRestaurantId) return;
    if (isModal === false) {
      const getIngredientsList = async () => {
        const result = await request.get("ingredient-lists", {
          restaurant_id: selectedRestaurantId
        });
        setIngredientList(result.ingredient_lists);
      };
      getIngredientsList();
    }
  }, [isModal, selectedRestaurantId]);

  const options = tableIngredientsDummy.ingredients?.map((m) => ({
    name: m.name,
    label: m.name,
    item_id: m.name,
  }));

  const onDateChange = (name) => (e) => {
    const newDate = e;
    let updatedDates = { ...startEndDate, [name]: newDate };

    // If start date is changed to a past date, set end date to same as start date
    if (name === "start_date") {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Remove time part for accurate comparison
      
      const selectedDate = new Date(newDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        updatedDates.end_date = newDate;
      }
    }

    setStartEndDate(updatedDates);
    setIsStartDateOpen(false);
    setIsEndDateOpen(false);
  };

  const onClearDates = () => {
    setStartEndDate({ start_date: START_DATE, end_date: END_DATE });
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

    if (selectedIngredientOption?.length > 0) {
      payload.ingredients = selectedIngredientOption.map((ingredient) => {
        if (Array.isArray(ingredient.details) && ingredient?.details?.length > 0 && ingredient.details.every((id) => typeof id === "string")) {
          return ingredient.details;
        } else {
          return ingredient.id;
        }
      }).flat(); // Flatten the array if `details` array is nested inside
    }

    if (typeof isInitial === "boolean" && isInitial !== false) {
      payload.start_date = getFormattedDate(START_DATE);
      payload.end_date = getFormattedDate(END_DATE);
      payload.ingredients = [];
    }

    onSubmit(payload);
  };

  const onClearIngredients = () => {
    setSelectedIngredientOption([]);
  };

  const onClearAll = (apply = true) => {
    onClearDates();
    onClearIngredients(); 
    setFormData({});
    onApply(true);
  };

  const handleClear = () =>{
    onClearAll();
    setClear(true);
  }

  const onSaveFilter = () => {
    setSelectedIngredients(selectedIngredientOption);
    setFilterFormData(formData); 
    updateFilterButton(true);
  }

  const onIngredientSelect = () => (v) => {
    setSelectedIngredientOption([...v]);
  };

  const createList = () => {
    setIsModal(true);
  };


  const onModalHide = () => {
    setIsModal(false);
  };

  const getEndDateMax = () => {
    const start = new Date(startEndDate.start_date);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return start < today ? start : today;
  };

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

              <div className="rightcontent-fltr">
                <div className="mb-3">
                  <div className="fltr-heading">
                    <label>{t("Ingredients")}</label>
                    <button onClick={onClearIngredients}>{t("Clear")}</button>
                  </div>
                  <SelectAsyncPaginate
                    {...(!selectedRestaurant && {
                      datasource: options,
                    })}
                    placeholder={t("Select Ingredients")}
                    onChange={onIngredientSelect}
                    value={selectedIngredientOption}
                    count={selectedIngredientOption.length}
                    isMulti
                    query="ingredients"
                    key={(ingredientList ?? []).join("_")}
                    multiOptions={ingredientList}
                  />
                  <label onClick={createList} className="mt-3 fw-bold">
                    {t("ManageList")}
                  </label>
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
                        selected={new Date(startEndDate.start_date)}
                        dateFormat="dd MMM yyyy"
                        placeholderText={t("Start date")}
                        onChange={onDateChange("start_date")}
                        className="date-picker"
                        open={isStartDateOpen}
                        onClickOutside={setDateOpen("start_date")}
                        onClick={setDateOpen("start_date", true)}
                        maxDate={new Date()}
                      />
                      <img
                        src={CalendarIcon}
                        onClick={setDateOpen("start_date", !isStartDateOpen)}
                        alt="calender-icon"
                      />
                    </div>
                  </div>
                  <hr className="hr-separator" />
                  <div className="d-flex datepicker-wrapper">
                    <span>{t("End")}&nbsp;&nbsp;</span>
                    <div className="datepicker-wrapper-img">
                      <DatePicker
                        selected={new Date(startEndDate.end_date)}
                        dateFormat="dd MMM yyyy"
                        placeholderText={t("End date")}
                        onChange={onDateChange("end_date")}
                        className="date-picker"
                        open={isEndDateOpen}
                        onClickOutside={setDateOpen("end_date")}
                        onClick={setDateOpen("end_date", true)}
                        minDate={startEndDate.start_date}
                        maxDate={getEndDateMax()}
                      />
                      <img
                        src={CalendarIcon}
                        onClick={setDateOpen("end_date", !isEndDateOpen)}
                        alt="calender-icon"
                      />
                    </div>
                  </div>
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
                  <button onClick={handleClear} className="close-btn me-3">
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