import React from "react";
import { Col, Row } from "react-bootstrap";
import FullsoonLogo from "../../assets/images/icon/FULLSOON_LOGO.svg";

function LeftSide() {
  return (
    <Col className="left-container" md={3} lg={2}>
      <Row className="mt-4 ">
        <Col className="mt-4 pe-1 left-container-logo" md={4} lg={3}>
          <img src={FullsoonLogo} className="me-2" alt="" />
        </Col>
        <Col className="mt-4 ps-1 align-middle left-container-title" md={4} lg={4}>
          <span className="logo-text">FULLSOON</span>
        </Col>
      </Row>
    </Col>
  );
}

export default LeftSide;
