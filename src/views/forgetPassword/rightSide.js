import { useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Col, Form } from "react-bootstrap";
import { useLoading } from "contexts/LoadingContextManagement";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";
import request from "services/request";
import ArrowBack from "assets/images/icon/SIGN_UP_ARROW_BACK.svg";
import "react-phone-input-2/lib/style.css";
import { useTranslation } from "react-i18next";

function RightSide() {
  const history = useHistory();
  const { t } = useTranslation();
  const initialState = {
    email: "",
    error: "",
  };
  const [state, setState] = useState(initialState);
  const { setLoading, setError, setSuccessMessage } = useLoading();

  const handleSubmit = async (event) => {
    // Prevent default behavior
    event.preventDefault();
    setLoading(true);
    try {
      const result = await request.post("/auth/forgot-password", {
        email: state.email,
      });

      const data = await result.clone().json();

      // check for error response
      if (result.ok) {
        //successfull
        setSuccessMessage(
          "Your reset password email is heading your way. Please check your mail box"
        );
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
  return (
    <Col
      className="right-container align-self-center"
      md={{ span: 3, offset: 2 }}
      lg={{ span: 3, offset: 2 }}
    >
      <div className="mt-4  d-none d-lg-block">
        <span className="back-text ps-0">
          <img src={ArrowBack} className="pe-2" alt="" />
          {t("Back")}
        </span>
      </div>

      <div>
        <p className="forget-password-title ps-0 mb-4">
          {t("ForgotPassword")}?
        </p>
      </div>

      <div>
        <p className="forget-password-sub-title ps-0 mb-4">
          {t("Don’tWorryItCanEvenHappenToTheBestToUs")}
        </p>
      </div>

      <div>
        <Form className="ps-0 pe-0" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="emailAddress">
            <Form.Label className="input-title">
              {t("WhatIsYourAccountEmailAddress")}?
            </Form.Label>
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

          <Button type="submit" variant="primary forget-password-btn">
            {t("ResetMyPassword")}
          </Button>

          <div>
            <p className="error-text">{state.error}</p>
          </div>
        </Form>

        <div className="text-center">
          <p className="forget-password-not-registered">
            {t("NotRegisteredYet")}?{"  "}
            <span
              className="forget-password-create-an-account"
              onClick={() => history.push("/signup")}
            >
              {t("CreateAnAccount")}
            </span>
          </p>
        </div>
      </div>
    </Col>
  );
}

export default RightSide;
