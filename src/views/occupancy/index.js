import React, { useState } from "react";
import moment from "moment";
import LeftSide from "./leftSide";
import RightSide from "./rightSide";
import LeftDailyOccupancy from "./leftDailyOccupancy";
import LeftYearlyOccupancy from "./leftYearlyOccupancy";
import RightYearlyOccupancy from "./rightYearlyOccupancy";
import RightDailyOccupancy from "./rightDailyOcccupancy";
import { useSubMenuData } from "contexts/SidebarContextManagment";

import "./index.scss";

const INITIAL_STATE = {
  start_date: moment().subtract(3, 'days').format('YYYY-MM-DD'),
  end_date: moment().add(3, 'days').format('YYYY-MM-DD'),
  breakfast: false,
  lunch: false,
  afternoon: false,
  dinner: false,
  outsideServiceTimeslot: false,
  time_check_boxes: [],
  timeDurations: {},
}

function Occupancy() {
  const { selectedOccupancySubMenu } = useSubMenuData();
  const [formData, setFormData] = useState(INITIAL_STATE);

  const handleFormDataChange = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  return (
    <>
      {selectedOccupancySubMenu === "Daily occupancy" && (
        <>
          <LeftDailyOccupancy 
            formData={formData} 
          />
          <RightDailyOccupancy 
            formData={formData}
            onApply={handleFormDataChange}
          />
        </>
      )}
      {selectedOccupancySubMenu === "Yearly occupancy" && (
        <>
          <LeftYearlyOccupancy formData={formData} />
          <RightYearlyOccupancy 
            formData={formData}
            onApply={handleFormDataChange}
          />
        </>
      )}
        {/* <LeftSide formData={formData} />
        <RightSide onApply={onApply} formData={formData} /> */}
    </>
  );
}

export default Occupancy;