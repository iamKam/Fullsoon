import React, { useState, useContext } from "react";
import storage from "services/storage";

const getCurrentUser = () => {
  const user = JSON.parse(storage.getItem("user"));
  return {
    id: user?.id ?? null,
    username: user?.username ?? "",
    email: user?.email ?? "",
    currency: user?.currency ?? "",
  };
};

export const AuthContext = React.createContext({
  setUserData: () => {},
  id: "",
  username: "",
  email: "",
  selectedRestaurantId: "",
  setSelectedRestaurantId: () => {},
  restaurants: [],
  setRestaurants: () => {},
  isFilterShown: false,
  setFilterShown: () => {},
  isProviderIngredient: true,
  setProviderIngredient: () => {},
  setStocksLevelDown: () => {},
  selectedRestaurant: null,
  isRestaurantLoaded: false,
  hasRetaurants: false,
  setIsDemo: () => {},
  isDemo: false,
  setIsLabo: () => {},
  isLabo: false,
  stockEvolution: {},
  setStockEvolution: () => {},
  sampleRestaurantModal: false,
  setSampleRestaurantModal: () => {},
  currentUser: null,
  currency: "",
  setResetStock: () => {},
  resetStock: false,
  subscription: {}
});

export const AuthContextProvider = (props) => {
  const setUserData = ({ id, username, email, currency, subscription }) => {
    setState((prevState) => ({
      ...prevState,
      ...(id && { id }),
      username,
      email,
      currency,
      subscription
    }));
  };

  const setResetStock = (value) => {
    setState((prevState) => ({
      ...prevState,
      resetStock: value,
    }));
  };

  const setSubscription = (subscription) => {
    setState((prevState) => ({
      ...prevState,
      subscription
    }))
  }

  const setSelectedRestaurantId = (id) => {
    setState((prevState) => ({
      ...prevState,
      selectedRestaurantId: id,
      selectedRestaurant: prevState?.restaurants?.find((r) => r.id === id),
    }));
  };

  const setStockEvolution = (stocksData) => {
    setState((prevState) => ({
      ...prevState,
      stockEvolution: stocksData,
    }));
  };

  const setRestaurants = (restaurants, isRestaurantLoaded = true) => {
    setState((prevState) => ({
      ...prevState,
      restaurants,
      isRestaurantLoaded,
      hasRetaurants: Boolean(restaurants.length),
    }));
  };

  const setFilterShown = (isFilterShown) => {
    setState((prevState) => ({ ...prevState, isFilterShown }));
  };

  const setIsDemo = (isDemo = false) => {
    setState((prevState) => ({ ...prevState, isDemo }));
  };

  const setIsLabo = (isLabo = false) => {
    setState((prevState) => ({ ...prevState, isLabo }));
  };
  const setProviderIngredient = (isProviderIngredient) => {
    setState((prevState) => ({ ...prevState, isProviderIngredient }));
  }

  const setSampleRestaurantModal = (value) => {
    setState((prevState) => ({
      ...prevState,
      sampleRestaurantModal: value,
    }));
  };

  const initState = {
    id: "",
    username: "",
    email: "",
    setUserData,
    setSubscription,
    selectedRestaurantId: "",
    setSelectedRestaurantId,
    restaurants: [],
    setRestaurants,
    setStockEvolution,
    isFilterShown: false,
    setFilterShown,
    isProviderIngredient: true,
    setProviderIngredient,
    stockEvolution: {},
    selectedRestaurant: null,
    isRestaurantLoaded: false,
    hasRetaurants: false,
    setIsDemo,
    isDemo: false,
    setIsLabo,
    isLabo: false,
    isStocksLevelDown: false,
    sampleRestaurantModal: false,
    subscription: {},
    setSampleRestaurantModal,
    ...getCurrentUser(),
    resetStock: false,
    setResetStock
  };

  const [state, setState] = useState(initState);

  return (
    <AuthContext.Provider value={state}>{props.children}</AuthContext.Provider>
  );
};

export function useUserData() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useUserData must be used within AuthContextProvider");
  }
  return context;
}
