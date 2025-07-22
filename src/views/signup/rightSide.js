import { useEffect, useState } from "react";
import { useHistory  } from "react-router-dom";
import { Button, Col, Form } from "react-bootstrap";

import PhoneInput from "react-phone-input-2";
import request from "services/request";

import { useLoading } from "contexts/LoadingContextManagement";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";

import ArrowBack from "assets/images/icon/SIGN_UP_ARROW_BACK.svg";
import VisibiltyIcon from "assets/images/icon/visibility_on.svg";
import VisibiltyOffIcon from "assets/images/icon/visibility_off.svg";
import { useTranslation } from "react-i18next";
import makeAnimated from "react-select/animated";
import Select from "react-select";

import "react-phone-input-2/lib/style.css";
import storage from "services/storage";

function RightSide() {
  const history = useHistory();
  const { t } = useTranslation();
  const initialState = {
    name: "",
    surname: "",
    email: "",
    password: "",
    phoneNumber: "",
    error: "",
    isPasswordVisible: false,
    restaurants: [],
  };
  const [state, setState] = useState(initialState);
  const { setLoading, setError, setSuccessMessage } = useLoading();
  const [resturantOptions, setResturantOptions] = useState([]);
  const [restaurants, setResturants] = useState([]);

  const token = (history.location.search).split("=")[1]

  useEffect(async() => {
    const restaurants = await fetch(`${process.env.REACT_APP_API_ENDPOINT}/restaurants/all`, { 
      method: 'get', 
      headers: new Headers({
        'Authorization': `Bearer ${process.env.REACT_APP_FULLSOON_ADMIN_TOKEN}`, 
        'Content-Type': 'application/x-www-form-urlencoded'
      }), 
    });
    const params = {token}
    const res = await restaurants.json()
    setResturants(res.restaurants);
    if(token) {
      const data = await request.get("auth/get-register-data", params);
      storage.setItem("subscription",  JSON.stringify({plan: data?.user?.plan, status: false, type: data?.user?.type}) || null)
      setState({
        ...state,
        name: data?.user?.first_name,
        surname: data?.user?.last_name,
        email: data?.user?.email,
        phoneNumber: data?.user?.phone_number,
        restaurants: res.restaurants.filter(item => data?.user?.restaurants.includes(item.id)).map(i => ({label: i.name, value: i.id}))
      })
    }
             
  },[])

  const handleSubmit = async (event) => {
    // Prevent default behavior
    event.preventDefault();
    setLoading(true);
    try {

      const response = await request.get("roles")
      const role_id = response.roles.find(role => role.name === "Admin").id
      const result = await request.post("/auth/register", {
        username: state.name,
        surname: state.surname,
        phone_number: state.phoneNumber,
        email: state.email,
        password: state.password,
        role: role_id,
        restaurants: state.restaurants.map(item => (item.value)),
      });

      const data = await result.clone().json();

      // if(data?.user?.subscription?.status !== 'active') {
      //   history.push("/pricing");
      // }else {
      //   storage.setItem("subscription",  JSON.stringify(data?.user?.subscription))
      //   history.push("/");
      // }

      // check for error response
      if (result.ok) {
        const msg = data && data.msg;
        storage.setItem("token", data.token);
        storage.setItem("user", JSON.stringify(data.user));
        // setSuccessMessage(msg);
        setState({
          name: "",
          surname: "",
          email: "",
          password: "",
          phoneNumber: "",
          error: "",
          isPasswordVisible: false,
          restaurants: [],
        })
        history.push("/pricing");
      } else {
        const errorMsg = (data && data.msg) || result.status;
        setState({ ...state, error: errorMsg });
        setError(`${errorMsg}`);
      }
    } catch (error) {
      setError(DEFAULT_ERROR_MESSAGE);
    }
    setLoading(false);
  };

  const setSelectedMyRestaurants = (value) => {
    setState((prevState) => ({ ...prevState, restaurants: value }));
  }

  const handleInputChange = (event) => {
    if(event == '') {
      setResturantOptions([]);
      return
    }
    if(event.length < 3) {
      setResturantOptions([]);
      return
    }
    const filteredOptions = restaurants?.filter((option) => {
       if(option.name.toLowerCase().includes(event.toLowerCase())) {
        return true
       }
       return false
    })
    setResturantOptions(filteredOptions);
  }

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
    <Col
      className="right-container align-self-center"
      md={{ span: 3, offset: 2 }}
      lg={{ span: 3, offset: 2 }}
    >
      <div className="mt-4 d-none d-lg-block">
        <span style={{ cursor: "pointer", display: "inline"}} onClick={() => history.push("/signin")} className="back-text ps-0">
          <img src={ArrowBack} className="pe-2" alt="" />
          {t("Back")}
        </span>
      </div>

      <div>
        <p className="sign-up-title ps-0 mb-4">{t("CreateAnAccount")}</p>
      </div>

      <div>
        <Form className="ps-0 pe-0" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="name">
            <Form.Label className="input-title">{t("Name")}</Form.Label>
            <Form.Control
              type="text"
              placeholder={t("Name")}
              aria-describedby="inputGroupPrepend"
              required
              value={state.name}
              onChange={(event) =>
                setState({ ...state, name: event.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="surname">
            <Form.Label className="input-title">{t("SurName")}</Form.Label>
            <Form.Control
              type="text"
              placeholder={t("SurName")}
              value={state.surname}
              aria-describedby="inputGroupPrepend"
              onChange={(event) =>
                setState({ ...state, surname: event.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="phoneNumber">
            <Form.Label className="input-title">{t("PhoneNumber")}</Form.Label>
            <PhoneInput
              country={"fr"}
              value={state.phoneNumber}
              onChange={(phone) => setState({ ...state, phoneNumber: phone })}
              aria-describedby="inputGroupPrepend"
              inputClass="phone-input"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="emailAddress">
            <Form.Label className="input-title">{t("EmailAddress")}</Form.Label>
            <Form.Control
              type="email"
              placeholder={t("EmailAddress")}
              aria-describedby="inputGroupPrepend"
              required
              value={state.email}
              onChange={(event) =>
                setState({ ...state, email: event.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label className="input-title">{t("Password")}</Form.Label>

            <div className="sign-up-password-container">
              <Form.Control
                type={state.isPasswordVisible ? "text" : "password"}
                placeholder="xxxxxxxxxx"
                value={state.password}
                aria-describedby="inputGroupPrepend"
                required
                onChange={(event) =>
                  setState({ ...state, password: event.target.value })
                }
              />

              {state.isPasswordVisible ? (
                <img
                  src={VisibiltyOffIcon}
                  className="sign-up-password-icon"
                  alt=""
                  onClick={() =>
                    setState({
                      ...state,
                      isPasswordVisible: !state.isPasswordVisible,
                    })
                  }
                />
              ) : (
                <img
                  src={VisibiltyIcon}
                  className="sign-up-password-icon"
                  alt=""
                  onClick={() =>
                    setState({
                      ...state,
                      isPasswordVisible: !state.isPasswordVisible,
                    })
                  }
                />
              )}
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="restaurantName">
            <Form.Label className="input-title">
              {t("Restaurant'sName")}
            </Form.Label>
            {/* <Form.Control type="text" placeholder={t("Restaurant'sName")} /> */}
              <Select
                  styles={colourStyles}
                  onChange={setSelectedMyRestaurants}
                  onInputChange={handleInputChange}
                  components={makeAnimated()}
                  options={resturantOptions?.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                  isMulti
                  isDisabled={!!token}
                  value={state.restaurants}
                  isSearchable
                  placeholder={t("SelectRestaurants")}
                  theme={(theme) => ({
                    ...theme,
                    borderRadius: 4,
                    colors: {
                      ...theme.colors,
                      danger: "#fff",
                      dangerLight: "hsl(53deg 2% 73%)",
                    },
                  })}
                />
          </Form.Group>
          <Button type="submit" variant="primary signup-btn">
            {t("SignUp")}
          </Button>
        </Form>
      </div>
      <div>
        <p className="error-text">{state.error}</p>
      </div>
    </Col>
  );
}

export default RightSide;
