import React from "react";
import { Row } from "react-bootstrap";
import LeftSide from "./leftSide";
import RightSide from "./rightSide";
import "./index.scss";

function Signin() {
  return (
    <Row className="signin-container">
      <LeftSide  />
      <RightSide  />
    </Row>
  );
}

export default Signin;
