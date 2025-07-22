import React from "react";
import PropTypes from "prop-types";
import { Modal, Button, Container } from "react-bootstrap";
import { useTranslation } from 'react-i18next';

import UploadedIcon from "assets/images/uploaded_meal.png";

/**
 * Successfull request upload modal
 * @returns display a modal
 */
function UploadModal(props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Modal
      show={props.show}
      onHide={props.onHide}
      size="lg"
      centered
      className="add-ingredient"
    >
      <Modal.Header className="" closeButton />

      <Modal.Body>
        <Container>
          <div className="d-flex justify-content-center flex-column text-center upload-container">
            <div>
              <img src={UploadedIcon} alt="..." />
            </div>
            <div className="heading mt-5">
              <label>{t(props.title) ?? ""}</label>
            </div>
            <div className="subheading mt-2 mb-5">
              <label>{t(props.subTitle) ?? ""}</label>
            </div>
            <div>
              <Button
                className="add-restaurant-confirm-btn"
                onClick={props.onHide}
              >
                OK
              </Button>
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