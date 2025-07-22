import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { useLoading } from "contexts/LoadingContextManagement";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";
import request from "services/request";
import ArrowBack from "assets/images/icon/SIGN_UP_ARROW_BACK.svg";
import VisibiltyIcon from "assets/images/icon/visibility_on.svg";
import VisibiltyOffIcon from "assets/images/icon/visibility_off.svg";
import "react-phone-input-2/lib/style.css";

function RightSide() {
  const history = useHistory();
  const { t } = useTranslation();
  const initialState = {
    password: "",
    error: "",
    isPasswordVisible: false,
  };
  const [state, setState] = useState(initialState);
  const { setLoading, setError } = useLoading();

  const handleSubmit = async (event) => {
    // Prevent default behavior
    event.preventDefault();

    let token = new URLSearchParams(window.location.search).get("token");

    setLoading(true);
    try {
      const result = await request.post(`/auth/reset-password?token=${token}`, {
        password: state.password,
      });

      const data = await result.clone().json();

      // check for error response
      if (result.ok) {
        history.push("/signin");
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
      <Row className="mt-4">
        <span className="back-text ps-0">
          <img src={ArrowBack} className="pe-2" alt="" />
          {t("Back")}
        </span>
      </Row>

      <Row>
        <p className="reset-password-title ps-0 mb-4">Reset Password</p>
      </Row>

      <Row>
        <p className="reset-password-sub-title ps-0 mb-4">
          Don’t worry, it can even happen to the best to us.
        </p>
      </Row>

      <Row>
        <Form className="ps-0 pe-0" onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="input-title">
              Please enter your new password
            </Form.Label>

            <div className="password-container">
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
                  className="password-icon"
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
                  className="password-icon"
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

          <Button type="submit" variant="primary reset-password-btn">
            Reset my Password
          </Button>

          <Row>
            <p className="error-text">{state.error}</p>
          </Row>
        </Form>
      </Row>
    </Col>
  );
}

export default RightSide;
