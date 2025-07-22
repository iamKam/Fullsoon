import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Row, Col, Card } from "react-bootstrap";

import CustomTable from "components/customTable/index.tsx";
import SortFilter, { sortTableData } from "components/customTable/sortFilter";
import { cloneDeep } from "common/utils";

import UploadModal from "./modal.tsx";
import StockService from "./service";
import { getDeliveryDate, getAllPossibleDeliveryDates } from "./utils";

import Trashicon from "assets/images/icon/filter.svg";
import EditIcon from "assets/images/icon/EDIT.svg";
import { useTranslation } from "react-i18next";
import { Dropdown } from "react-bootstrap";

/**
 * SuggestedOrders component which displays the suggested orders after the user clicks on place-order of stock screen
 * @param {*} props
 * @returns UI component
 */
function SuggestedOrder(props) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const history = useHistory();
  const [isModal, setIsModal] = useState(false);
  const [fd, setfd] = useState({ order_by: "DESC" });
  const [tableData, setTableData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const onRowSelectChanged = (col, rowData) => (ev) => {
  }

  const onChangeProvider = (data, item, providerId) => {
    const defaultProviders = [];
    return data.map(i => {
      item.ingredients.forEach(item => {
       const asd = item.providers.find(i => i.id === providerId)
       defaultProviders.push(asd.price_excl_tax * Math.ceil(parseFloat(item.qty_to_buy/asd.recipe_unit_quantity)))
      })
      return {
        ...i,
      defaultProvider: i.id === item.id ? {...item.providers.find(p => p.id === providerId), is_default: true} : {...i.defaultProvider, is_default: true},
      cost: defaultProviders.reduce(function(accumulator, currentValue) {
        return accumulator + currentValue;
      }, 0),
    }})
  }

  const onChangeDeliveryDate = (data, item, date) => {
    const ingredientIdsToUpdate = item.ingredients.map(ing => ing.id);
    return data.map(provider => {
      // Only update the provider that matches the item we're changing
      if (provider.id === item.id) {
        return {
          ...provider,
          delivery_date: date,
          ingredients: provider.ingredients.map(ingredient => {
            if (ingredientIdsToUpdate.includes(ingredient.id)) {
              return {
                ...ingredient,
                delivery_date: date,
              };
            }
            return ingredient;
          }),
        };
      }
      return provider;
    });
  };
  /**
   * columns to be displayed in the table
   */


  const tableColumns = [
    {
      caption: t("Providers"),
      dataField: "providerNames",
      type: "customRender",
      className: "text-center overflow-visible",
      style: {
        position: "static",
        display: "flex"
      },
      headerClassName: "text-center",
      render: (x, item) => {
        const providers = item.providers
        const defaultProvider = item.defaultProvider
        const onProviderChange = (providerId) => {
          setTableData((p)=> onChangeProvider(p, item, providerId) )
          StockService.setItemsByProvider(onChangeProvider(tableData, item, providerId));
        }

        return  (
        <Dropdown
          style={{ position: "inherit", display: "flex", justifyContent: "center", width: "100%" }}
          className=""
          onSelect={onProviderChange}
        >
          <Dropdown.Toggle
            variant="link"
            className="btn btn-white dropdown-toggle btn-icon"
            style={{
              color: "inherit",
              minWidth: "115px",
            }}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            {defaultProvider?.name}
          </Dropdown.Toggle>

          <Dropdown.Menu
            className="dropdown-menu-custom"
            style={{ inset: "unset !important" }}
          >
            {providers?.map((d, i) => (
              <Dropdown.Item key={i} eventKey={d.id}>
                {d.name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>)
      },
    },
    {
      caption: t("Products"),
      dataField: "productsText",
      type: "customRender",
      className: "text-center",
      headerClassName: "text-center",
      render: (x, item) => {
        const names = item.ingredients.map((p) => p.name);
        const others = (x) =>
          x > 2 ? <span className="fw-bold">{x - 2} others</span> : "";

        let str =
          names.length > 2 ? `${names[0]}, ${names[1]} and ` : names.join(", ");

        return (
          <div style={{ whiteSpace: "initial" }}>
            {str} {others(names?.length)}
          </div>
        );
      },
    },
    {
      caption: t("Estimated delivery date"),
      dataField: "delivery_frequency",
      type: "customRender",
      className: "text-center overflow-visible",
      style: {
        position: "static",
        display: "flex",
        justifyContent: "center"
      },
      headerClassName: "text-center",
      render: (_, item) => {
        const format = currentLanguage === 'fr' ? "DD-MM-YYYY" : "MM-DD-YYYY";
        // Use manually set date if available, otherwise fallback to calculated
        const selectedDate = item.delivery_date || getDeliveryDate(
          { delivery_days: item?.defaultProvider?.delivery_condition },
          format
        );
      
        const allDates = getAllPossibleDeliveryDates(
          { delivery_days: item?.defaultProvider?.delivery_condition },
          format
        );

        const onEstimatedDateChange = (date) => {
          setTableData((prev) => {
            const updated = onChangeDeliveryDate(prev, item, date);
            StockService.setItemsByDeliveryDate(updated);
            return updated;
          });
        };        
      
        return (
          <Dropdown onSelect={onEstimatedDateChange}>
            <Dropdown.Toggle
              variant="link"
              className="btn btn-white dropdown-toggle btn-icon"
              style={{ minWidth: "130px" }}
            >
              {selectedDate}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {allDates.map(date => (
                <Dropdown.Item eventKey={date} key={date}>
                  {date}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        );
      }                  
    },
    {
      caption: t("TotalPrice"),
      dataField: "cost",
      type: "customRender",
      className: "text-center",
      headerClassName: "text-center",
      render: (x, item) => {
       return item.ingredients.reduce((previousValue, currentValue) => {
          return (
            previousValue +
            (currentValue?.cost_excl_tax * Math.ceil(parseFloat(currentValue?.qty_to_buy)/ currentValue?.providers.find(p => p.is_default)?.recipe_unit_quantity))
          );
        }, 0)?.toFixed(2);
      },
    },

    {
      dataField: "action",
      type: "dynamic",
      caption: "",
      className: "text-center",
      headerClassName: "text-center",
      elem: (_, item) => {
        return (
        <label
          className="order-edit-btn"
          onClick={() => {
            history.push({
              pathname: "/stock/suggested-orders/details",
              state: { selected: item.ingredients[0].id },
            });
          }}
        >
          <img src={EditIcon} alt="..." />
          <span className="mt-1">{t("Edit")}</span>
        </label>
      )},
    },
    {
      dataField: "action",
      caption: "",
      className: "text-center",
      headerClassName: "text-center",
      elem: (_, it) => (
        <button className="order-now-btn" onClick={orderSubmit(it)}>
          {t("Order now")}
        </button>
      ),
      type: "dynamic",
      class: "order",
    },
  ];

  /**
   * method when a user submits the order
   * @param {*} it selected order
   * @returns undefined
   */

  const orderSubmit = (it) => () => {
    history.push({
      pathname: "/stock/order-to-provider",
      state: { selected: it.ingredients[0].id },
    });
  };

  /**
   * hook to be called when this component loads
   */

  useEffect(() => {
    const itemsByProvider = StockService.getItemsByProvider();
    if (itemsByProvider?.length) {
      setTableData(itemsByProvider);
      return;
    }
    history.push("/stock");
  }, []);

  /**
   * function to be called when a user selects an order(left-side checkboxes of the table)
   * @param {*} it
   * @returns
   */
  const selectChange =
    (it) =>
    ({ target: { checked } }) => {
      const newSelectedItems = cloneDeep(selectedItems);
      if (checked) {
        setSelectedItems(() => [...newSelectedItems, it.id]);
      } else {
        setSelectedItems(() =>
          newSelectedItems.filter((p) => p !== it.id)
        );
      }
    };

  /**
   *
   * @param {Event} target
   * @returns undefined
   */

  const selectAllProducts = ({ target: { checked } }) =>
    setSelectedItems(() =>
      checked ? tableData.map(({ id }) => id) : []
    );

  /**
   * Delete rows from the table & update the state
   */
  const deleteRows = async () => {
    setSelectedItems(() => []);
    setTableData(() =>
      tableData.filter(({ id }) => !selectedItems.includes(id))
    );
  };

  const rows = sortTableData(fd, tableColumns, tableData);

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
            <label
              className="order-back back"
              onClick={() => history.push("/stock")}
            >
              {"<"} {t("Back")}
            </label>
          </Row>
          <Row>
            <h3 className="heading-text">{t("Suggested orders")}</h3>
          </Row>
          <Row>
            <div className="d-flex row">
              <Col></Col>
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
          <Row className="suggested-table">
            <CustomTable
              columns={tableColumns}
              data={rows}
              selectChange={selectChange}
              selectedProducts={selectedItems}
              selectAllProducts={selectAllProducts}
              selectedKey="id"
              onRowSelectChanged={onRowSelectChanged}
            />
          </Row>
        </Card>
      </section>
    </div>
  );
}

export default SuggestedOrder;
