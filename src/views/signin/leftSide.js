import { Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import FullsoonLogo from "assets/images/icon/FULLSOON_LOGO.svg";
import ArrowBack from "assets/images/icon/SIGN_UP_ARROW_BACK.svg";

function LeftSide() {
  const { t } = useTranslation();

  return (
    <Col className="left-container" md={3} lg={2}>
      <div className="d-md-none back-text-container">
        <span className="back-text ps-0">
          <img src={ArrowBack} className="pe-2" alt="" />
          {t("Back")}
        </span>
      </div>
      <div className="d-flex wrapper mt-4">
        <div className="left-container-logo">
          <img src={FullsoonLogo} alt="..." />
        </div>
        <div className="align-middle left-container-title">
          <span className="logo-text">FULLSOON</span>
        </div>
      </div>
    </Col>
  );
}

export default LeftSide;
