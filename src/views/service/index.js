import React, { useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";

import useWindowSize from "customHooks/useWindowResize";
import { CUTTOFF_HEIGHT } from "common/constants";

import LeftSide from "./leftSide";
import RightSide from "./rightSide";

import "./index.scss";

function Service() {
  const [, height] = useWindowSize();
  const { t } = useTranslation();
  const [formData, setformData] = useState({
    start_date: moment().format("YYYY-MM-DD"),
    end_date: moment().format("YYYY-MM-DD"),
    meals: [],
  });
  const [isTableTab, setIsTableTab] = useState(true);

  const onApply = (params) => {
    setformData({ ...params });
  };

  const renderService = () => {
    return (
      <>
        <LeftSide formData={formData} isTableTab={isTableTab} />
        <RightSide onApply={onApply} formData={formData} />
      </>
    );
  };

  return (
    <>
      {CUTTOFF_HEIGHT >= height && (
        <>
          <div className="divider">
            <ul className="navbtns mb-0">
              <li className={`${isTableTab ? "active" : ""}`}>
                <button
                  className={`nav-link ${isTableTab ? "active" : ""}`}
                  onClick={() => setIsTableTab(true)}
                >
                  {t("DetailsTable")}
                </button>
              </li>
              <li className={`${!isTableTab ? "active" : ""}`}>
                <button
                  className={`nav-link ${!isTableTab ? "active" : ""}`}
                  onClick={() => setIsTableTab(false)}
                >
                  {t("ComparisonSales")}
                </button>
              </li>
            </ul>
          </div>
          <div className={`d-flex after-divider-container`}>
            {renderService()}
          </div>
        </>
      )}

      {CUTTOFF_HEIGHT < height && renderService()}
    </>
  );
}

export default Service;
