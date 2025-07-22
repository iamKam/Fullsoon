import React, { useMemo, useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useHistory } from "react-router-dom";
import request from "services/request";
import { useUserData } from "contexts/AuthContextManagement";
import storage from "services/storage";
import { toast } from "react-toastify";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";


const useOptions = () => {
  const options = useMemo(
    () => ({
      style: {
        base: {
          color: "#424770",
          letterSpacing: "0.025em",
          fontFamily: "Source Code Pro, monospace",
          "::placeholder": {
            color: "#aab7c4",
          }
        },
        invalid: {
          color: "#9e2146"
        }
      }
    }),
  );

  return options;
};

const CardForm = () => {
  const { t, i18n  } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();
  const { setSubscription } = useUserData();
  const [error, setError] = useState(null)
  const history = useHistory()
  const handleSubmit = async event => {
    try {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const paymentMethod = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement)
    });

    const { id } = paymentMethod.paymentMethod;
    const subscription = JSON.parse(storage.getItem("subscription"))
    
      const payload = {
        plan: subscription.plan,
        type: subscription.type,
        payment_method: id,
        promo_code: storage.getItem("promo_code") || null,
        language: i18n.language
      }
      const response = await request.post("/subscription", payload);
      const res = await response.json();
      if(!response.ok || response.status === 400) {
        setError(t(res.msg))
        setTimeout(() => {
          setError(null)
        },10000)
        return
      }

      if(!res.client_secret) {
        toast.info(`Your subscription is under Processing`)
        setTimeout(() => {
          history.push("/signin")
          window.location.reload()
        },3000)
        return
      } 

      const {error, paymentIntent} = await stripe.confirmPayment({
        clientSecret: res.client_secret,
        confirmParams: {
          return_url: process.env.REACT_APP_STRIPE_SUCCESS_REDIRECTION_URL,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error(error.message)
        setTimeout(() => {
          history.push("/signin")
          window.location.reload()
        },3000)
        return
      }

      if(res?.status === 'active' && paymentIntent?.status === 'succeeded') {
        setSubscription({status: res.status});
        storage.setItem("subscription",  JSON.stringify({status: res.status, plan: res?.plan}))
        history.push("/signin");
        window.location.reload()
      }else if(res?.status === 'incomplete') {
        // if the initial payment attempt fails
        toast.info(`Your subscription is under Processing`)
        setTimeout(() => {
        history.push("/signin")
        window.location.reload()
        },3000)
      }else if (res?.status === 'incomplete_expired') {
        // If the first invoice is not paid within 23 hours
        toast.info(`Your subscription is under Processing`)
        setTimeout(() => {
        history.push("/signin")
        window.location.reload()
        },3000)
      }else if(res?.status === 'past_due') {
        // when payment is required but cannot be paid (due to failed payment or awaiting additional user actions)
        toast.info(`Your subscription is under Processing`)
        setTimeout(() => {
        history.push("/signin")
        window.location.reload()
        },3000)
      }else if(res?.status === 'canceled' || res?.status === 'unpaid') {
        // when payment is required but cannot be paid (due to failed payment or awaiting additional user actions)
        toast.info(`Your subscription is Canceled, Please try to pay again`)
        setTimeout(() => {
        history.push("/signin")
        window.location.reload()
        },3000)
      }else if(paymentIntent?.status === 'requires_payment_method') {
        // when payment is required but cannot be paid (due to failed payment or awaiting additional user actions)
        toast.error(`Payment failed. Please try another payment method.`)
        setTimeout(() => {
        history.push("/signin")
        window.location.reload()
        },3000)
      }else {
        toast.info(`Your subscription is under Processing`)
        history.push("/signin")
        window.location.reload()
      }
    }catch(err) {
        console.log({err})
        setError("Payment failed, Please try again later");
        setTimeout(() => {
          setError(null);
        },5000)
    }
  };

  return (
    <form style={{width: "500px", display: "flex", flexDirection: "column", alignItems: "space-between"}} onSubmit={handleSubmit}>
      <label>
        {t("Card details")}
        <CardElement
          options={options}
          onReady={() => {
            console.log("CardElement [ready]");
          }}
          onChange={event => {
            console.log("CardElement [change]", event);
          }}
          onBlur={() => {
            console.log("CardElement [blur]");
          }}
          onFocus={() => {
            console.log("CardElement [focus]");
          }}
        />
      </label>
      <Button disabled={!stripe} type='submit' style={{display: "block", margin: "50px auto", height: "56px", fontSize: "16px", fontWeight: "700", margin: "auto", width: "100%", borderRadius: "10px", cursor: "pointer"}} variant="primary signup-btn">
            {t("RegisterPaymentMethod")}
      </Button>
      {error && <p style={{color: "red", textAlign: "center", paddingTop: "20px"}}>{error}</p>}
    </form>
  );
};

export default CardForm;
