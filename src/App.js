import React, { Suspense } from "react";
import Routes from "./routes";
import { Spinner } from "react-bootstrap";
import { AuthContextProvider } from "./contexts/AuthContextManagement";
import { useLoading } from "contexts/LoadingContextManagement";
import { FilterContextProvider } from "./contexts/FilterContextManagment";
import { SubMenuContextProvider } from "./contexts/SidebarContextManagment";

import {
  LoadingContextProvider,
  LoadingContext,
} from "./contexts/LoadingContextManagement";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/scss/bootstrap.scss";
import "./App.scss";
import "./assets/scss/index.scss";

function App() {
  const { setError, setSuccessMessage } = useLoading();

  const showError = (error) => {
    toast.error(error);
    setError("");
  };
  const showSuccessMessage = (successMessage) => {
    toast.success(successMessage);
    setSuccessMessage("");
  };
  return (
    <SubMenuContextProvider>
      <FilterContextProvider>
        <AuthContextProvider>
          <LoadingContextProvider>
            <LoadingContext.Consumer>
              {({ loading, error, successMessage }) => (
                <Suspense fallback="">
                  <div className="App">
                    <div className={loading ? "app-loader" : "app-loader-hide"}>
                      <Spinner animation="border" variant="primary" />
                    </div>
                    <div>
                      {error !== "" ? showError(error) : null}
                      {successMessage !== ""
                        ? showSuccessMessage(successMessage)
                        : null}
                      <ToastContainer
                        position="top-center"
                        autoClose={3000}
                        hideProgressBar={true}
                      />
                    </div>
                    <Routes />
                  </div>
                </Suspense>
              )}
            </LoadingContext.Consumer>
          </LoadingContextProvider>
        </AuthContextProvider>
      </FilterContextProvider>
    </SubMenuContextProvider>
  );
}

export default App;
