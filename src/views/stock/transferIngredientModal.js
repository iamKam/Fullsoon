import { useState, useEffect, useRef, useMemo } from "react";
import Creatable from "react-select/creatable";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Button,
  Row,
  Col,
  Container,
  Card,
  Form,
} from "react-bootstrap";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { withAsyncPaginate } from "react-select-async-paginate";

import SelectInput from "components/selectInput";
import { useUserData } from "contexts/AuthContextManagement";
import { UNITS } from "common/constants";

import { cloneDeep } from "common/utils.ts";
import SelectAsyncPaginate from "components/selectAsyncPaginate/index.tsx";
import { getIngredientsDummyData } from "../settings/utils";

import UploadedIcon from "assets/images/uploaded_meal.png";
import Addicon from "assets/images/icon/add_purple.svg";
import CLOSE_ICON from "assets/images/icon/DELETE.svg";

import convert from "convert";
import { roundToTwo } from "common/utils";
import { myResturants } from "views/occupancy/data";

const CreatableAsyncPaginate = withAsyncPaginate(Creatable);

function TextInput({
  type = "text",
  dataField,
  required = true,
  caption,
  ...props
}) {
  return (
    <>
      <span className="input-title ps-0">{caption}</span>
      <input
        type={type}
        name={dataField}
        className="form-control custom-input"
        required={required}
        {...props}
      />
    </>
  );
}

const INGREDIENT_INITIAL = {
  ingredient_id: null,
  ingredient_unit: null,
  ingredient_quantity: null,
  ingredient_cost: 0,
  converted_unit: null,
  converted_quantity: null,
};

function TransferModal({ onHide, show, state, onRowAdded, ...props }) {
  const { t } = useTranslation();
  const selectMyRestaurantRef = useRef(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [ingredients, setIngredients] = useState([])
  const [selectedFromRestaurants, setSelectedFromRestaurants] = useState([]);
  const [selectedToRestaurants, setSelectedToRestaurants] = useState([]);

  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [currentItems, setCurrentItems] = useState([]);

  const [fd, setFd] = useState({
    ingredients: [],
  });

  const {
    restaurants,
    hasRetaurants,
    isRestaurantLoaded,
  } = useUserData();

  const [resturantOptions, setResturantOptions] = useState(restaurants);

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
    if (isRestaurantLoaded && !hasRetaurants) {
      setResturantOptions(dummyRestaurantDatasource);
      fetchAndSetIngredients();
    }
    setResturantOptions(restaurants)
  }, [hasRetaurants, isRestaurantLoaded, dummyRestaurantDatasource]);

const fetchAndSetIngredients = async () => {
  try {
    let ingredients = []
    let result = {};
    if (isRestaurantLoaded && !hasRetaurants) {
        ingredients = getIngredientsDummyData();

      if(fd.search) {
        ingredients = ingredients.filter(item => (item.name.toLowerCase().includes(fd.search.toLowerCase())))
      }
      if(fd.sortby) {
        ingredients = ingredients.sort((a, b) => (a[fd.sortby] > b[fd.sortby]) ? 1: -1)
      }
      result = {
        ingredients,
        total_pages: 1,
        page: 0,
      };
      setCurrentItems(ingredients);
      return
    }
  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
    setFd({
      allergens: [],
      ingredients: [],
      meals: [],
    });
    setIsSubmitDisabled(true);
    setIsUploaded(false);
  }, [show]);

  useEffect(() => {
    if (fd.ingredients?.length > 0) {
      setIsSubmitDisabled(false);
      return;
    }
    setIsSubmitDisabled(true);
  }, [fd]);

  const onAddIngredientItem = (ev) => {
    setFd({
      ...fd,
      ingredients: [
        ...(fd.ingredients || []),
        {
          ...INGREDIENT_INITIAL,
          ...(ev.id && {
            ingredient_id: {
              id: ev.id,
              name: ev.name,
              unit_price: ev.unit_price,
              unit: ev.unit,
            },
          }),
        },
      ],
    });
  };

  const calculateCost = (ingredient) => {
    const { unit_price, unit } = ingredient?.ingredient_id || {};
    const {
      ingredient_unit,
      ingredient_quantity,
      converted_unit,
      converted_quantity,
    } = ingredient;
    if (["g", "kg", "mg", "lb", "l", "ml", "m", "mm"].includes(ingredient_unit)) {
      try {
        const convertQuantity = converted_quantity ?? ingredient_quantity;
        const convertFrom = converted_unit ?? ingredient_unit;
        const convertTo = unit ?? converted_unit ?? ingredient_unit;
        const convertedValue =
          convert(convertQuantity, convertFrom).to(convertTo) || 0;

        ingredient.ingredient_cost = (parseFloat(unit_price * convertedValue)).toFixed(2);
        ingredient.ingredient_quantity = roundToTwo(convertedValue);
        return ingredient
      } catch (error) {
        ingredient.ingredient_cost = roundToTwo(
          ingredient_quantity * unit_price || 0
        );
        return ingredient
      }
    } else {
      ingredient.ingredient_cost = roundToTwo(
        ingredient_quantity * unit_price || 0
      );
      return ingredient
    }
  };

  const onIngredientTextBoxChange =
    (i) =>
    ({ target: { name, value: val } }) => {
      let value = +val.replace(/[^\d.]/, "");

      if (!(+value !== 0) && val !== "") {
        return;
      }
      if (val === "") {
        value = "";
      }

      let newIngredients = cloneDeep(fd.ingredients);
      const ingredient = newIngredients[i];
      ingredient[name] = value;
    };

  const onIngredientSelectBoxChange =
    (i) =>
    (type) =>
    ({ id, unit_price, name, unit }) => {
      let newIngredients = cloneDeep(fd.ingredients);
      const ingredient = newIngredients[i];

      setSelectedIngredients((prev) => [
        ...prev,
        ingredients.find((i) => i.id === id),
      ]);

      if (type !== "ingredient_unit") {
        ingredient[type] = id;
      }
      if (type === "ingredient_unit") {
        ingredient["converted_unit"] = id;
      }

      if (type === "ingredient_id") {
        ingredient[type] = { id, name, unit_price, unit };
        ingredient["ingredient_unit"] = unit;
        ingredient["converted_unit"] = unit;
        ingredient["ingredient_quantity"] = 1;
        ingredient["converted_quantity"] = 1;
      }

      setFd({ ...fd, ingredients: newIngredients });
    };

  const deleteIngredient = (index, type) => () => {
    const newIngredients = cloneDeep(fd.ingredients);
    newIngredients.splice(index, 1);
    const cost = getPerServingCost(newIngredients);
    setFd({ ...fd, cost, ingredients: newIngredients });
  };

  const getSum = (ingredients = null) => {
    let fdTotal = (ingredients || fd.ingredients || []).reduce(
      (previousValue, currentValue) =>
        previousValue + parseFloat(currentValue.ingredient_cost || 0),
      0
    );
    const mealTotal = fd.meals
      .map((meal) => {
        const ingredients = meal.ingredients || [];
        return ingredients.reduce(
          (previousValue, currentValue) =>
            previousValue +
            parseFloat(currentValue.IngredientMeal.ingredient_cost),
          0
        );
      })
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0);
    return fdTotal + mealTotal;
  };

  const getPerServingCost = (ingredients, servings = null) => {
    return (
      parseFloat(
        (getSum(ingredients || []) / (servings || fd.servings)).toFixed(4)
      ) || 0
    );
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

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        centered
        className=" add-meals"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("TransferIngredients")}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Container className="p-0">
            {isUploaded && (
              <div className="d-flex justify-content-center flex-column  text-center upload-container">
                <div>
                  <img src={UploadedIcon} alt="..." />
                </div>
                <div className="heading mt-5">
                  <label>{t("stockTransfered")} !</label>  
                </div>
                <div className="subheading mt-2 mb-5">
                  <label>{t("IngredientSTransferedSuccessfully")}</label>
                </div>
                <div>
                  <Button
                    className="add-restaurant-confirm-btn"
                    onClick={onHide}
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}

            {!isUploaded && (
              <Form className="ps-0 pe-0" noValidate>
                <Row>
                  <Col md={6}>
                    <div className="mb-5">
                      <div className="fltr-heading">
                        <label>{t("From")}</label>
                      </div>
                      <Select
                        ref={selectMyRestaurantRef}
                        styles={colourStyles}
                        defaultValue={selectedFromRestaurants}
                        onChange={setSelectedFromRestaurants}
                        components={makeAnimated()}
                        options={dummyRestaurantDatasource.map((r) => ({
                          value: r.id,
                          label: r.name,
                        }))}
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
                  </Col>
                  <Col md={6}>
                    <div className="mb-5"> 
                      <div className="fltr-heading">
                        <label>{t("To")}</label>
                      </div>
                      <Select
                        ref={selectMyRestaurantRef}
                        styles={colourStyles}
                        defaultValue={selectedToRestaurants}
                        onChange={setSelectedToRestaurants}
                        components={makeAnimated()}
                        options={dummyRestaurantDatasource.map((r) => ({
                          value: r.id,
                          label: r.name,
                        }))}
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
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col lg={12}>
                    <span className="input-title ps-0">
                      {t("AddIngredientsToTransfer")}
                    </span>
                    <Card className="mb-0">
                      <div className="p-4 allergens-container">
                        <div className="row custom-table h-100">
                          <div className="col-lg-12 h-100 p-0">
                            <div className="tablescroll">
                              <table className="table">
                                <thead>
                                  <tr>
                                    <td
                                      style={{ width: "55%" }}>
                                      {t("Ingredients")}
                                    </td>
                                    <td
                                      style={{ width: "35%" }}
                                    >
                                      {t("Unit")}
                                    </td>
                                    <td
                                      style={{ width: "35%" }}
                                    >
                                      {t("Quantity")}
                                    </td>
                                    <td
                                      style={{
                                        width: "50px",
                                        textAlign: "end",
                                      }}
                                    ></td>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(fd.ingredients || []).map(
                                    (ingredient, i) => {
                                      return (
                                      <tr key={i}>
                                        <td style={{ height: "50px" }}>
                                          <SelectAsyncPaginate
                                            dataField="ingredient_id"
                                            placeholder={t("SelectIngredient")}
                                            // value={ingredient.ingredient_id}
                                            datasource={currentItems}
                                            isMulti={false}
                                            query="ingredients"
                                            onChange={onIngredientSelectBoxChange(
                                              i
                                            )}
                                            mapper={(rows) =>
                                              rows.map((row) => ({
                                                ...row,
                                                name:
                                                  row.name +
                                                  (row.brand
                                                    ? ` (${row.brand})`
                                                    : ""),
                                              }))
                                            }
                                          />
                                        </td>
                                        <td className="">
                                          <SelectInput
                                            portal={true}
                                            dataField="ingredient_unit"
                                            placeholder={t("SelectUnit")}
                                            // options={getConvertibleUnitOptions(ingredient?.converted_unit || ingredient?.ingredient_unit)}
                                            onChange={onIngredientSelectBoxChange(
                                              i
                                            )}
                                            value={UNITS.find(
                                              ({ id }) =>
                                                id === ingredient?.ingredient_id?.unit
                                                // (ingredient.converted_unit ||
                                                //   ingredient.ingredient_unit)
                                            )}
                                          />
                                        </td>
                                        <td className="">
                                          <TextInput
                                            dataField="ingredient_quantity"
                                            placeholder= {t("quantity")}
                                            onChange={onIngredientTextBoxChange(
                                              i
                                            )}
                                            // value={
                                            //   ingredient?.converted_quantity ||
                                            //   ingredient?.ingredient_quantity
                                            // }
                                            type="number"
                                            defaultValue="1"
                                          />
                                        </td>
                                        <td className="p-0">
                                          <button
                                            type="button"
                                            onClick={deleteIngredient(i)}
                                            className="table-delete-btn p-0"
                                          >
                                            <img src={CLOSE_ICON} alt="" />
                                          </button>
                                        </td>
                                      </tr>
                                      )
                                    }
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <div className="bottom-container d-flex justify-content-end">
                              <div>
                                <Button
                                  variant="add-ingredient"
                                  onClick={onAddIngredientItem}
                                >
                                  <img
                                    src={Addicon}
                                    className="add-btn-icon"
                                    alt="..."
                                  />
                                  {t("Add")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Modal.Footer className="add-restaurants-modal-footer">
                  <Button
                    type="submit"
                    className="add-restaurant-confirm-btn"
                    disabled={isSubmitDisabled}
                    onClick={() => setIsUploaded(true)}
                  >
                    {t("Confirm")}
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Container>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TransferModal;
