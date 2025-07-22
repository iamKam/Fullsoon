import './price.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTranslation } from "react-i18next";

const PLANS_FEATURES = [
    {
        "customers_predictions" : "Customer predictions",
    },
    {
        "ingredients_predictions": "Ingredients predictions"
    },
    {
        "meals_predictions": "Meals predictions"   
    },
    {
        "financial_analysis": "Financial analysis"
    },
    {
        "stock_management": "Stock management"
    },
    {
        "automatic_orders": "Automatic orders"
    },
    {
        "market_view": "Market views"
    }
]

function Plan({plan, selectedPlan ,setPlan}) {
    const {t} = useTranslation();

    const included_features = PLANS_FEATURES.map(feature => {
        const key = Object.keys(feature)[0];
        const included = plan?.features?.includes(key);
        return { [key]: feature[key], included };
    });
    // TODO : we have to remove this pop and split code 
    return (
			<div className="pricing_card h-100" onClick={() => setPlan(plan)}>
				<div className={"price-card h-100 featured " + (selectedPlan?.plan_id === plan?.plan_id ? "active-card" : "")}>
					<h2 className='card_heading'>{plan?.name?.split(" ")?.pop()}</h2> 
					<p className="price"><span className='price_value'>&euro;{plan?.amount}</span><span>HT</span>/ {plan?.interval === "monthly" ? t("Month") : t("Year")}</p>
					<div className='sperator'></div>
					<p className='price_subTitle'>{t("Price per establishment for")}:</p>
					<ul className="pricing-offers">
						{included_features.map((feature,i) => (<li key={i} className={!feature.included ? 'not_included' : ""}><span className='tick'>&#x2713;</span> {t(feature[Object.keys(feature)[0]])}</li>))}
						
					</ul>
				</div>
			</div>
	);
}
export default Plan;