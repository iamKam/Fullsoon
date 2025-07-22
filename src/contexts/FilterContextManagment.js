import React, { useState, useContext } from "react";

export const FiterContext = React.createContext({
  selectedFilterMeals : [],
  setSelectedFilterMeals : () => {},
  selectedFinanceFilterMeals : [],
  setSelectedFinanceFilterMeals : () => {},
  selectedCompetitorList : [],
  setSelectedCompetitorList : () => {},
  selectedFilterProucts : [],
  setSelectedFilterProducts : () => {},
  selectedFilterMyRestaurants : [],
  setSelectedFilterMyRestaurants : () => {},
  filterStartEndDate: { },
  setFilterStartEndDate: () => {}, 
  filterFormData: {},
  setFilterFormData: () => {},
  eventTypeData: {},
  setEventTypeData: () => {},
  selectedIngredients: [],
  setSelectedIngredients: () => {},
  selectedProviders: [],
  setSelectedProviders: () => {},
  selectedCategories: {},
  setSelectedCategories: () => {},
  selectedProviderIngredients: () => {},
  setSelectedProviderIngredients: () => {},
  isFilterActive: false,
  updateFilterButton: () => {},
  totalActualRevenueData: 0,
  updatedTotalActualRevenue: () => {},
  selectedInventoryCategories: {},
  setSelectedInventoryCategories: () => {},
  showCategoriesList: true,
  setShowCategoriesList: () => {},
  showProvidersList: true,
  setShowProvidersList: () => {},
});

export const FilterContextProvider = (props) => {
  const updateSelectedOption = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedFilterMeals : value
    }));
  };

  const updateFinanceSelectedOption = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedFinanceFilterMeals : value
    }));
  }

  const updateSelectedCompetitor = (value) => {
    setState((prevState) => ({ 
      ...prevState,
      selectedCompetitorList : value
    }));
  }

  const updateSelectedProducts = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedFilterProucts : value
    }));
  }
  
  const updateSelectedMyRestaurants = (value) => {  
    setState((prevState) => ({
      ...prevState,
      selectedFilterMyRestaurants : value
    }));
  };

  const updateStartEndDate = (value) => {  
    setState((prevState) => ({
      ...prevState,
      filterStartEndDate : value
    }));
  };

  const updateFormData = (data) => {
      setState((prevState) => ({
        ...prevState,
        filterFormData : data
      }));
  };

  const updateEventData = (data) => {
    setState((prevState) => ({
      ...prevState,
      eventTypeData : data
    }));
  };

  const updateSelectedIngredients = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedIngredients : value
    }));
  }

  const updateSelectedProviders = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedProviders : value
    }));
  }

  const updateSelectedCategories = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedCategories : value
    }));
  }

  const updateSelectedProviderIngredients = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedProviderIngredients : value
    }));
  }

  const updateFilterButton = (isFilterActive = true) => {
    setState((prevState) => ({
      ...prevState,
      isFilterActive : isFilterActive
    }));
  };

  const updatedTotalActualRevenue = (value) => {
    setState((prevState) => ({
      ...prevState,
      totalActualRevenueData : value
    }));
  };

  const updateInventorySelectedCategories = (value) => {
    setState((prevState) => ({
      ...prevState,
      selectedInventoryCategories : value
    }));
  }

  const updatedSetShowCategoriesList = (value) => {
    setState((prevState) => ({
      ...prevState,
      showCategoriesList : value
    }));
  }

  const updatedSetShowProvidersList = (value) => {
    setState((prevState) => ({
      ...prevState,
      showProvidersList : value
    }));
  }

  const initState = {
    selectedFilterMeals : [],
    setSelectedFilterMeals : updateSelectedOption,
    selectedFinanceFilterMeals : [],
    setSelectedFinanceFilterMeals : updateFinanceSelectedOption,
    selectedCompetitorList : [],
    setSelectedCompetitorList : updateSelectedCompetitor,
    selectedFilterProucts : [],
    setSelectedFilterProducts : updateSelectedProducts,
    selectedFilterMyRestaurants : [],
    setSelectedFilterMyRestaurants : updateSelectedMyRestaurants,
    filterStartEndDate : {
      start_date: "",
      end_date: "",
    },
    setFilterStartEndDate: updateStartEndDate,
    filterFormData: { total: true },
    setFilterFormData: updateFormData,
    eventTypeData: {},
    setEventTypeData: updateEventData,
    selectedIngredients: [],
    setSelectedIngredients: updateSelectedIngredients,
    selectedProviders: [],
    setSelectedProviders: updateSelectedProviders,
    selectedCategories: {},
    setSelectedCategories: updateSelectedCategories,
    selectedProviderIngredients: [],
    setSelectedProviderIngredients: updateSelectedProviderIngredients,
    isFilterActive: false,
    updateFilterButton,
    totalActualRevenueData: 0,
    updatedTotalActualRevenue,
    selectedInventoryCategories: {},
    updateInventorySelectedCategories,
    showCategoriesList: true,
    setShowCategoriesList: updatedSetShowCategoriesList,
    showProvidersList: true,
    setShowProvidersList: updatedSetShowProvidersList
  };

  const [state, setState] = useState(initState);
    return (
    <FiterContext.Provider value={state}>{props.children}</FiterContext.Provider>
  );
};

export function useFilterData() {
  const context = useContext(FiterContext);
  if (!context) {
    throw new Error("useFilterData must be used within FilterContext");
  }
  return context;
}
