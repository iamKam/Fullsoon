import moment from "moment";

import Forecast from "../views/forecast";
import Meals from "../views/meals";
import Occupancy from "../views/occupancy";
import Service from "../views/service";
import Finance from "../views/finance";
import Stock from "../views/stock";
import Admin from "../views/admin";
import MarketView from "../views/marketView";
import SettingsView from "../views/settings";
import Donation from "../views/donation";
import Labo from "../views/labo/index";
import Inventories from "../views/inventories";

import { ReactComponent as DashboardSvg } from "../assets/images/icon/DASHBOARD.svg";
import { ReactComponent as MealsSvg } from "../assets/images/icon/MEALS.svg";
import { ReactComponent as OccupancySvg } from "../assets/images/icon/OCCUPANCY.svg";
import { ReactComponent as ServiceSvg } from "../assets/images/icon/SERVICE.svg";
import { ReactComponent as StockSvg } from "../assets/images/icon/STOCK.svg";
import { ReactComponent as FinanceSvg } from "../assets/images/icon/FINANCE.svg";
import { ReactComponent as CompetitorsSvg } from "../assets/images/icon/COMPETITORS.svg";
import { ReactComponent as DonationsSvg } from "../assets/images/icon/DONATIONS.svg";
import { ReactComponent as AdminSvg } from "../assets/images/icon/admin.svg";
import { ReactComponent as SettingsSvg } from "../assets/images/icon/SETTINGS.svg";
import { ReactComponent as LaboSvg } from "../assets/images/icon/LABO.svg";
import { ReactComponent as InventoriesSvg } from "../assets/images/icon/INVENTORY.svg";

const Routes = [
  {
    path: "/forecast",
    exact: true,
    name: "Forecast",
    component: Forecast,
    heading: "Forecast",
    subHeading: "",
    icon: <DashboardSvg />,
    filterIcon: false,
  },
  {
    path: "/meals",
    exact: true,
    name: "Meals",
    component: Meals,
    heading: "Meals",
    subHeading: "Analyse your meals forecast based on a chosen date and time.",
    icon: <MealsSvg />,
    filterIcon: true,
  },
  {
    path: "/occupancy",
    exact: true,
    name: "Occupancy",
    component: Occupancy,
    heading: "Occupancy",
    subHeading:
      "Analyse your occupancy forecast based on a chosen date and time.",
    icon: <OccupancySvg />,
    filterIcon: true,
  },
  // {
  //   path: "/service",
  //   exact: true,
  //   name: "Service",
  //   component: Service,
  //   heading: "Service",
  //   subHeading: "Analyse your meals forecast based on a chosen date and time.",
  //   icon: <ServiceSvg />,
  //   filterIcon: true,
  // },
  {
    path: "/labo",
    exact: true,
    name: "Labo",
    component: () => <Labo />,
    heading: "Labo",
    icon: <LaboSvg />,
    filterIcon: false,
  },
  {
    path: "/stock",
    exact: true,
    name: "Stock",
    component: Stock,
    heading: "Stock",
    subHeading: "Analyse your stocks and select products to order.",
    icon: <StockSvg />,
    filterIcon: true,
  },
  // {
  //   path: "/ereputation",
  //   exact: true,
  //   name: "eReputation",
  //   component: Ereputation,
  //   heading: "EReputation",
  //   subHeading:
  //     "Analyse your occupancy forecast based on a chosen date and time.",
  //   icon: <LikeSvg />,
  //   filterIcon: false,
  // },
  {
    path: "/finance",
    exact: true,
    name: "Finance",
    component: Finance,
    heading: "Finance",
    subHeading: "Analyse your meals forecast based on a chosen date and time.",
    icon: <FinanceSvg />,
    filterIcon: true,
  },
  {
    path: "/market-view",
    exact: true,
    name: "Market view",
    component: MarketView,
    heading: "Market view",
    subHeading:
      "Analyse your occupancy forecast based on a chosen date and time.",
    icon: <CompetitorsSvg />,
    filterIcon: true,
  },
  {
    path: "/donation",
    exact: true,
    name: "Donation",
    component: () => <Donation />,
    heading: "Donation",
    subHeading:
      "Analyse your occupancy forecast based on a chosen date and time.",
    icon: <DonationsSvg />,
    filterIcon: false,
  },
  // {
  //   path: "/inventories",
  //   exact: true,
  //   name: "Inventories",
  //   component: () => <Inventories />,
  //   heading: "Inventories",
  //   icon: <InventoriesSvg />,
  //   filterIcon: false,
  // },
  {
    path: "/admin",
    exact: true,
    name: "Admin",
    component: Admin,
    heading: "AdminDashboard",
    subHeading:
      "Manage restaurant registration here",
    icon: <AdminSvg />,
    filterIcon: false,
  },
  {
    path: "/settings",
    exact: true,
    name: "Settings",
    component: SettingsView,
    heading: "Settings",
    subHeading: " ",
    icon: <SettingsSvg />,
    filterIcon: false,
  },
];

export default Routes;
