import React, { useState } from "react";
import { Modal, Container, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "moment/locale/fr";
import "moment/locale/en-gb";
import moment from "moment";

function Text({ caption, style }) {
  const customStyle = { ...style, border: "none", width: "auto", paddingLeft: "0" };
  return (
    <span style={customStyle} className="add-restaurants-input form-control bg-transparent">
      {caption}
    </span>
  );
}

function ConfirmDownlaodModal({ onHide, show, setDocumentFormat }) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  moment.locale(currentLanguage);
  const [currentValue, setCurrentValue] = useState(null);

  const handleOnHide = () => {
    onHide()
  };

  const handleRadioChange = (e) => {
    const value = e.target.value   
    setCurrentValue(value);
    setDocumentFormat(value);
    onHide()
  };


  return (
    <Modal
      show={show}
      onHide={handleOnHide}
      centered
      // className="order-pdf-modal"
      backdropClassName="add-ingredient-backdrop"
    >
      <Modal.Header className="add-restaurants-modal-header" closeButton />
      <Modal.Body style={{ paddingTop: "40px", margin: "auto" }}>
        <Container style={{ maxWidth: "100%" }}>
          <h2>{t("Downlaod Document in: ")}</h2>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", marginTop: "20px"}}>
            <Form.Check
              type="radio"
              id="consolidate-by-order"
              name="consolidateFormat"
              label={t("Excel")}
              value="excel"
              checked={currentValue === 'excel'}
              onChange={handleRadioChange}
              style={{ cursor: "pointer" }}
            />
            <Form.Check
              type="radio"
              id="consolidate-by-product"
              name="consolidateFormat"
              label={t("Pdf")}
              value="pdf"
              checked={currentValue === 'pdf'}
              onChange={handleRadioChange}
              className="mb-2"
              style={{ cursor: "pointer" }}
            />
            </div>
        </Container>
      </Modal.Body>
    </Modal>
  );
}

export default ConfirmDownlaodModal;
