import React, { useState, useEffect } from "react";
import { Card, Row, Col } from "react-bootstrap";
import { useHistory, useLocation } from "react-router-dom";
import { set } from "lodash";
import { useTranslation } from "react-i18next";

import SortFilter, { sortTableData } from "components/customTable/sortFilter";
import { cloneDeep, customToFixed } from "common/utils.ts";

import UploadModal from "./modal.tsx";
import StockService from "./service";

import Trashicon from "assets/images/icon/filter.svg";
import CustomTable from "components/customTable/index.tsx";

function EditSuggestedOrder(props) {
  const location = useLocation();
  const { t } = useTranslation();
  const history = useHistory();
  const [fd, setfd] = useState({ order_by: "DESC" });
  const [tableData, setTableData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModal, setIsModal] = useState(false);
  const currentProvider = StockService.getItemsByProvider(
    location.state.selected
  )

  const tableColumns = [
    {
      caption: t("ProviderReferenceName"),
      dataField: "provider_reference_name",
      type: "customRender",
      className: "text-center",
      headerClassName: "text-center",
      style: {display: "flex"},
      render: (_, it) => {
        return(
        <span style={{ textAlign: "center", width: "100%" }}>
            {it.providers?.length > 0 && it.providers[0]?.provider_reference_name}
        </span>
      )},
    },
    {
      caption: t("CurrentStock"),
      dataField: "stock",
      type: "customRender",
      className: "text-center",
      headerClassName: "text-center",
      render: (_, it) => {
        return <>
          {it.stock.unit_stock} {it.unit}
        </>
      }
    },
    {
      caption: t("QuantityToBuy"),
      dataField: "product_quantity",
      type: "text",
      className: "text-center",
      headerClassName: "text-center",
    },
    {
      caption: t("Conditioning"),
      dataField: "format",
      type: "customRender",
      className: "text-center",
      headerClassName: "text-center",
      render: (_, it) => {
        return <>
          { Math.ceil(
                  parseFloat(it.qty_to_buy || 0) / it.providers[0]?.recipe_unit_quantity
                )} {it.providers[0]?.conditioning_name_1} x {it.providers[0]?.conditioning_quantity_1} {it.providers[0]?.conditioning_unit_1} 
        </>
      }
    },
    {
      caption: t("TotalPrice (without tax)"),
      dataField: "cost",
      type: "customRender",
      className: "text-center",
      headerClassName: "text-center",
      render: (_, it) => {
        return(
        <span>
          {
              (Math.ceil(
                parseFloat(it.qty_to_buy || 0) / parseFloat(it.providers[0]?.recipe_unit_quantity|| 0)
              ) * it.providers[0]?.price_excl_tax).toFixed(2)
            }
        </span>
      )},
    },
  ];

  useEffect(() => {
    if (!location.state.selected) {
      history.push("/stock");
      return;
    }

    const selectedProvider = StockService.getItemsByProvider(
      location.state.selected
    );

    if (!selectedProvider) {
      history.push("/stock");
      return;
    }
    selectedProvider.products = selectedProvider?.ingredients.map((p) => ({
      ...p,
      cost: parseFloat(p.product_price) * parseFloat(p.product_quantity || 0),
    }));

    setTableData(() => selectedProvider.ingredients);
  }, []);

  const selectChange =
    (it) =>
    ({ target: { checked } }) => {
      const newSelectedItems = cloneDeep(selectedItems);
      if (checked) {
        setSelectedItems(() => [...newSelectedItems, it.id]);
      } else {
        setSelectedItems(() => newSelectedItems.filter((p) => p !== it.id));
      }
    };

  const selectAllProducts = ({ target: { checked } }) => {
    if (checked) {
      setSelectedItems(() => [...tableData.map((t) => t.id)]);
    } else {
      setSelectedItems(() => []);
    }
  };

  const deleteRows = async () => {
    const newSelectedItems = cloneDeep(selectedItems);
    setSelectedItems(() =>
      newSelectedItems.filter((p) => !newSelectedItems.find((x) => x === p))
    );
    StockService.removeItemfromProvider(location.state.selected, selectedItems);
    setTableData(() =>
      tableData.filter((p) => !newSelectedItems.find((x) => x === p.id))
    );
  };

  const tableInputChange =
    (it) =>
    ({ target: { name, value } }) => {
      const newTableData = cloneDeep(tableData);
      const isExist = newTableData.find((f) => f.id === it.id);
      if (isExist) {
        set(isExist, name, value);
        set(
          isExist,
          "cost",
          parseFloat(value) * parseFloat(it.unit_price) || 0
        );
        StockService.updateItemOfProvider(
          location.state.selected,
          it.id,
          name,
          value
        );
        StockService.updateItemOfProvider(
          location.state.selected,
          it.id,
          name,
          value
        );
        setTableData(newTableData);
      }
    };

  const rows = sortTableData(fd, tableColumns, tableData);

  const getSum = (rowsItem = []) => {
    return rowsItem.reduce((previousValue, currentValue) => {
      return (
        previousValue +
        (Math.ceil(
          parseFloat(currentValue.qty_to_buy || 0) / parseFloat(currentProvider.defaultProvider.recipe_unit_quantity|| 0)
        )* currentProvider.defaultProvider.price_excl_tax)
      );
    }, 0);
  };

  const selectedItemsSum = () => {
    const items = selectedItems.map((id) => tableData.find((t) => t.id === id));
    return customToFixed(getSum(items) || 0);
  };

  const orderSubmit = () => {
    history.push({
      pathname: "/stock/order-to-provider",
      state: { selected: location.state.selected },
    });
  };

  return (
    <div className="wrappers suggested-orders-container">
      <UploadModal
        show={isModal}
        onHide={() => setIsModal(false)}
        title="Order placed !"
        subTitle="Your order has been successfully placed."
      />
      <section className={`maincontent h-100 maincontent-collapsed`}>
        <Card className="p-5 order-container">
          <Row className="mb-4">
            <label className="order-back back" onClick={() => history.goBack()}>
              {"<"} {t("Back")}
            </label>
          </Row>
          <Row>
            <h3 className="heading-text">
              {StockService.getItemsByProvider(
                location.state.selected
              )?.provider?.name?.toUpperCase()}{" "}
              {t("OrderDetails")}
            </h3>
          </Row>
          <Row>
            <div className="d-flex row">
              <Col className="sort-container d-flex justify-content-end">
                {Boolean(selectedItems.length) && (
                  <img
                    src={Trashicon}
                    onClick={deleteRows}
                    className="me-3 cursor-pointer"
                    alt="..."
                  />
                )}
                <SortFilter
                  cols={tableColumns}
                  fd={fd}
                  setfd={setfd}
                  rootClassName="sort-filter"
                />
              </Col>
            </div>
          </Row>
          <CustomTable
            columns={tableColumns}
            data={rows}
            tableName="suggested-orders"
            selectChange={selectChange}
            selectedProducts={selectedItems}
            selectAllProducts={selectAllProducts}
            selectedKey="id"
            onInputChange={tableInputChange}
          />
          <div className="d-flex justify-content-end mt-4 me-2 selected-prod-div">
            {Boolean(selectedItems.length) && (
              <div className="d-flex flex-column me-3">
                <label className="d-flex justify-content-end tc">
                  Total price
                </label>
                <label className="d-flex justify-content-end fw-bold sum">
                  {selectedItemsSum()} EUR
                </label>
              </div>
            )}
            <button
              className="float-end place-order-btn me-3"
              onClick={orderSubmit}
            >
              {t("Order now")}
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default EditSuggestedOrder;
