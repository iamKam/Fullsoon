import React, { useState, useContext } from "react";

export const LoadingContext = React.createContext({
  setLoading: () => {},
  loading: false,
  error: "",
  setError: () => {},
  successMessage: "",
  setSuccessMessage: () => {},
});

export const LoadingContextProvider = (props) => {
  const setLoading = (loading) => {
    setState({ ...state, loading: loading });
  };

  const setError = (error) => {
    setState({ ...state, error: error });
  };

  const setSuccessMessage = (setSuccessMessage) => {
    setState({ ...state, successMessage: setSuccessMessage });
  };

  const initState = {
    loading: false,
    setLoading: setLoading,
    error: "",
    setError: setError,
    successMessage: "",
    setSuccessMessage: setSuccessMessage,
  };

  const [state, setState] = useState(initState);

  return (
    <LoadingContext.Provider value={state}>
      {props.children}
    </LoadingContext.Provider>
  );
};

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}
