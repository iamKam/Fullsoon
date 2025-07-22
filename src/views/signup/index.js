import React from "react";
import { Row } from "react-bootstrap";
import LeftSide from "../signin/leftSide";
import RightSide from "./rightSide";
import "./index.scss";

function Signup() {
  return (
    <Row className="signup-container">
      <LeftSide />
      <RightSide />
    </Row>
  );
}

export default Signup;
