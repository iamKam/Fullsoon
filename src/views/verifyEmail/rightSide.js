import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Button, Col, Row, Form } from "react-bootstrap";
import { useLoading } from "contexts/LoadingContextManagement";
import request from "services/request";


import "react-phone-input-2/lib/style.css";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";

function RightSide() {
  const history = useHistory();
  const [isConatinerVisible, setIsConatinerVisible] = useState(false);
  const { setLoading, setError, setSuccessMessage } = useLoading();
  const [email, setEmail] = useState("");
  const [isTokenExist, setTokenExist] = useState(false)

  useEffect(() => {
    let token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      verifyEmail(token);
      setTokenExist(true)
    } else {
      setTokenExist(false)
      setIsConatinerVisible(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyEmail = async (token) => {
    setLoading(true);
    try {
      const result = await request.post(`/auth/verify-email?token=${token}`, {});
      const data = await result.clone().json();

      // check for error response
      if (result.ok) {
        history.push("/signin");
        setSuccessMessage("Email has been verified. Please Sign in")
      } else {
        const errorMsg = (data && data.msg) || result.status;
        setError(errorMsg)
        setIsConatinerVisible(true)
      }
    } catch (error) {
      setError(DEFAULT_ERROR_MESSAGE)
    }
    setLoading(false);
  };

  const handleSubmit = async (event) => {
    // Prevent default behavior
    event.preventDefault();
    setLoading(true);
    try {
      const result = await request.post(`/auth/send-verification-email`, {
        email: email
      });
      const data = await result.clone().json();

      // check for error response
      if (result.ok) {
        history.push("/signin");
        setSuccessMessage("Email has been verified. Please Sign in")
      } else {
        const errorMsg = (data && data.msg) || result.status;
        setError(errorMsg)
      }
    } catch (error) {
      setError(DEFAULT_ERROR_MESSAGE)
    }
    setLoading(false);
  };

  return (
    <Col
      className="right-container align-self-center"
      md={{ span: 3, offset: 2 }}
      lg={{ span: 3, offset: 2 }}
    >{isConatinerVisible ?
      <Form className="ps-0 pe-0" onSubmit={handleSubmit}>
        {isTokenExist?
        <Row>
          <span
            className="verification-title ps-0"
          >
            Sorry ! This link is expired, please enter your email again
          </span>
        </Row>:null}
        <Row>
          <Form.Group className="pe-0 ps-0 mt-3">
            <Form.Label className="input-title">
              Email
            </Form.Label>
            <Form.Control
              aria-describedby="inputGroupPrepend"
              required
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </Form.Group>
        </Row>
        <Row>
          <Button type="submit" variant="primary signin-btn">
            Resend Email
          </Button>
        </Row>
      </Form> : null}

    </Col>
  );
}

export default RightSide;
