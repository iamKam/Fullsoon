import React from "react";
import { Row } from "react-bootstrap";
import LeftSide from "./leftSide";
import RightSide from "./rightSide";
import "./index.scss";

function ResetPassword() {
  return (
    <Row className="reset-password-container">
      <LeftSide  />
      <RightSide  />
    </Row>
  );
}

export default ResetPassword;
