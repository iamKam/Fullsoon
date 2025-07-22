import React, { useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";

import useWindowSize from "customHooks/useWindowResize";
import { CUTTOFF_HEIGHT } from "common/constants";

import LeftSide from "./leftSide";
import RightSide from "./rightSide";

import "./index.scss";

const INITIAL_STATE = {
  start_date: moment().subtract(1, "days").format("YYYY-MM-DD"),
  end_date: moment().subtract(1, "days").format("YYYY-MM-DD"),
  meals: [],
  myRestaurants: [],
  breakfast: false,
  lunch: false,
  afternoon: false,
  dinner: false,
  outsideServiceTimeslot: false,
}

function Meals() {
  const [, height] = useWindowSize();
  const { t } = useTranslation();
  const [formData, setformData] = useState(INITIAL_STATE);
  const [isDetailTab, setIsDetailTab] = useState(true);

  const onApply = (params) => {
    setformData({ ...params });
  };

  const renderMeal = () => {
    return (
      <>
        <LeftSide formData={formData} isDetailTab={isDetailTab} />
        <RightSide onApply={setformData} />
        {/* <RightSide onApply={onApply} /> */}
      </>
    );
  };

  return (
    <>
      {height > 0 && CUTTOFF_HEIGHT >= height && (
        <>
          <div className="divider">
            <ul className="navbtns mb-0">
              <li className={`${isDetailTab ? "active" : ""}`}>
                <button
                  className={`nav-link ${isDetailTab ? "active" : ""}`}
                  onClick={() => setIsDetailTab(true)}
                >
                  {t("DetailsTable")}
                </button>
              </li>
              <li className={`${!isDetailTab ? "active" : ""}`}>
                <button
                  className={`nav-link ${!isDetailTab ? "active" : ""}`}
                  onClick={() => setIsDetailTab(false)}
                >
                  {t("ComparisonSales")}
                </button>
              </li>
            </ul>
          </div>
          <div className={`d-flex after-divider-container`}>{renderMeal()}</div>
        </>
      )}

      {height > 0 && CUTTOFF_HEIGHT < height && renderMeal()}
    </>
  );
}

export default Meals;
