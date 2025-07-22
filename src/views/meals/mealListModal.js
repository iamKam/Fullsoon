import { useState, useEffect, useRef } from "react";
import Creatable from "react-select/creatable";
import omit from "lodash/omit";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { Modal, Container, Form, Button} from "react-bootstrap";
import { withAsyncPaginate } from "react-select-async-paginate";
import { Spinner } from "react-bootstrap"

import request from "services/request";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";

import "react-time-picker-input/dist/components/TimeInput.css";
import InfiniteScroll from "react-infinite-scroll-component";
import UploadedIcon from "assets/images/uploaded_meal.png";
import {
  DEFAULT_ERROR_MESSAGE,
} from "common/constants";
import mealList from "../../data/meal_list.json";

const CreatableAsyncPaginate = withAsyncPaginate(Creatable);

function CustomModal(props) {
  const { t } = useTranslation();
  const { setError } = useLoading();
  const { selectedRestaurantId, isRestaurantLoaded, hasRetaurants } = useUserData();
  const pageRef = useRef({ limit: 75, page: 1, total: 0 });
  const [isShow, setIsShow] = useState(props.show ?? false);
  const [meals, setMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [fd, setFd] = useState({ name: "" });
  const [success, setSuccess] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMeals = async () => {
    if (isRestaurantLoaded && !hasRetaurants) {
      setMeals(mealList);
      return;
    }
    try {
      const result = await request.get(
        "meals",
        {
          ...omit(pageRef.current, ["total"]),
          restaurant_id: selectedRestaurantId,
          is_external : true
        },
        true,
        false
      );
      pageRef.current.page += 1;
      pageRef.current.total = result.total_results;

      setMeals((prev) => [...prev, ...result.meals]);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setIsShow(props.show ?? false);
    if (props.show) {
      pageRef.current.page = 1;
      delete pageRef.current.search;
      getMeals();
    }
  }, [props.show]);

  // const selectMeal = (ev) => {
  //   if (ev.target.checked) {
  //     setSelectedMeals([...(selectedMeals ?? []), ev.target.value]);
  //   } else {
  //     setSelectedMeals((prev) =>
  //       prev.filter((item) => item !== ev.target.value)
  //     );
  //   }
  // };

  const selectMeal = (ev, meal) => {
    const { value, checked } = ev.target;
    setSelectedMeals((prev) => {
      if (checked) {
        const exists = prev.some((m) => m.meal_id === value);
        return exists ? prev : [...prev, { meal_id: value, item_id: meal.item_id }];
      } else {
        return prev.filter((m) => m.meal_id !== value);
      }
    });
  };

  const onSubmit = async () => {
    if (isRestaurantLoaded && !hasRetaurants) {
      setSuccess(true);
      setUpdated(true);
      setIsShow(false);
      setFd({});
      setSelectedMeals([]);
      props.onHide(false);
      return;
    }
    let result, isUpdate = false; 
    const payload = {
      name: fd.name,
      details: selectedMeals.map((m) => m.meal_id),
      restaurant_id: selectedRestaurantId,
    };

    if (fd?.id) {
      result = await request.patch(`/meal-lists/${fd?.id}`, payload);
      isUpdate = true;
    } else {
      result = await request.post("/meal-lists", payload);
    }
    if ([200, 201].includes(result.status)) {
      setIsShow(false);
      setFd({});
      setSelectedMeals([]);
      props.onHide(false);
      setMeals([]);
      setSuccess(true);
      setUpdated(isUpdate); 
    } else {
      setError(DEFAULT_ERROR_MESSAGE);
    }
  };

  const createSelectChange = (obj, { action }) => {
    setFd({
      name: obj?.value || "",
      ...(action === "select-option" && { id: obj?.id }),
      ...(action === "create-option" && {}),
      ...(action === "clear" && { name: "" }),
    });

    if (action === "select-option") {
      setSelectedMeals(() => obj.details);
    }

    if (action === "clear") {
      setSelectedMeals(() => []);
    }
  };


  const loadOptions = async (search) => {
    if (!search || search.length < 2 || search === "") {
      const result = await request.get(
        "meal-lists",
        {
          restaurant_id: selectedRestaurantId,
        },
        true,
        false
      );
      return {
        options: result.meal_lists.map((i) => ({
          ...i,
          value: i.name,
          label: i.name,
        })),
        hasMore: false,
      };
    }

    try {
      const response = await request.get(
        "meal-lists",
        { search, restaurant_id: selectedRestaurantId },
        true,
        false
      );

      return {
        options: response.meal_lists.map((i) => ({
          ...i,
          value: i.name,
          label: i.name,
        })),
        hasMore: false,
      };
    } catch (error) {
      console.log(error);
      return { options: [], hasMore: false };
    }
  };

  const onDelete = async () => {
    try {
      await request.delete(`/meal-lists/${fd?.id}`);
      setIsShow(false);
      props.onHide(false);
      setFd({});
      setSelectedMeals([]);
      setMeals([]);
    } catch (error) {
      console.log(error);
    }
  };

  const onSearch = debounce((ev) => {
    pageRef.current.page = 1;
    pageRef.current.search = ev.target.value;
    if (ev.target.value === "") {
      delete pageRef.current.search;
    }
    setMeals([]);
    getMeals();
  }, 500);

  const onHide = () => {
    setFd({});
    setMeals([]);
    delete pageRef.current.search;
    props.onHide();
  };

  const onHideSuccessPopup = () => {
    setSuccess(false); 
  };
  
  return (
    <>
      <Modal
        show={isShow}
        onHide={onHide}
        size="lg"
        centered
        className="add-ingredient meal-list-modal"
        backdropClassName="add-ingredient-backdrop"
        dialogClassName="recurrence-modal"
      >
        <Modal.Header className="add-restaurants-modal-header" closeButton>
          <Modal.Title className="add-restaurants-modal-title">
             {t("SelectFavouriteMeals")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="add-meal-list-body meal-list-body pt-0 pb-0">
          <Container className="p-0">
            <Form.Group>
              <div className="mb-3 position-relative">
                <span className="add-restaurants-input-title ps-0">
                  {t("ListName")}
                </span>

                <CreatableAsyncPaginate
                  value={fd?.name ? { label: fd.name, value: fd.name } : ""}
                  loadOptions={loadOptions}
                  onChange={createSelectChange}
                  placeholder={t("MealListName")}
                  isClearable
                />

                <input
                  type="search"
                  placeholder={t("SearchMeal")}
                  className="w-100 mt-3 search-meal-input"
                  style={{ height: "36px", borderColor: "hsl(0, 0%, 80%)" }}
                  onChange={onSearch}
                />
              </div>

              {loading && (
                <div className="d-flex justify-content-center card-spinner-container" style={{ width: "98%" }}>
                  <Spinner animation="border" variant="primary" />
                </div>
              )}
          
              {!loading &&
                <div>
                  <div className="position-relative ps-4 pe-4">
                    <InfiniteScroll
                      dataLength={meals.length - 5}
                      next={getMeals}
                      hasMore={true}
                      height={295}
                      className="row"
                    >
                      {meals.map((i, index) => (
                        <Form.Group
                          className="mb-2 col-4"
                          key={index}
                          style={{ height: "30px" }}
                        >
                          <label className="checkbox checkbox-meals-list">
                            <input
                              type="checkbox"
                              name={i?.name}
                              checked={selectedMeals.some((m) => m.item_id === i.item_id)}
                              onChange={(e) => selectMeal(e, i)}
                              value={i?.id}
                            />
                            <span className="ms-2">{i?.name}</span>
                          </label>
                        </Form.Group>
                      ))}
                    </InfiniteScroll>
                  </div>
                  <div className="d-flex justify-content-center mt-4">
                    {fd?.id && (
                      <button
                        onClick={onDelete}
                        className="d-flex button-confirm me-3"
                      >
                        Delete
                      </button>
                    )}
                    <button onClick={onSubmit} className="d-flex button-confirm">
                      {fd?.id ? "Update" : t("Confirm")}
                    </button>
                  </div>
                </div>
              }
            </Form.Group>
          </Container>
        </Modal.Body>
      </Modal>

      <Modal
        show={success}
        onHide={onHideSuccessPopup}
        centered
        className="add-ingredient meal-list-modal"
        dialogClassName="recurrence-modal"
       >
         <Modal.Body>
           <div className="d-flex justify-content-center flex-column  text-center upload-container">
             <div>
               <img src={UploadedIcon} alt="..." />
             </div>
             <div className="heading mt-5">
               <label>
                 {updated ? t("mealUpdated") : t("mealCreated")} !
               </label>
             </div>
             <div className="subheading mt-2 mb-5">
               <label>
                 {updated
                   ? t("successfullyMealUpdated")
                   : t("successfullyMealCreated")}
                 .
               </label>
             </div>
             <div>
               <Button
                 className="add-restaurant-confirm-btn"
                 onClick={onHideSuccessPopup}
               >
                 {t("OK")}
               </Button>
             </div>
           </div>
         </Modal.Body>
       </Modal>
    </>
  );
}

export default CustomModal;
