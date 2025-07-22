import React, { useState } from 'react';
import { useHistory } from "react-router-dom";
import './price.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import storage from 'services/storage';
import { useUserData } from 'contexts/AuthContextManagement';
import SubscriptionModal from '../../views/settings/subscription/modal'
import Plan from "./plan";
import TermsModal from './modal';
function PricingCard({plans, t}) {
	const history = useHistory();
	const [showModal, setShowModal] = useState(false);
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [showConfirmationModal, setShowConfirmationModal] = useState(false)
	const [promoCode, setPromoCode] = useState("");
	const { subscription } = useUserData();
	const [selectedPlan, setSelectedPlan] = useState(plans.find(plan => plan.name == JSON.parse(storage.getItem("subscription"))?.plan));

	const submitHandler = (event) => {
		event.preventDefault();
		if(!selectedPlan) {
			toast.error("Please select a plan");
			return
		}
		if(!acceptTerms) {
			toast.error("Please accept the terms and conditions");
			return
		}
		storage.setItem("plan", selectedPlan.plan)
		if(promoCode) {
			storage.setItem("promo_code", promoCode)
		}else {
			storage.removeItem("promo_code")
		}
		history.push("/iban-element");
	}

	const planSelector = (selectedPlan) => {
		return // TODO : we have to remove this code later
		setSelectedPlan(selectedPlan)
	}

	const subscriptionHandler =async () => {
		setShowModal(true)
	}

	const showModalHandler = () => {
		setShowConfirmationModal((prev) => !prev);
	  };

	return (
	<div>
	{showModal && <SubscriptionModal plan={selectedPlan} show={showModal} isDelete={selectedPlan.name === JSON.parse(storage.getItem("subscription"))?.plan} onHide={() => setShowModal(false)} />}
	{showConfirmationModal && <TermsModal onHide={showModalHandler} show={showConfirmationModal}/>}
	<section className="pricing-section">
    <div className="container">
		{subscription?.status !== "active" && <div className="row justify-content-md-center pb-2">
			<div className="col-xl-6 col-lg-6 col-md-8">
				<div className="section-title text-center title-ex1">
					<h2>{t("ChooseYourPlan")}</h2>
				</div>
			</div>
		</div>}
		
		<form className="pricing_container row justify-content-md-center" onSubmit={submitHandler} >
			{plans.map((plan) => (
				<Plan key={plan?.plan_id} plan={plan} selectedPlan={selectedPlan} setPlan={planSelector} />
			))}

			{/* {subscription?.status !== "active" && <div className="row justify-content-md-center pb-2">
						<div className="col-xl-6 col-lg-6 col-md-8" style={{display: "flex", flexDirection: "column", alignItems: "center", marginTop: "16px"}}>
							<label style={{ fontSize: "20px", marginBottom: "5px"}} htmlFor="coupon">Promo code</label>
							<input onChange={(e) => setPromoCode(e.target.value)} id='coupon' type="text" className='inputField override' />
						</div>
					</div>
			} */}


			{subscription?.status === "active" && <a href="#/" onClick={subscriptionHandler} style={{width: "50%", marginTop: "50px"}} className="btn btn-primary btn-mid">{t(`${selectedPlan.name === JSON.parse(storage.getItem("subscription"))?.plan ? 'Cancel' : 'Update'} Subscription`)}</a>}

			<div style={{display: "flex", justifyContent: "space-around", alignItems: "center", margin: "auto", width: "100%", marginTop: "70px"}}>
			{subscription?.status !== "active" &&<div style={{ width: "auto", padding: "20px", display: "flex", justifyContent: "space-around", alignItems: "center"}}>
				<input type='checkbox' name='terms' onChange={() => setAcceptTerms(!acceptTerms)} checked={acceptTerms} style={{ marginRight: "10px", cursor: "pointer"}}/>
				 <span>I accept the <span onClick={() => setShowConfirmationModal(true)} style={{ textDecoration: "underline", fontWeight: "bold", cursor: "pointer"}}><em>terms and conditions.</em></span></span>
			</div>}
			{subscription?.status !== "active" && <Button disabled={!selectedPlan} type='submit' style={{display: "block", margin: "0px", height: "56px", fontSize: "16px", fontWeight: "700", width: "30%", borderRadius: "10px", cursor: "pointer"}} variant="primary signup-btn">
            {t("Next")}
          </Button>}
		  </div>
		</form>
	</div>
	</section>
	</div>
	);
}
export default PricingCard;