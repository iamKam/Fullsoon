import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Spinner, Row, Col } from "react-bootstrap";

import TopAndFlopView from "views/commonViews/topAndFlop";
import BasicLineChart from "components/basicLineChart";
import CustomTable from "components/customTable";
import { useUserData } from "contexts/AuthContextManagement";

function Comparison({
  formData,
  lineChartData,
  isTop,
  setIsTop,
  top,
  flop,
  topFlopLoading,
  filteredTableData,
  getMealGraphData,
  mealsLoading,
  payload,
}) {
  const { t } = useTranslation();
  const {
    isRestaurantLoaded,
    hasRetaurants
  } = useUserData();
  const [tooltipModal, setIsTooltipModal] = useState(null);

  const seriesLineChart = useMemo(() => {
    return lineChartData.map((d) => ({
      ...d,
      events: {
        legendItemClick: (ev) =>
          !ev.target.visible ? getSameOrderMeals({ ev, col: d }) : undefined,
      },
    }));
  }, [lineChartData]);

  const getSameOrderMeals = async (ev) => {
    // const result = await request.get(
    //   "tables/meals/same-ordered-meals",
    //   omit({ ...payload, meal_id: ev?.col?.id }, [
    //     "start_time",
    //     "end_time",
    //     "meals",
    //   ])
    // );
    // setIsTooltipModal({ ...ev, result });
  };

  const tableColumns = useMemo(
    () => [
      {
        dataField: "name",
        caption: t("Meal"),
        className: "fw-bold",
        style: { width: "150px" },
        headerStyle: { width: "150px" },
      },
      {
        dataField: "sales",
        caption: t("Sales"),
        className: "fw-bold text-center",
        style: { width: "150px" },
        headerStyle: { width: "150px", textAlign: "center" },
      },
    ],
    []
  );

  return (
    <>
      <Modal
        show={!!tooltipModal}
        className="delete-modal"
        aria-labelledby="contained-modal-title-vcenter"
        dialogClassName="modal-90w"
        centered
        onHide={() => setIsTooltipModal(null)}
      >
        <Modal.Header className="add-restaurants-modal-header ps-0" closeButton>
          <Modal.Title
            className="add-restaurants-modal-title"
            id="contained-modal-title-vcenter"
          >
            {tooltipModal?.col?.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="add-restaurants-modal-body ps-0 pe-0">
          <Row>
            <Col lg={12} style={{ height: "40vh" }}>
              <CustomTable
                columns={tableColumns}
                data={tooltipModal?.result?.same_ordered_meals}
              />
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      <div className="col-lg-9 h-100">
        <div className="card mb-0 h-100">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h2>{t("ComparisonGraph")}</h2>
          </div>
          <div className="card-body h-100">
            {mealsLoading && (
              <div className="w-100 d-flex justify-content-center card-spinner-container">
                <Spinner animation="border" variant="primary" />
              </div>
            )}
            {!mealsLoading && <BasicLineChart formData={formData} getMealGraphData={getMealGraphData} series={seriesLineChart} data={filteredTableData} />}
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card cardlist mb-0">
          <div className="card-body">
            <h2 className="mb-3">{t("Sales")}</h2>

            <ul className=" navbtns ">
              <li className={`${isTop ? "active" : ""}`}>
                <button
                  className={`nav-link ${isTop ? "active" : ""}`}
                  onClick={() => setIsTop(true)}
                >
                  {t("Top")}
                </button>
              </li>
              <li className={`${!isTop ? "active" : ""}`}>
                <button
                  className={`nav-link ${!isTop ? "active" : ""}`}
                  onClick={() => setIsTop(false)}
                >
                  {t("Flop")}
                </button>
              </li>
            </ul>
            {!topFlopLoading && (
              <div className="top-flop">
                {isTop && <TopAndFlopView data={top} />}
                {!isTop && <TopAndFlopView data={flop} />}
              </div>
            )}
            {topFlopLoading && (
              <div className="w-100 d-flex justify-content-center card-spinner-container">
                <Spinner animation="border" variant="primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Comparison;
