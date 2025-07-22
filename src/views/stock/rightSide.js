import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import DatePicker from "react-datepicker";
import moment from "moment";
import { Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import CustomModal from "components/ingredientListModel";
import SelectAsyncPaginate from "components/selectAsyncPaginate/index.tsx";
import { cloneDeep } from "common/utils";
import { useUserData } from "contexts/AuthContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";

import CloseIcon from "assets/images/close.png";
import CalendarIcon from "assets/images/calendar_datepicker.png";

import "react-datepicker/dist/react-datepicker.css";
import sample_ingredients_data from "../../data/stock_predictions.json";
import request from "services/request";

const STATUS_CHECKBOXES = [
  { name: "no_expiry", label: "Not expired" },
  { name: "unsold", label: "Unsold" },
];

const EXPIRY_CHECKBOXES = [
  { name: "good_to_eat", label: "Good to eat" },
  { name: "soon_to_expire", label: "Soon to be expired" },
  { name: "expired", label: "Expired" },
];

/**
 * function to render the filter screen of the sctock page
 * @param {*} param0
 * @returns UI component
 */
const START_DATE = new Date(new Date().setDate(new Date().getDate()));
const END_DATE = new Date(new Date().setDate(new Date().getDate()));

function RightSide({ onApply: onSubmit, formData: fd, setClear, clear }) {
  const { t } = useTranslation();
  const {
    isFilterShown,
    setFilterShown,
    selectedRestaurant,
    selectedRestaurantId,
    setResetStock
  } = useUserData();

  const {
    filterStartEndDate,
    setFilterStartEndDate,
    selectedFilterProucts,
    setSelectedFilterProducts,
    isFilterActive,
    updateFilterButton
  } = useFilterData();

  const [selectedOption, setSelectedOption] = useState(selectedFilterProucts ?? []);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [ingredientList, setIngredientList] = useState([]);
  const [isModal, setIsModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [startEndDate, setStartEndDate] = useState({
    start_date: filterStartEndDate && filterStartEndDate.start_date !== "" ? filterStartEndDate.start_date : START_DATE,
    end_date: filterStartEndDate && filterStartEndDate.end_date !== "" ? filterStartEndDate.end_date : END_DATE,
  });

  /**
   * to be called whenever the user selects the date from date-window
   * @param {*} name field name
   * @returns
   */
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

  useEffect(() => {
    onClearAll();
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (clear) {
      onApply(true);
      setClear(false); // reset clear after applying
    }
  }, [clear]);
  

  /**
   * submits the selected filters to api
   * @param {*} isInitial
   */
  const onApply = (isInitial = false) => {
    const payload = JSON.parse(
      JSON.stringify({ ...formData, ...startEndDate })
    );
    const getFormattedDate = (d) => moment(d).format("YYYY-MM-DD");

    if (payload.start_date) {
      payload.start_date = getFormattedDate(payload.start_date);
    }
    if (payload.end_date) {
      payload.end_date = getFormattedDate(payload.end_date);
    }
    // payload.products = selectedOption.map((s) => s.id);
    if (selectedOption?.length > 0) {
      payload.products = selectedOption.map((ingredient) => {
        if (Array.isArray(ingredient.details) && ingredient?.details?.length > 0 && ingredient.details.every((id) => typeof id === "string")) {
          return ingredient.details;
        } else {
          return ingredient.id;
        }
      }).flat(); // Flatten the array if `details` array is nested inside
    }

    if (typeof isInitial === "boolean" && isInitial !== false) {
      payload.products = [];
      payload.start_date = payload.end_date = moment().format("YYYY-MM-DD");
      STATUS_CHECKBOXES.map((x) => x.name).forEach((t) => delete payload[t]);
      EXPIRY_CHECKBOXES.map((x) => x.name).forEach((t) => delete payload[t]);
    }

    onSubmit(payload);
  };

  /**
   * update various filter options
   * @param {*} param0
   */
  const onCheckboxChange = ({ target: { checked, name } }) => {
    setFormData({ ...formData, [name]: checked });
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

  const onClearDates = () => {
    setStartEndDate({
      start_date: new Date(),
      end_date: new Date(),
    });
  };

  const onClearAll = () => {
    onClearDates();
    setFormData({});
    onClearProducts();
    // onApply(true);
  };

  const handleClear = () =>{
    onClearAll();
    setClear(true);
  }

  const onResetStock = async () => {
    try {
      const response = await request.patch(`/stocks/reset-theoretical-stocks?restaurant_id=${selectedRestaurantId}`);
      if (response?.status === 200) {
        toast.success(t("theoreticalStockReset"));
        setResetStock(true)
      }
    } catch (error) {
      toast.error(t("FailedToResetTheoreticalStock"));
    }
  }

  const setDateOpen =
    (type, checked = false) =>
    () => {
      type === "start_date"
        ? setIsStartDateOpen(checked)
        : setIsEndDateOpen(checked);
    };

  const onClearProducts = () => {
    setSelectedOption([]);
  };

  const onClearStatus = () => {
    const newFormData = cloneDeep(formData);
    STATUS_CHECKBOXES.map((x) => x.name).forEach((t) => delete newFormData[t]);
    setFormData({ ...newFormData });
  };

  const onExpiryStatus = () => {
    const newFormData = cloneDeep(formData);
    EXPIRY_CHECKBOXES.map((x) => x.name).forEach((t) => delete newFormData[t]);
    setFormData({ ...newFormData });
  };

  const onSaveFilter = () => {
    setFilterStartEndDate(startEndDate)
    setSelectedFilterProducts(selectedOption)
    updateFilterButton(true);
  }

  useEffect(() => {
    if (filterStartEndDate && filterStartEndDate.start_date !== "" && filterStartEndDate.end_date !== "") {
      setStartEndDate(filterStartEndDate);
    } else {
      setStartEndDate(startEndDate);
    }  
    setSelectedOption(selectedFilterProucts);
    onApply();
  }, [])

  const onIngredientSelect = (type) => (v) => setSelectedOption([...v]);
  
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
    return start < today ? start : null;
  };  

  return (
   <>
    {isModal && <CustomModal show={isModal} onHide={onModalHide} />}
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
              <div className="mb-5">
                <div className="fltr-heading">
                  <label>{t("Products")}</label>
                  <button onClick={onClearProducts}>{t("Clear")}</button>
                </div>
                <SelectAsyncPaginate
                  {...(!selectedRestaurant && {
                    datasource: sample_ingredients_data.map((row) => ({
                      ...row,
                      name: row.name + (row.brand ? ` (${row.brand})` : ""),
                    })),
                  })}
                  isMulti
                  // key="id"
                  query="ingredients"
                  dataField="ingredient_id"
                  placeholder={t("Select Products")}
                  onChange={onIngredientSelect}
                  value={selectedOption}
                  count={selectedOption.length}
                  mapper={(rows) =>
                    rows.map((row) => ({
                      ...row,
                      name: row.name + (row.brand ? ` (${row.brand})` : ""),
                    }))
                  }
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

              {/* <div className="mb-5">
                <div className="fltr-heading">
                  <label>{t("Status")}</label>
                  <button onClick={onClearStatus}>{t("Clear")}</button>
                </div>
                {STATUS_CHECKBOXES.map((check, i) => (
                  <Fragment key={i}>
                    {customCheckbox({
                      name: check.name,
                      label: t(check.label),
                      checked: formData[check.name] || false,
                    })}
                  </Fragment>
                ))}
              </div> */}

              {/* <div>
                <div className="fltr-heading">
                  <label>{t("Expiry")}</label>
                  <button onClick={onExpiryStatus}>{t("Clear")}</button>
                </div>
                {EXPIRY_CHECKBOXES.map((check, i) => (
                  <Fragment key={i}>
                    {customCheckbox({
                      name: check.name,
                      label: t(check.label),
                      checked: formData[check.name] || false,
                    })}
                  </Fragment>
                ))}
              </div> */}
            </div>

            <div className="action-btns">
              <div className="action-btn">
                <button onClick={onResetStock} className="close-btn full-width">
                  {t("ResetStockGap")}
                </button>
              </div>
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
