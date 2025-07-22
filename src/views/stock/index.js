import React, { useState } from "react";
import moment from "moment";

import LeftSide from "./leftSide";
import RightSide from "./rightSide";
import InventoriesSide from "../inventories/index";
import MyOrders from "../settings/myOrders/index";

import { useSubMenuData } from "contexts/SidebarContextManagment";

import FinishedProducts from "views/finished";
import Losses from "views/losses";

import "./index.scss";

function Stock() {
  const { selectedStockSubMenu } = useSubMenuData();

  const [clear, setClear] = useState(false);
  const [formData, setFormData] = useState({
    start_date: moment().format("YYYY-MM-DD"),
    end_date: moment().format("YYYY-MM-DD"),
    products: [],
  });

  const onApply = (params) => {
    setFormData({ ...params });
  };

  return (
    <>
      {selectedStockSubMenu === "Inventories" && <InventoriesSide formData={formData} />}
      {selectedStockSubMenu === "MyOrders" && <MyOrders />}
      {selectedStockSubMenu === "Finished" && <FinishedProducts formData={formData} />}
      {selectedStockSubMenu === "Losses" && <Losses formData={formData} />}
      {selectedStockSubMenu === "Stock" && <LeftSide formData={formData} clear={clear} />}
      {selectedStockSubMenu === "Stock" && <RightSide onApply={onApply} formData={formData} setClear={setClear} clear={clear} />}
    </>
  );
}

export default Stock;