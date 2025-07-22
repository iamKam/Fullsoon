import React, { useState, useEffect } from "react";
import Router from "../routes/router";
import { useLocation } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select, { components } from "react-select";

import SelectLanguage from "components/selectLanguage";

import request from "services/request";
import storage from "services/storage";

import { useLoading } from "contexts/LoadingContextManagement";
import { useUserData } from "contexts/AuthContextManagement";
import { useSubMenuData } from "contexts/SidebarContextManagment";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";

import FilterIcon from "assets/images/icon/FILTER_ICON1.svg";
import { useFilterData } from "contexts/FilterContextManagment";
import CloseSidebarIcon from "assets/images/icon/CLOSED_SIDEBAR.svg";

import { useHistory } from "react-router-dom";

import './sidebar.scss';

function Header({ handleToggle, broken }) {
  const location = useLocation();
  const history = useHistory();
  const { t, i18n  } = useTranslation();
  const currentLanguage = i18n.language;
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  const { selectedStockSubMenu } = useSubMenuData();
  const [selectedLabo, setSelectedLabo] = useState(null);

  const { showCategoriesList, setShowCategoriesList, setShowProvidersList, updateInventorySelectedCategories } = useFilterData();

  const getCurrentRoute = () =>
    Router.find((r) => r.path === location.pathname);
  const currentRoute = getCurrentRoute();
  const { setError, setLoading } = useLoading();
  const {
    setSelectedRestaurantId,
    selectedRestaurantId,
    restaurants,
    labos,
    setRestaurants,
    isFilterShown,
    setFilterShown,
    isRestaurantLoaded,
    hasRetaurants,
    isDemo,
    setIsLabo,
  } = useUserData();
  const { selectedInventoryCategories } = useFilterData();
  const userSubscription = JSON.parse(storage.getItem("subscription"));
  
  const [resturantOptions, setResturantOptions] = useState(restaurants);

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
        cursor: isDisabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center"
      };
    },
    multiValueLabel: (base) => ({ ...base }),
  };


  //get user restaurants first time
  useEffect(() => {
    getUserRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  const handleShowCategories = () => {
    setShowCategoriesList(true);
    setShowProvidersList(true);
    updateInventorySelectedCategories("");
  };

  //get user restaurants api
  const getUserRestaurants = async () => {
    try {
      const result = await request.get("restaurants");
      let _restaurants = result.restaurants;
      setRestaurants(_restaurants);
      setLoading(false);
      let r = storage.getItem("selected_restaurant_id");
      if(userSubscription && userSubscription?.type === 'labo') {
        setIsLabo(true)
        storage.setItem("is_labo", true)
      }
      if (r === null && _restaurants.length !== 0) {
        setSelectedRestaurantId(_restaurants[0].id);
        if(_restaurants[0].is_labo) {
          history.push("/labo");
        }
        storage.setItem("is_labo", _restaurants[0].is_labo)
        storage.setItem("selected_restaurant_id", _restaurants[0].id);
      }
      if (r != null) {
        for (let restaurant of _restaurants) {
          if (restaurant.id === r) {
            setSelectedRestaurantId(r);
            setIsLabo(restaurant.is_labo)
            storage.setItem("is_labo", restaurant.is_labo)
            storage.setItem("selected_restaurant_id", r);
            break;
          }
        }
      }
    } catch (error) {
      console.log(error)
      //setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  //dropdown select function
  // const handleRestaurantsSelect = (eventKey) => {
  //   for (let r of restaurants) {
  //     if (r.id === eventKey) {
  //       storage.setItem("selected_restaurant_id", r.id);
  //       setSelectedRestaurantId(r.id);
  //       break;
  //     }
  //   }
  // };
  
  const handleRestaurantsSelect = (eventKey) => {
    for (let r of restaurants) {
      if (r.id === eventKey.value) {
        storage.setItem("selected_restaurant_id", r.id);
        setIsLabo(r.is_labo)
        storage.setItem("is_labo", r.is_labo)
        setSelectedRestaurantId(r.id);
        break;
      }
    }
  };

  //Get reataurant name by its id
  // const getRestaurantNameByItsId = (restaurantId) => {
  //   let restaurantName = "";
  //   for (let r of restaurants) {
  //     if (r.id === restaurantId) {
  //       restaurantName = r.name;
  //       break;
  //     }
  //   }

  //   if (isRestaurantLoaded && !selectedRestaurantId) {
  //     restaurantName = "Mezzo";
  //   }

  //   return restaurantName;
  // };

  const getRestaurantId = (restaurantId) => {
    let restaurantName;
    for (let r of restaurants) {
      if (r.id === restaurantId) {
        restaurantName = {
          name: r.name,
          label: r.name,
          value: r.id,
          image: r.image_path
        }
        break;
      }
    }

    return restaurantName;
  };

  /**
   * Gets the current restaurant object by its id
   * @returns Object
   */
  const getSelectedRestaurant = () =>
    restaurants?.find((r) => r.id === selectedRestaurantId) || {};

    let date;
    if(currentRoute?.subHeading) {
    let dateArray = currentRoute?.subHeading?.split(" ");
    let month = dateArray?.length && t(dateArray[0]);
    let day = currentLanguage === 'en' ? dateArray[1] : dateArray[1]?.replace(/\D/g, "") + ",";
    let year = dateArray[2];
    date = currentLanguage === 'en' ? [month, day, year]?.join(" ") : [day.replace(/,/g, ''), month, year]?.join(" ") 
    }
  
  useEffect(() => {
    if (isRestaurantLoaded && !hasRetaurants) {
      setSelectedRestaurant({
        name: "Mezzo",
        label: "Mezzo",
        value: "demo_restaurant_id"
      })
    }
    if(selectedRestaurantId) {
      setSelectedRestaurant(getRestaurantId(selectedRestaurantId));
    }
  }, [selectedRestaurantId, isRestaurantLoaded]);

  // Custom option component to display image and name
  const customOption = ({ innerRef, innerProps,isDisabled, data, isFocused, isSelected }) => (
    <div ref={innerRef} {...innerProps} style={{ display: 'flex', alignItems: 'center', margin: '8px 5px', padding : "5px",
            backgroundColor: isDisabled
          ? undefined
          : isSelected
            ? data.color
            : isFocused
              ? "#F3F4FB"
              : undefined,
        color: isDisabled ? "#ccc" : isSelected ? "black" : "black",
        cursor: isDisabled ? "not-allowed" : "pointer",
    }}>
      {data.image_path && (
        <img
          src={data.image_path}
          alt={data.label}
          className="dropdown_image mt-3 me-2"
        />
      )}
      <span>{data.label}</span>
    </div>
  );

  const CustomSingleValue = (props) => {
    return (
      <components.SingleValue {...props}>
        {
          props.data.image &&
          <img
            src={props.data.image}
            alt={props.data.label}
            style={{ width: 24, height: 24, marginRight: 10 }}
          />
        }
        {props.data.label}
      </components.SingleValue>
    );
  };

  return (
    <>
      <header className="header1">
        <Row>
          <Col lg={6} className="align-self-center pe-0 cols-1">
            <div className={`userheader ${currentRoute?.path === "/stock" && selectedStockSubMenu === "Inventories" ? "flex" : ""}`}>
              {currentRoute?.path === "/stock" && selectedStockSubMenu === "Inventories" ? (
                <>
                   <div style={{ display: 'flex', alignItems: 'center' }}>
                    {
                      broken &&
                      <img
                        src={CloseSidebarIcon}
                        alt=""
                        className={`collapsed`}
                        onClick={handleToggle}
                        style={{ transform: 'rotate(180deg)', marginBottom: '0.5rem', cursor: 'pointer' }}
                      />
                    }
                      <h1 onClick={handleShowCategories} style={{ cursor: 'pointer', color: 'inherit' }}>
                        {currentRoute?.name === "Stock" && selectedStockSubMenu == "Inventories" ? t("Inventories") : t(currentRoute?.heading)}
                      </h1>
                    </div>
                  {selectedInventoryCategories?.category && (
                    <>
                      <h1>{Object.keys(selectedInventoryCategories).length > 0 && " > "}</h1>
                      <h1 style={{ color : selectedInventoryCategories?.color}}>{t(selectedInventoryCategories?.category)}</h1>
                    </>
                  )}
                </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {
                        broken &&
                        <img
                          src={CloseSidebarIcon}
                          alt=""
                          className={`collapsed`}
                          onClick={handleToggle}
                          style={{ transform: 'rotate(180deg)', marginBottom: '0.5rem', cursor: 'pointer' }}
                        />
                      }
                      <h1>{t(currentRoute?.heading)}</h1>
                    </div>
                )}
                <p className="subHeading">
                  {currentRoute?.name === "Stock" && selectedStockSubMenu === "Inventories"
                    ? null
                    : currentRoute?.name === "Forecast"
                    ? date?.length && date
                    : t(currentRoute?.subHeading)}
                </p>
            </div>
          </Col>
          <Col
            lg={{ span: 3, offset: 3 }}
            className="pe-0 d-flex justify-content-end align-items-center cols-2"
          >
            {/* <li className="nav-item  userdd">
              <div className="d-flex">
                {getSelectedRestaurant()?.image_path && (
                  <img
                    src={getSelectedRestaurant()?.image_path}
                    className="user_image mt-3"
                    alt=""
                  />
                )}

                <Dropdown
                  className="restaurant_dropdown"
                  onSelect={handleRestaurantsSelect}
                >
                  <Dropdown.Toggle
                    variant="link"
                    id="dropdownMenuLink"
                    className="btn btn-transparent dropdown-toggle p-3"
                  >
                    <strong className="d-none d-sm-inline-block dropdown-text">
                      {getRestaurantNameByItsId(selectedRestaurantId)}
                    </strong>
                  </Dropdown.Toggle>

                  {Boolean(restaurants.length) && (
                    <Dropdown.Menu>
                      {restaurants.map((r, i) => (
                        <Dropdown.Item
                          key={i}
                          eventKey={r.id}
                          className="d-flex"
                        >
                          {r.image_path && (
                            <img
                              src={r.image_path || ""}
                              className="dropdown_image mt-3 me-2"
                              alt=""
                            />
                          )}
                          <span className="dropdown_item_name">{r.name}</span>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  )}
                </Dropdown>
                <SelectLanguage />
              </div>
            </li> */}
            <div>
             <Select
                className="restaurantName"
                styles={colourStyles}
                value={selectedRestaurant || selectedLabo}
                onChange={handleRestaurantsSelect}
                components={{ Option: customOption, SingleValue: CustomSingleValue }}
                options={(restaurants || labos).map((r) => ({
                  value: r.id,
                  label: r.name,
                  image_path : r.image_path || ""
                }))}
                isSearchable
                placeholder={t("Search restaurants...")}
                theme={(theme) => ({
                  ...theme,
                  width:"400px",
                  colors: {
                    ...theme.colors,
                    danger: "#fff",
                    dangerLight: "hsl(53deg 2% 73%)",
                  },
                })}
                 
              />
            </div>
            <SelectLanguage />
          </Col>
        </Row>
      </header>
      <div className="headerbtns">
        {/* {currentRoute?.name === "Meals" && (
          <button className="float-start add-new-btn">
            <img src={AddMealIcon} className="me-2" alt="" />
            {t("addNewMeal")}
          </button>
        )}  */}
        {/* {currentRoute?.name === "Stock" && (
          <button className="float-start add-new-btn">
            <img src={AddMealIcon} className="me-2" alt="" />
            {t("AddNewProduct")}
          </button>
        )}*/}
        {/* <button className="btn btn-white btn-icon me-3">
          <img src={TelechargerIcon} alt="" className="m-0" />
        </button>
        <button className="btn btn-white btn-icon me-3">
          <img src={SendIcon} alt="" className="m-0" />
        </button>  */}
        {currentRoute?.filterIcon && !isFilterShown && (
          <button
            onClick={() => setFilterShown(true)}
            className="btn btn-white btn-icon btn-theme"
          >
            <img src={FilterIcon} alt="" className="m-0" />
          </button>
        )}
      </div>
    </>
  );
}

export default Header;