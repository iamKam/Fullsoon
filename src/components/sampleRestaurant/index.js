import React from "react";
import { Modal } from "react-bootstrap";

function SampleRestaurantModal(props) {
  return (
    <Modal
      show={props.show}
      onHide={props.onHide}
      size="lg"
      centered
      className="add-ingredient"
      backdropClassName="add-ingredient-backdrop"
    >
      <Modal.Header
        className="add-restaurants-modal-header"
        closeButton
      ></Modal.Header>

      <Modal.Body>
        Please subscribe the fullsoon in order to perform any action
      </Modal.Body>
    </Modal>
  );
}

export default SampleRestaurantModal;
