import React from "react";
import { Route, Switch, useLocation, Redirect } from "react-router-dom";

import { useUserData } from "contexts/AuthContextManagement";
import { useSubMenuData } from "contexts/SidebarContextManagment";

import Routes from "../routes/router";
import storage from "services/storage";


function Dashboard() {
  const { id: userId } = useUserData();
  const location = useLocation();
  const user = JSON.parse(storage.getItem("user"));
  const { selectedStockSubMenu  } = useSubMenuData();

  const getCurrentRoute = () =>
    Routes.find((r) => r.path === location.pathname);

  const currentRoute = getCurrentRoute();

  return (
    <section
      className={`dashboard ${
        currentRoute?.name === "Stock" && selectedStockSubMenu === "Inventories"
          ? "inventories" : currentRoute?.name === "Stock" && selectedStockSubMenu === "Finished" ? "inventories"
          : (currentRoute?.name?.replace(" ", "-") ?? "").toLowerCase()
      }-container`}
    >
      <Switch>
        {Routes.map((prop, key) => {
          return (
             <Route
              exact={prop.exact}
              title={prop.name}
              path={prop.path}
              component={prop.component}
              key={key}
            /> 
          );
        })}
        <Route exact path="/">
          {
            (userId === '45eedd99-ef55-4086-92b4-885fe101aaa2') ?
            <Redirect to="/meals" /> :
            <Redirect to="/forecast" />
          }
        </Route>
      </Switch>
    </section>
  );
}

export default Dashboard;
