import React from "react";
import { useTranslation } from "react-i18next";

import TopAndFlopView from "views/commonViews/topAndFlop";
import BasicLineChart from "components/basicLineChart";

function Comparison({ lineChartData, isTop, setIsTop, top, flop }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="col-lg-9 h-100">
        <div className="card mb-0 h-100">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h2>{t("ComparisonGraph")}</h2>
          </div>
          <div className="card-body h-100">
            <BasicLineChart series={lineChartData} />
          </div>
        </div>
      </div>
      <div className="col-lg-3">
        <div className="card cardlist h-60">
          <div className="card-body">
            <h2 className="mb-2">{t("ServiceDuration")}</h2>

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
            <div className="top-flop">
              {isTop && <TopAndFlopView data={top} />}
              {!isTop && <TopAndFlopView data={flop} />}
            </div>
          </div>
        </div>
        <div className="card progresscard mb-0">
          <div className="card-body">
            <h2 className="mb-3">{t("Staff")}</h2>

            <div className="progressitem mb-3">
              <p className="d-flex align-items-center justify-content-between">
                <span>Cooks</span> <span>5/10</span>
              </p>

              <div className="progress">
                <div
                  className="progress-bar w-50"
                  role="progressbar"
                  aria-valuenow="50"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
            <div className="progressitem mb-0">
              <p className="d-flex align-items-center justify-content-between">
                <span>Waiters</span> <span>8/10</span>
              </p>
              <div className="progress">
                <div
                  className="progress-bar w-75"
                  role="progressbar"
                  aria-valuenow="75"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Comparison;
