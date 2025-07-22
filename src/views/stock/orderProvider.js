import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import moment from "moment";
import { Card, Row, Col } from "react-bootstrap";
import { useHistory, useLocation } from "react-router-dom";

import request from "services/request";
import storage from "services/storage";
import CustomTable from "components/customTable/index.tsx";
import SampleRestaurantModal from "components/sampleRestaurant";
import useCurrencySymbol from "customHooks/useCurrencySymbol";
import { useUserData } from "contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
import { DEFAULT_ERROR_MESSAGE } from "common/constants";
import { useTranslation } from "react-i18next";

import UploadModal from "./modal.tsx";
import StockService from "./service";
import { customToFixed } from "common/utils.ts";
import { getDeliveryDate, slugify } from "./utils";

import FullSoonLogo from "assets/images/cible_l.png";

import "assets/fonts/NunitoSans-Light-normal";

/**
 * function to render when a user navigates to order-to-provider screen
 * @returns
 */
function OrderProvider() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { currencyNameSymbol } = useCurrencySymbol();
  const currentLanguage = i18n.language;
  const history = useHistory();
  let pdfRef = useRef(null);
  let prevProvider = useRef(null); 
  const { setError, setLoading } = useLoading();
  const [ isLoading, setIsLoading ] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [isModal, setIsModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [sampleRestaurantModal, setSampleRestaurantModal] = useState(false);
  const currentUser = JSON.parse(storage.getItem("user"));
  const { selectedRestaurantId, restaurants, selectedRestaurant } = useUserData();

  var doc = new jsPDF({ format: "letter", unit: "px" });
  doc.setFont("NunitoSans-Light-normal", "normal");
  
  const categoryPriorityOrder = ["frozen", "meatFish", "fruitsAndVegetables", "otherFreshProducts", "dryGroceries", "drinks", "packaging", "others"];

  const currentRestaurant = restaurants.find(
    (r) => r.id === selectedRestaurantId
  );

  const currentProvider = StockService.getItemsByProvider(
    location.state?.selected
  );

  
  const tableColumns = [
    {
      caption: t("ReferenceNumber"),
      dataField: "provider_referernce_number",
      className: "text-start",
      headerClassName: "text-start",
      type: "customRender",
      render: (_, it) => {
        return  (
        <span>
          {/* {currentProvider?.defaultProvider?.provider_reference_number} */}
          {it?.providers[0].provider_reference_number}
        </span>
      )}
    },
    {
      caption: t("Product"),
      dataField: "name",
      className: "text-start",
      headerClassName: "text-start",
      type: "customRender",
      render: (_, it) => {
        return  (
        <span>
          {currentProvider?.defaultProvider?.conditioning_name?.provider_reference_name ?? it.name}
        </span>
      )}
    },
    {
      caption: t("Conditioning"),
      dataField: "conditioning_name_1",
      className: "text-center",
      headerClassName: "text-center",
      type: "customRender",
      render: (_, it) => {
        return  (
        <span style={{whiteSpace : "normal", display: "flex", justifyContent: "center" }}>
           {it.product_quantity} {it?.providers?.find(p => p.is_default)?.conditioning_name_1 || currentProvider.defaultProvider.conditioning_name_1}
            {/* x {currentProvider.defaultProvider.conditioning_quantity_1} {currentProvider.defaultProvider.conditioning_unit_1}  */}
        </span>
      )}
    },
    {
      caption: t("Qty"),
      dataField: "product_quantity",
      className: "text-start",
      headerClassName: "text-start",
      type: "customRender",
      render: (_, it) => {
        return  (
        <span>
           {Math.ceil(parseFloat(it?.qty_to_buy)/ it?.providers.find(p => p.is_default)?.recipe_unit_quantity)}
            {/* x {currentProvider.defaultProvider.conditioning_quantity_1} {currentProvider.defaultProvider.conditioning_unit_1}  */}
            
        </span>
      )}
    },
    {
      caption: t("UnitPrice (without tax)"),
      dataField: "cost_excl_tax",
      className: "text-start",
      headerClassName: "text-start",
      type: "number",
    },
    {
      caption: t("Total (without tax)"),
      className: "text-start",
      headerClassName: "text-start",
      type: "customRender",
      render: (_, it) => {
        return  (
          <span>
            {
              (Math.ceil(parseFloat(it?.qty_to_buy)/ it?.providers.find(p => p.is_default)?.recipe_unit_quantity) * it.cost_excl_tax)?.toFixed(2)
            }
        </span>
      )}
    },
  ];

  const getOrders =async () => {
    const payload = {
      restaurant_id: selectedRestaurantId,
      provider: currentProvider.defaultProvider.name
    };
    const res = await request.get(`purchase-orders`, payload);
    setOrderNumber(`${slugify(currentProvider.defaultProvider.name).toUpperCase()}-${res?.total_results+1}`)
  };

  useEffect(() => {
    if(selectedRestaurantId){
      getOrders()
    }
    prevProvider.current = currentProvider?.defaultProvider;
  },[selectedRestaurantId])
  /**
   * hook to be called whenever this component loads
   */
  useEffect(() => {
    if (!location.state?.selected) {
      history.push("/stock");
      return;
    }

    if (!currentProvider) {
      history.push("/stock");
      return;
    }
    currentProvider.products = currentProvider.ingredients.map((p) => ({
      ...p,
      cost: parseFloat(currentProvider.defaultProvider.price_excl_tax) * Math.ceil(parseFloat(p.qty_to_buy) / currentProvider.defaultProvider.recipe_unit_quantity
      ),
    }));

    // Sort products based on category priority
    const sortedProducts = currentProvider.products.sort((a, b) => {
      const categoryA = categoryPriorityOrder.indexOf(a.category);
      const categoryB = categoryPriorityOrder.indexOf(b.category);

      // Ensure categories not found in the list are placed last
      const priorityA = categoryA === -1 ? categoryPriorityOrder.length : categoryA;
      const priorityB = categoryB === -1 ? categoryPriorityOrder.length : categoryB;

      // Sort by the index in categoryPriorityOrder (lower index means higher priority)
      return priorityA - priorityB;
    });

    // Set the sorted products as table data
    setTableData(() => sortedProducts);

    // setTableData(() => currentProvider.products);

    return () => {
      pdfRef.current = null;
    };
  }, []);

 
  const getSum = (rowsItem = []) =>
   {
    return rowsItem.reduce(
      (previousValue, currentValue) =>
      previousValue +
       currentValue?.cost_excl_tax * Math.ceil(parseFloat(currentValue?.qty_to_buy)/ currentValue?.providers.find(p => p.is_default)?.recipe_unit_quantity),
      0
    )};

  /**
   * send an api request to the server
   * @param {*} currentDoc
   */

  const sendRequest = async (currentDoc) => {
    setIsLoading(true)
    const estimatedDeliveryDate = currentProvider?.delivery_date
    ? moment(currentProvider.delivery_date, ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")
    : getDeliveryDate(
        {delivery_days: currentProvider?.defaultProvider?.delivery_condition},
        "YYYY-MM-DD"
      );
    const payload = {
      user_id: currentUser?.id,
      user_email: currentUser?.email,
      provider_id: currentProvider?.defaultProvider.id,
      provider_email: currentProvider?.defaultProvider.email_address,
      provider_name: currentProvider?.defaultProvider.name,
      order_number: null,
      estimated_delivery_date: estimatedDeliveryDate,
      total_price: getSum(tableData),
      // comments: "asd",
      restaurant_id: selectedRestaurantId,
      purchase_items: tableData.map((i) => ({
        ingredient_id: i.id,
        provider_ingredient_id: i?.providers[0]?.provider_ingredient_id,
        name: i.name,
        provider_reference_name: i?.providers[0]?.provider_reference_name,
        provider_reference_number: i?.providers[0]?.provider_reference_number,
        conditioning_name_1: i?.providers[0]?.conditioning_name_1,
        conditioning_unit_1: i?.providers[0]?.conditioning_unit_1,
        conditioning_quantity_1: i?.providers[0]?.conditioning_quantity_1,
        conditioning_name_2: i?.providers[0]?.conditioning_name_2,
        conditioning_unit_2: i?.providers[0]?.conditioning_unit_2,
        conditioning_quantity_2: i?.providers[0]?.conditioning_quantity_2,
        format: i?.providers[0]?.recipe_unit_quantity,
        unit: i.unit,
        unit_quantity: 
        parseFloat(Math.ceil(parseFloat(i?.qty_to_buy)/ i?.providers.find(p => p.is_default)?.recipe_unit_quantity) || 0) * i?.providers[0]?.recipe_unit_quantity,
        product_quantity:  parseFloat(Math.ceil(parseFloat(i?.qty_to_buy)/ i?.providers.find(p => p.is_default)?.recipe_unit_quantity) || 0),
        unit_price: (parseFloat(i?.providers[0]?.price_excl_tax || 0) / parseFloat(i?.providers[0]?.recipe_unit_quantity || 0)),
        product_price: parseFloat(i.cost_excl_tax || 0),
      })),
    };
    try {
      // setLoading(true);
      const result = await request.post("/purchase-orders", payload, false);
      if (![200, 201].includes(result.status)) {
        throw new Error((await result.json())?.msg);
      }

      const resultBody = await result.json();
      const serverOrderNumber = resultBody.order_number;

      const ele = document.getElementById("print");
      const currentDoc = await new Promise(resolve => {
        const doc = new jsPDF({ format: "letter", unit: "px" });
        doc.setFont("NunitoSans-Light-normal", "normal");
        
        // Update order number in printable section
        const orderNumberElement = document.getElementById("order-number-span");
        if (orderNumberElement) {
          orderNumberElement.textContent = serverOrderNumber;
        }
        
        doc.html(ele, {
          html2canvas: { scale: 0.57 },
          callback: (pdf) => {
            pdf.addImage(FullSoonLogo, "PNG", 415, 30);
            resolve(pdf);
          }
        });
      });
      

      const params = new URLSearchParams({ language: currentLanguage });
      let formData = new FormData();
      formData.append("file", currentDoc.output("blob"), "file.pdf");
      
      const resultFile = await request.bodyFile(
        `/purchase-orders/send-to-provider/${resultBody.id}?${params.toString()}`,
        formData
      );
      
      if (![200, 201].includes(resultFile.status)) {
        throw new Error((await resultFile.json())?.msg);
      }
      
      // Store PDF for download
      pdfRef.current = currentDoc;
      setIsLoading(false);
      setLoading(false);
      setIsModal(true);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setIsLoading(false)
      setError(error.message ?? DEFAULT_ERROR_MESSAGE);
    }
  };

  const sendToProvider = async () => {
    setLoading(true);
    if (!selectedRestaurantId) {
      setSampleRestaurantModal(true);
      return;
    }
    await sendRequest();
  };

  const onDownloadClick = () => {
    pdfRef.current?.save(`order-details.pdf`);
  };

  const detailComponent = (type, className) => {
    const isProvider = type === "provider";
    const user = isProvider ? currentProvider?.defaultProvider : currentUser;

    return (
      <>
        <div className={`provider-details  ${className}`}>
          <div>
            <h5>
              {isProvider ? t("ProviderDetails") : t("ClientDetails")}
            </h5>
          </div>

          <div className="mt-4 d-flex justify-content-between">
            <div style={{ width: "30%"}}>
              <label className="p-caption">
                {isProvider ? t("Provider") : t("Name, Surname")}
              </label>
              <br />
              <label className="p-value">
                {user?.name?.toUpperCase() ?? user?.username}
              </label>
            </div>
            <div style={{ width: "30%"}}>
              <label className="p-caption">
                {isProvider ? t("ContactName") : t("Restaurant")}
              </label>
              <br />
              <label className="p-value" style={{ whiteSpace: "normal"}}>
                {user?.contact_name ?? currentRestaurant?.name}
              </label>
            </div>
          </div>
          <div className="mt-4 d-flex justify-content-between">
            <div style={{ width: "30%"}}>
              <label className="p-caption">
                {t("Email")}
              </label>
              <br />
              <label className="p-value">
                {user?.email_address ?? user?.email}
              </label>
            </div>
             {
              
              <div style={{ width: "30%"}}>
                {type === "client" && <label className="p-caption">
                  {t("Client Code")}
                </label>}
                <br />
               {type === "client" && <label className="p-value" style={{ whiteSpace: "normal"}}>
                {prevProvider?.current?.client_code}
                </label>}
              </div>
            }
          </div>
            {isProvider && <div>
              <label className="p-caption">
                {t("EntityNumber")}
              </label>
              <br />
              <label className="p-value">
                {user?.entity_number}
              </label>
            </div>}
          <div>
            <label className="p-caption">{t("PhoneNumber")}</label>
            <br />
            <label className="p-value">
              {user?.phone_number ?? user?.contact_number}
            </label>
          </div>
          {
            !isProvider &&
            <div>
            <label className="p-caption">{t("SIRET")}</label>
            <br />
            <label className="p-value">
              {selectedRestaurant?.siret_number}
            </label>
          </div>
          }
          <div>
            <label className="p-caption">{t("Address")}</label>
            <br />
            <label className="p-value mb-0">{currentRestaurant?.address}</label>
          </div>
        </div>
      </>
    );
  };


  return (
    <div className="wrappers orders-provider-container">
      <SampleRestaurantModal
        show={sampleRestaurantModal}
        onHide={() => setSampleRestaurantModal(false)}
      />
      <UploadModal
        show={isModal}
        onHide={() => {
          history.push("/stock/suggested-orders");
          setIsModal(false);
        }}
        title="Order placed !"
        subTitle="Your order has been successfully placed."
        onDownloadClick={onDownloadClick}
      />

      <section className={`maincontent h-100 maincontent-collapsed`}>
        <Card className="p-5 order-container " id="order-container">
          <Row className="mb-4">
            <label className="order-back back" onClick={() => history.goBack()}>
              {"<"} {t("Back")}
            </label>
          </Row>
          <Row className="mb-3">
            <h3 className="heading-text fw-bold">
              {t("Order to provider")}: {currentProvider?.name?.toUpperCase()}
            </h3>
          </Row>
          <Row className="h-100">
            <Col sm={4} className="details">
              {detailComponent("provider")}
              {detailComponent("client", "order-provider-client mt-5")}
            </Col>
            <Col className="order-details" sm={{ span: 6, offset: 2 }}>
              <h3 className="o-d">{t("OrderDetails")}</h3>
              <div className="c-t-order-provider">
                <CustomTable
                  columns={tableColumns}
                  data={tableData}
                  selectedKey="id"
                  tableName="order-provider"
                />
              </div>
              <div className="order-summary my-3">
                <div className="d-flex justify-content-between d-date">
                  <span className="caption">
                    {t("Estimated delivery date")}*
                  </span>
                  <span className="value">
                    {currentProvider?.delivery_date ? currentProvider?.delivery_date : getDeliveryDate({delivery_days: currentProvider?.defaultProvider?.delivery_condition}, currentLanguage === 'fr' ? "DD-MM-YYYY" : "MM-DD-YYYY")}
                  </span>
                </div>
                <div className="d-flex justify-content-between t-order">
                  <span className="caption">{t("Total Order")}</span>
                  <span className="value">
                    {customToFixed(getSum(tableData) || 0)} {currencyNameSymbol}
                  </span>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3 selected-prod-div">
                <button
                  className="float-end place-order-btn"
                  onClick={sendToProvider}
                  disabled={isLoading}
                  style={{ backgroundColor: isLoading ? "#9d9d9d" : ""}}
                >
                  {t("Send order to provider")}
                </button>
              </div>
            </Col>
          </Row>
        </Card>
      </section>
      <div className=" d-none d-print-block">
        <section
          className={`maincontent h-100 maincontent-collapsed p-5`}
          id="print"
        >
          <Row className="mb-4">
            <h5 className=" fw-bold">{t("Order summary")}</h5>
            {/* <div>
              <span>{t("OrderDate")}:</span>
              <span>
                {getDeliveryDate({delivery_days: currentProvider?.defaultProvider?.delivery_condition}, currentLanguage === 'fr' ? "DD-MM-YYYY" : "MM-DD-YYYY")}
              </span>
            </div> */}
            <div>
              <span>{t("OrderNumber")}:</span>
              <span id="order-number-span">
              </span>
            </div>
          </Row>
          <div className="d-flex flex-row">
            {detailComponent("provider", "details-tab p-d col")}
            {detailComponent("client", "details-tab c-d col")}
          </div>
          <Row className="mt-5">
            <div>
              <h5>{t("OrderDetails")}</h5>
            </div>
            <Col sm={{ span: 12 }}>
              <div className="custom-table">
                <div className="tablescroll">
                  <table className="w-100 c-t">
                    <thead>
                      <tr style={{ background: "#fff" }}>
                        <th>
                          {t("ReferenceNumber")}
                        </th>
                        <th style={{ height: "50px", width: "70%" }}>
                          {t("Product")}
                        </th>
                        <th className="text-start">{t("Conditioning")}</th>
                        <th className="text-start">{t("Qty")}</th>
                        <th className="text-end">{t("Total")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((it, i) => (
                        <tr key={i}>
                          <td>
                            {/* {currentProvider?.defaultProvider?.provider_reference_number} */}
                            {it?.providers?.[0]?.provider_reference_number}
                          </td>
                          <td style={{ height: "50px", width: "50%" }}>
                            {it.name}
                          </td>
                          <td style={{ height: "50px", width: "50%" }}>
                            {`${it?.providers.find(p => p.is_default)?.conditioning_name_1 || currentProvider?.defaultProvider?.conditioning_name_1} ${it?.providers.find(p => p.is_default)?.conditioning_quantity_1 || currentProvider?.defaultProvider?.conditioning_quantity_1} ${t(it?.providers.find(p => p.is_default)?.conditioning_unit_1 || currentProvider?.defaultProvider?.conditioning_unit_1)}`}
                          </td>
                          <td className="text-start">{Math.ceil(parseFloat(it?.qty_to_buy)/ it?.providers.find(p => p.is_default)?.recipe_unit_quantity)}</td>
                          <td className="text-end">{parseFloat(Math.ceil(parseFloat(it?.qty_to_buy)/ it?.providers.find(p => p.is_default)?.recipe_unit_quantity) * it.cost_excl_tax).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="order-summary mt-5">
                <div className="d-flex justify-content-between d-date">
                  <span className="caption">
                    {t("Estimated delivery date")}*
                  </span>
                  <span className="value">
                    {currentProvider?.delivery_date ? currentProvider?.delivery_date : getDeliveryDate({delivery_days: currentProvider?.defaultProvider?.delivery_condition}, currentLanguage === 'fr' ? "DD-MM-YYYY" : "MM-DD-YYYY")}
                  </span>
                </div>

                <div className="d-flex justify-content-between t-order">
                  <span className="caption">{t("Total")}</span>
                  <span className="value">
                    {customToFixed(getSum(tableData) || 0)} {currencyNameSymbol}
                  </span>
                </div>
              </div>
              <div>
                *
                {t(
                  "Based on delivery frequency and not on the provider’s schedule"
                )}
                .
              </div>
            </Col>
          </Row>
        </section>
      </div>
    </div>
  );
}

export default OrderProvider;
