import React from "react";
import { Row } from "react-bootstrap";
import LeftSide from "./leftSide";
import RightSide from "./rightSide";
import "./index.scss";

function VerifyEmail() {
  return (
    <Row className="verify-email-container">
      <LeftSide  />
      <RightSide  />
    </Row>
  );
}

export default VerifyEmail;
