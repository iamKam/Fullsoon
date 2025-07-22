import React, { useState } from "react";
import { Redirect, useLocation } from "react-router-dom";

import storage from "services/storage";
import useWindowSize from "customHooks/useWindowResize";
import { MAX_COLLAPISBLE_SIDEBAR } from "common/constants";
import { useUserData } from "contexts/AuthContextManagement";
import SampleRestaurantModal from "components/sampleRestaurant";

import Sidebar from "./sidebar";
import Header from "./header";
import Dashboard from "./dashboard";

import Routes from "routes/router";

function Layouts() {
  const [width] = useWindowSize();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isToggle, setIsToggle] = useState(false);
  const [broken, setBroken] = useState(window.matchMedia('(max-width: 1440px)').matches);
  const { sampleRestaurantModal, setSampleRestaurantModal, id: userId, isLabo } = useUserData();
  const location = useLocation();
  const user = JSON.parse(storage.getItem("user"));

  const handleToggle = () => {
    setIsToggle(true)
    setIsCollapsed(false)
  }
  
  if (!storage.getItem("token")) {
    return <Redirect exact to="/signin" />;
  }

  if(user.is_plan_required && location.pathname === "/admin") {
    return <Redirect exact to="/forecast" />
  }

  if((user?.subscription?.status !== "active" && user?.subscription?.status !== "trialing") && user.is_plan_required && user?.email !== "demo.user@test.com") {
    return <Redirect exact to="/signin" />
  }

  if(user?.subscription?.plan === 'standard' && (location.pathname === "/market-view" || location.pathname === "/donation")) {
    return <Redirect exact to="/forecast" />
  }

  if(isLabo && (Routes.filter(route => (route.path !== "/labo" && route.path !== "/settings" && route.path !== "/stock")).map(item => item.path).includes(location.pathname))) {
    return <Redirect exact to="/labo" />
  }

  if(!isLabo && (Routes.filter(route => (route.path === "/labo")).map(item => item.path).includes(location.pathname))) {
    return <Redirect exact to="/forecast" />
  }


  const collapsedSidebar =
    width < MAX_COLLAPISBLE_SIDEBAR || isCollapsed || false;

  return (
    <div className="wrappers">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isToggle={isToggle} setIsToggle={setIsToggle} broken={broken} setBroken={setBroken} />
        <section
          className={`maincontent h-100 ${
          collapsedSidebar ? "maincontent-collapsed" : ""
        }`}
        >
          <SampleRestaurantModal
            show={sampleRestaurantModal}
            onHide={() => setSampleRestaurantModal(false)}
          />
          <Header handleToggle={() => handleToggle()} broken={broken} />
          <Dashboard />
        </section>
    </div>
  );
}

export default Layouts;
