import React from "react";
import PropTypes from "prop-types";
import { Modal, Button, Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import UploadedIcon from "assets/images/uploaded_meal.png";

function UploadModal(props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Modal
      show={props.show}
      onHide={props.onHide}
      size="lg"
      centered
      className="add-ingredient order-provider-modal"
    >
      <Modal.Header className="" closeButton />

      <Modal.Body>
        <Container>
          <div className="d-flex flex-row upload-container justify-content-between">
            <div>
              <label className="heading ">
                {t("YourOrderHasBeenSentOut!")}
              </label>
              <label className="subheading">
                {t("SuccessufullySentToYourProviderMessage")}
              </label>
              <label className="subheading">
                {t("CheckCarefullyYourEmails")}
              </label>
              <label className="link mt-3" onClick={props.onDownloadClick}>
                {t("DownloadOrderDetails")}
              </label>
              <div className="mt-5 mb-5 pb-5">
                <Button
                  className="add-restaurant-confirm-btn "
                  onClick={props.onHide}  
                >
                  {t("GotIt")} !
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <img src={UploadedIcon} alt="..." />
            </div>
          </div>
        </Container>
      </Modal.Body>
    </Modal>
  );
}

UploadModal.propTypes = {
  show: PropTypes.bool,
  onHide: PropTypes.func,
  title: PropTypes.string,
  subTitle: PropTypes.string,
};

export default UploadModal;
