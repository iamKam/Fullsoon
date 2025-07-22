import React, { useRef, useEffect } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Layout from "layouts";
import SignUp from "views/signup/index";
import SignIn from "views/signin/index";
import VerifyEmail from "views/verifyEmail/index";
import ForgetPassword from "views/forgetPassword/index";
import ResetPassword from "views/resetPassword/index";
import request from "services/request";
import { useLoading } from "contexts/LoadingContextManagement";
import SuggestedOrder from "views/stock/suggestedOrders";
import EditSuggestedOrders from "views/stock/editSuggestedOrders";
import ReviewDonation from "views/donation/ReviewDonation";
import CharityDonation from "views/donation/CharityDonation";
import DonationDetails from "views/donation/DonationDetails";
import OrderProvider from "views/stock/orderProvider";
import PricingCard from "views/pricingCard";
import Payment from "views/payment";
import AddUserRestaurants from "views/addUserRestaurant/index";

function Routes() {
  const routerRef = useRef();
  const { setLoading } = useLoading();

  useEffect(() => {
    request.setLoadingFunc(setLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (routerRef && routerRef.current) {
      request.setRouter(routerRef.current);
    }
  }, [routerRef]);

  return (
    <Router ref={routerRef}>
      <Switch>
        <Route exact path="/signup" component={SignUp} />
        <Route exact path="/signin" component={SignIn} />
        <Route exact path="/pricing" component={PricingCard} />
        <Route exact path="/card-element" component={Payment} />
        <Route exact path="/iban-element" component={Payment} />
        <Route exact path="/verify-email" component={VerifyEmail} />
        <Route exact path="/forgetpassword" component={ForgetPassword} />
        <Route exact path="/reset-password" component={ResetPassword} />
        <Route exact path="/add-user-restaurants" component={AddUserRestaurants} />
        <Route
          exact
          path="/stock/suggested-orders"
          component={SuggestedOrder}
        />
        <Route
          exact
          path="/stock/suggested-orders/details"
          component={EditSuggestedOrders}
        />
        <Route
          exact
          path="/stock/order-to-provider"
          component={OrderProvider}
        />

        <Route exact path="/donation/review" component={ReviewDonation} />
        <Route exact path="/donation/charity" component={CharityDonation} />
        <Route exact path="/donation/details" component={DonationDetails} />
        <Route path="/" component={Layout} />
      </Switch>
    </Router>
  );
}

export default Routes;
