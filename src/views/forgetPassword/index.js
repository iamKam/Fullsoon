import { Row } from "react-bootstrap";
import LeftSide from "../signin/leftSide";
import RightSide from "./rightSide";
import "./index.scss";

function ForgetPassword() {
  return (
    <Row className="forget-password-container">
      <LeftSide />
      <RightSide />
    </Row>
  );
}

export default ForgetPassword;
