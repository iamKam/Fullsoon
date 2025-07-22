import React, { useState, useContext } from "react";

export const SubMenuContext = React.createContext({
  selectedStockSubMenu: "Stock",
  setSelectedStockSubMenu: () => {},
  selectedOccupancySubMenu: "Daily occupancy",
  setSelectedOccupancySubMenu: () => {},
  selectedLaboSubMenu: "Orders",
  setSelectedLaboSubMenu: () => {},
  selectedSettingsSubMenu: "Account",
  setSelectedSettingsSubMenu: () => {}
});

export const SubMenuContextProvider = ( props ) => {
  const updateStockMenu = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedStockSubMenu: value
    }));
  };

  const updateOccupancyMenu = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedOccupancySubMenu: value
    }));
  };

  const updateLabourMenu = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedLaboSubMenu: value
    }));
  };

  const updateSettingsMenu = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedSettingsSubMenu: value
    }));
  };

  const initState = {
    selectedStockSubMenu: "Stock",
    setSelectedStockSubMenu: updateStockMenu,
    selectedOccupancySubMenu: "Daily occupancy",
    setSelectedOccupancySubMenu: updateOccupancyMenu,
    selectedLaboSubMenu: "Orders",
    setSelectedLaboSubMenu: updateLabourMenu,
    selectedSettingsSubMenu: "Account",
    setSelectedSettingsSubMenu: updateSettingsMenu
  };
  
  const [state, setState] = useState(initState);

  return (
    <SubMenuContext.Provider value={state}>{props.children}</SubMenuContext.Provider>
  );
};

export function useSubMenuData() {
  const context = useContext(SubMenuContext);
  if (!context) {
    throw new Error("useSubMenuData must be used within SubMenuContextProvider");
  }
  return context;
}