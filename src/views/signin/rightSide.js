import { useState } from "react";
import { useHistory } from "react-router-dom";
import { Row, Col, Button, Form } from "react-bootstrap";

import SelectLanguage from "components/selectLanguage";

import request from "services/request";
import storage from "services/storage";

import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";

import ArrowBack from "assets/images/icon/SIGN_UP_ARROW_BACK.svg";
import VisibiltyIcon from "assets/images/icon/visibility_on.svg";
import VisibiltyOffIcon from "assets/images/icon/visibility_off.svg";

import "react-phone-input-2/lib/style.css";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";
import { useTranslation } from "react-i18next";

const initialState = {
  email: "",
  password: "",
  error: "",
  isPasswordVisible: false,
  isRemember: false,
  isResendEmailVisible: false,
};

function RightSide() {
  const history = useHistory();
  const { t } = useTranslation();

  const { setUserData, hasRetaurants, setIsDemo, setIsLabo } = useUserData();
  const { setLoading, setError } = useLoading();
  const [state, setState] = useState({ ...initialState });

  const handleSubmit = async (event) => {
    // Prevent default behavior
    event.preventDefault();
    setLoading(true);
    try {

      const result = await request.post("/auth/login", {
        email: state.email,
        password: state.password,
      });
      const data = await result.clone().json();
      // check for error response
      if (result.ok) {
        setState({ ...state, error: "" });
        storage.setItem("token", data.token);
        storage.setItem("user", JSON.stringify(data.user));
        setUserData(data.user);
        // if(!hasRetaurants) {
        //   history.push("/forecast");
        //   return
        // }

        // if(data?.user?.id !== 'c30b4937-33cd-48da-90ed-ac98522866e8' && data?.user?.id !== 'e5e4072a-a77c-4129-842c-06ad12fd86b0') {
        //   if(!hasRetaurants) {
        //     return
        //   }
        // }

        if(state.email === 'demo.user@test.com' && state.password === 'Ful1$oOn0d$mO') {
          history.push("/forecast");
          setIsDemo(true)
          return
        }
        if(!data?.user?.is_plan_required) {
          history.push("/forecast")
          return
        }
        if(data?.user?.subscription?.status === 'active' || data?.user?.subscription?.status === 'trialing') {
          storage.setItem("subscription",  JSON.stringify(data?.user?.subscription))
          if(data?.user?.subscription?.plan === 'standard') {
            history.push("/forecast");
            return 
          }
          if(data.user?.subscription?.type === 'labo') {
            setIsLabo(true) 
            storage.setItem("is_labo", true)
            history.push("/labo");
            return
          }
            
          history.push("/forecast");
        }else {
          history.push("/pricing");
        }
      } else {
        const errorMsg = (data && data.msg) || result.status;
        setState({ ...state, error: errorMsg });
        setError(`${errorMsg}`);
        setState({
          ...state,
          isResendEmailVisible:
            errorMsg ===
            "Your account is not verified. Please confirm your email to login.",
        });
      }
    } catch (error) {
      setError(DEFAULT_ERROR_MESSAGE);
    }
    // setLoading(false);
  };

  return (
    <Col
      className="right-container align-self-center"
      md={{ span: 3, offset: 2 }}
      lg={{ span: 3, offset: 2 }}
    >
      <Col md={{ span: 4, offset: 8 }} style={{display: "flex", justifyContent: "space-between", width: "100%", marginLeft: "0px"}} lg={{ span: 3, offset: 9 }}>
        <span style={{ cursor: "pointer"}} onClick={() => history.push("/signup")} className="back-text ps-0">
          <img src={ArrowBack} className="pe-2" alt="" />
          {t("Back")}
        </span>
        <SelectLanguage />
      </Col>

      {/* <div className="mt-4 d-none d-lg-block">
        <span className="back-text ps-0">
          <img src={ArrowBack} className="pe-2" alt="" />
          {t("Back")}
        </span>
      </div> */}

      <div>
        <p className="sign-in-title ps-0 mb-4">{t("Hello")}</p>
      </div>

      <div>
        <p className="sign-in-sub-title ps-0 mb-4">
          {t("HappyToSeeYouAgain!")}
        </p>
      </div>

      <>
        <Form className="ps-0 pe-0" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="emailAddress">
            <Form.Label className="input-title">{t("EmailAddress")}</Form.Label>
            <Form.Control
              type="email"
              placeholder={t("EmailAddress")}
              aria-describedby="inputGroupPrepend"
              required
              onChange={(event) =>
                setState({ ...state, email: event.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label className="input-title">{t("Password")}</Form.Label>
            <div className="sign-in-password-container">
              <Form.Control
                type={state.isPasswordVisible ? "text" : "password"}
                placeholder="xxxxxxxxxx"
                aria-describedby="inputGroupPrepend"
                required
                onChange={(event) =>
                  setState({ ...state, password: event.target.value })
                }
              />

              {state.isPasswordVisible ? (
                <img
                  src={VisibiltyOffIcon}
                  className="sign-in-password-icon"
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
                  className="sign-in-password-icon"
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

          <Row>
            <Col lg={{ span: 6 }}>
              <div className="custom-checkbox-input">
                <input
                  className="form-check-input custom-color-white"
                  type="checkbox"
                  defaultChecked={state.isRemember}
                  onChange={(event) =>
                    setState({ ...state, isRemember: event.target.checked })
                  }
                />
                <span className="sign-in-remember-me">{t("RememberMe")}</span>
              </div>
            </Col>
            <Col lg={{ span: 6 }}>
              <p
                className="sign-in-forgot-password"
                onClick={() => history.push("/forgetpassword")}
              >
                {t("ForgotPassword")} ?
              </p>
            </Col>
          </Row>
          <Button type="submit" variant="primary signin-btn">
            {t("SignIn")}
          </Button>

          {/* <Row>
            <p className="error-text">{state.error}</p>
          </Row> */}
        </Form>

        <div className="text-center">
          <p className="sign-in-not-registered">
            {t("NotRegisteredYet")}?{"  "}
            <span
              className="sign-in-create-an-account"
              onClick={() => history.push("/signup")}
            >
              {t("CreateAnAccount")}
            </span>
          </p>
        </div>

        {state.isResendEmailVisible ? (
          <Row className="text-center">
            <span
              className="sign-in-create-an-account text-center"
              onClick={() => history.push("/verify-email")}
            >
              Resend Email
            </span>
          </Row>
        ) : null}
      </>
    </Col>
  );
}

export default RightSide;
