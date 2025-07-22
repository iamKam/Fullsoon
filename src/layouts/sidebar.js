import { useState, useRef, useEffect } from "react";

import { NavLink, useLocation, useHistory } from "react-router-dom";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { useTranslation } from "react-i18next";

import Routes from "routes/router";
import useWindowSize from "customHooks/useWindowResize";
import storage from "services/storage";
import { MAX_COLLAPISBLE_SIDEBAR } from "common/constants";
import { useUserData } from "contexts/AuthContextManagement";
import { useFilterData } from "contexts/FilterContextManagment";

// import Logo from "assets/images/cible_l.png";
// import FullSoonLogo from "assets/images/Fullsoon.png";
import Logo from "assets/images/logo.svg";
import FullSoonLogo from "assets/images/fullsoon_logo_1.svg";
import CloseSidebarIcon from "assets/images/icon/CLOSED_SIDEBAR.svg";
import { ReactComponent as LogoutSvg } from "assets/images/icon/LOGOUT.svg";
import { getSubMenu } from "./subMenu";
import { useSubMenuData } from "contexts/SidebarContextManagment";

import "./sidebar.scss";

export const routes_mapping = {
  "customers_predictions": "occupancy",
  "ingredients_predictions": "stock",
  "meals_predictions": "meals",
  "stock_management": "stock",
  "automatic_orders": "stock",
  "financial_analysis": "finance",
  "market_view": "market view",
  "meals_predictions": "forecast",
}

function SidebarComp({ isCollapsed, setIsCollapsed, isToggle, setIsToggle, broken, setBroken }) {
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  // Array of refs of each menu item
  const menuRefs = useRef([]); 
  const location = useLocation();
  const history = useHistory();
  const [width] = useWindowSize();
  const { t } = useTranslation();
  const { selectedStockSubMenu, setSelectedStockSubMenu, selectedOccupancySubMenu, setSelectedOccupancySubMenu, selectedLaboSubMenu, setSelectedLaboSubMenu, selectedSettingsSubMenu, setSelectedSettingsSubMenu } = useSubMenuData();
  const { id: userId, 
    setRestaurants,
    setSelectedRestaurantId,
    hasRetaurants,
    selectedRestaurantId,
    setIsLabo,
   } = useUserData();
  const {
    setSelectedFilterMeals,
    setSelectedFinanceFilterMeals,
    setSelectedFilterMyRestaurants,
    setSelectedFilterProducts,
    setFilterStartEndDate,
    setFilterFormData,
    setSelectedCompetitorList,
    setEventTypeData
  } = useFilterData();
  let [routes, setRoutes] = useState(Routes);
  const [activeIndex1, setActiveIndex1] = useState(0);
  const [isHovering, setIsHovering] = useState(false); 
  const [expandedSubmenus, setExpandedSubmenus] = useState({}); // Track which submenus are expanded
  const user = JSON.parse(storage.getItem("user"));
  let isLabo = storage.getItem('is_labo');
  isLabo = !!isLabo ? JSON.parse(isLabo) : undefined
  let SubMenu = getSubMenu(hasRetaurants);
  SubMenu = isLabo ? {...SubMenu, Stock: [...SubMenu.Stock, "Finished"]} : SubMenu
  if(isLabo) SubMenu.Settings.splice(2, 0, "MyLabos"); 

  const [activeSubmenu, setActiveSubmenu] = useState(() => {
    // Set initial value based on route (Stock or Occupancy)
    if (location.pathname.startsWith("/stock")) {
      return selectedStockSubMenu;
    } else if (location.pathname.startsWith("/occupancy")) {
      return selectedOccupancySubMenu;
    } else if (location.pathname.startsWith("/labo")) {
      return selectedLaboSubMenu;
    } else if (location.pathname.startsWith("/settings")) {
      return selectedSettingsSubMenu;
    }
    return null; 
  });
  

  /* hide routes manually/temporarily for clients of some restaurants 
    as currently we don't have roles/permissions implemented */

    useEffect(() => {
      if(isLabo === true) {
        setRoutes(routes.filter(r => r.name === 'Labo' || r.name === 'Stock' || r.name === 'Settings'))
      }else if (isLabo === false || user.email === 'demo.user@test.com' || user.email === 'hchaudhary@fullsoon.co') {
        setRoutes(Routes)
      }else {
        setRoutes([])
      }
      
      // return () => {
      //   setRoutes(Routes)
      // }
    }, [isLabo, selectedRestaurantId])

    // hdie settings for these accounts
    const NOT_ACCESS_TO_SETTINGS_RESTAURANTS = ['montparnasse.direction@parisbaguette.fr', 'chatelet.direction@parisbaguette.fr', 'patisserie@parisbaguette.fr', 'boulangerie@parisbaguette.fr', 'y.perraux@parisbaguette.fr', 'snacking@parisbaguette.fr', 'saintmichel@parisbaguette.fr', 'marechaljuin@parisbaguette.fr', 'corolles@parisbaguette.fr', 'boieldieu@parisbaguette.fr', 'saintmichel.direction@parisbaguette.fr', 'marechaljuin.direction@parisbaguette.fr', 'corolles.direction@parisbaguette.fr', 'boieldieu.direction@parisbaguette.fr']
    if(NOT_ACCESS_TO_SETTINGS_RESTAURANTS.includes(user.email)) {
      routes = routes.filter(r => r.name !== 'Settings')
    }

    if(user?.subscription?.plan === 'standard' && user?.subscription?.features) {
        const basic = user.subscription.features.map(f => routes_mapping[f])
        routes = Routes.filter(route => {
        if (basic.includes(route.name.toLowerCase()) || route.name === 'Settings') {
          return true
        } else {
          return false
        }
      })
    }
  if (userId === '45eedd99-ef55-4086-92b4-885fe101aaa2') { // koox soho
    routes = routes.filter(r => (
        r.name !== 'Forecast' && r.name !== 'Occupancy' && 
        r.name !== 'Service' && r.name !== 'eReputation' && 
        r.name !== 'Market view' && r.name !== 'Donation'
      )
    );
  } else if (userId === '362d2961-f07b-47cf-b5d9-50ad3bcbd9e0') { // dumbo petites-ecuries
    routes = routes.filter(r => (
        r.name !== 'Service' && r.name !== 'eReputation' && 
        r.name !== 'Market view' && r.name !== 'Donation'
      )
    );
  } else if (userId === 'c1c08029-2d95-43a1-a2cb-0515ad8c8e8b') { // crêpe touch
    routes = routes.filter(r => (
        r.name !== 'Service' && r.name !== 'Stock' && 
        r.name !== 'eReputation' && r.name !== 'Market view' && 
        r.name !== 'Donation'
      )
    );
  } else if (user.is_plan_required) { // admin tab removed for other users
    routes = routes.filter(r => (
        r.name !== 'Admin'
      )
    );
  }

  if (!isLabo) { // labo tab removed for other users
    routes = routes.filter(r => (
        r.name !== 'Labo'
      )
    );
  }
  // // Filter out the labo route if there are no Restaurants
  // if (hasRetaurants) {
  //   routes = routes.filter(route => route.path !== "/labo");
  // }  

  useEffect(() => {
    setTimeout(() => {
      const resizeEvent = window.document.createEvent("UIEvents");
      resizeEvent.initUIEvent("resize", true, false, window, 0);
      window.dispatchEvent(resizeEvent);
    }, 50);
  }, [isCollapsed]);

  const activeRoute = (routeName) =>
    location.pathname?.indexOf(routeName) > -1 ? "selected" : "";

  const onCollapsedSidebar = () => {
    setIsCollapsed(() => !isCollapsed);
  };

  const handleMouseEnter = (index) => {
    if (activeIndex1 === index) { // Only expand on hover for selected tabs
      const rect = menuRefs.current[index].getBoundingClientRect();
      setSubmenuPosition({ top: rect.top, left: rect.right + 10 });
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleSubMenuEnter = () => {
    setIsHovering(true); 
  };
  
  const handleSubMenuLeave = () => {
    setIsHovering(false); 
  };
  
  const collapsedSidebar =
    width < MAX_COLLAPISBLE_SIDEBAR || isCollapsed || false;

  const onLogoClick = () => {
    if (isLabo) {
      history.push("/labo");
    } else {
      history.push("/");
    }
  };

  const onLogout = (e) => {
    e.preventDefault();
    storage.clear();
    setRestaurants([], false);
    setSelectedRestaurantId("");
    setSelectedFilterMeals([]);
    setSelectedFinanceFilterMeals([]);
    setSelectedFilterMyRestaurants([]);
    setSelectedFilterProducts([]);
    setFilterStartEndDate({
      start_date: "",
      end_date: "",
    });
    setFilterFormData({ total: true });
    setIsLabo(false);
    setSelectedCompetitorList([]);
    setEventTypeData([]);
    history.push("/signin");
  };

  const handleBreakPoint = (isBreak) => {
    setIsToggle(false);
    setBroken(isBreak);
  }

  useEffect(() => {
    // Update activeSubmenu when the route changes
    if (location.pathname.startsWith("/stock")) {
      setActiveSubmenu(selectedStockSubMenu); // Update for Stock route
    } else if (location.pathname.startsWith("/occupancy")) {
      setActiveSubmenu(selectedOccupancySubMenu); // Update for Occupancy route
    } else if (location.pathname.startsWith("/labo")) {
      setActiveSubmenu(selectedLaboSubMenu);
    } else if (location.pathname.startsWith("/settings")) {
      setActiveSubmenu(selectedSettingsSubMenu);
    } else {
      setActiveSubmenu(null); // Reset if the route doesn't match
    }
  }, [location.pathname, selectedStockSubMenu, selectedOccupancySubMenu, selectedLaboSubMenu]);
  
  const handleClick = (index, e) => {
    e.preventDefault();
    setActiveIndex1(index);
    const rect = menuRefs.current[index].getBoundingClientRect();
    setSubmenuPosition({ top: rect.top, left: rect.right + 10 });
    setIsHovering(true);
  
    // Toggle the expanded state for the clicked submenu
    const routeName = routes[index].name;
    setExpandedSubmenus((prev) => ({
      ...prev,
      [routeName]: !prev[routeName], // Toggle the submenu for the clicked item
    }));
  };

  const handleSubMenuClick = (submenuItem) => {
    // Check the current route and set the appropriate submenu state
    if (location.pathname.startsWith("/stock")) {
      setSelectedStockSubMenu(submenuItem); // Update the selected submenu for Stock
    } else if (location.pathname.startsWith("/occupancy")) {
      setSelectedOccupancySubMenu(submenuItem); // Update the selected submenu for Occupancy
    } else if (location.pathname.startsWith("/labo")) {
      setSelectedLaboSubMenu(submenuItem); // Update the selected submenu for Labo
    } else if (location.pathname.startsWith("/settings")) {
      setSelectedSettingsSubMenu(submenuItem);
    }
    setActiveSubmenu(submenuItem);

    // Close sidebar if the screen width is 800px or less
    if (window.innerWidth <= 800) {
      onCollapsedSidebar();
      setIsHovering(false)
      setIsToggle(false)
    }
  };

  const activeIndex = routes.findIndex(({ path }) => activeRoute(path) === 'selected');
  return (
    <>
      {!broken && (
        <img
          src={CloseSidebarIcon}
          alt=""
          className={`toggleIcon ${isCollapsed ? "collapsed" : ""}`}
          onClick={onCollapsedSidebar}
        />
      )}
      <Sidebar
        onBackdropClick={() => setIsToggle(false)}
        customBreakPoint="800px"
        onBreakPoint={handleBreakPoint}
        collapsed={isCollapsed}
        toggled={isToggle}
        backgroundColor={'white'}
        collapsedWidth="103px"
        style={{ height: '100vh' }}
        className={!isCollapsed ? "collapsedOpen" : "collapsedClose"}
      >
        <Menu>
          <aside className="leftmenu">
            <div className={`logomain cursor-pointer ${isCollapsed ? "isCollapsed" : ""}`} onClick={onLogoClick}>
              {isCollapsed && <img src={Logo} className="img-fluid mx-3 " alt="" style={{width: "30px", height: "30px"}}/>}
              {!isCollapsed && <img src={FullSoonLogo} className="img-fluid hidesm" alt="" />}
            </div>
            <ul
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
              style={{
                display: isToggle ? 'block' : 'flex',
              }}
            >
              {routes.map(({ path, name, icon: Icon, keyName }, key) => {
                const hasSubmenu = SubMenu[name]; // Check if the current route has a submenu
                const isActive = key === activeIndex && hasSubmenu; // Apply active class only if submenu exists

                return (
                  <MenuItem key={key} 
                    style={{
                      height: '45px'
                    }}
                    onClick={(e) => handleClick(key,e)}
                    onMouseEnter={() => handleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                    ref={(el) => (menuRefs.current[key] = el)}
                    className={`${isCollapsed ? 'isCollapsed' : ''} ${
                      isActive ? 'active' : ''
                    } ${isActive && isHovering ? 'hover' : ''}`} 
                  >
                    <NavLink
                      to={path}
                      className={`sidebar-link ${activeRoute(
                        path
                      )} mb-0 ${hasSubmenu ? 'has-submenu' : 'no-submenu'}`}
                      activeClassName="active"
                    >
                      <span className="menu-icon">{Icon}</span>
                      <span className="menu-txt">{t(name)}</span>
                    </NavLink>
                  </MenuItem>
              )})}

              <MenuItem className={`logoutMenuItem ${isCollapsed ? "isCollapsed" : ""}`}
                style={{
                  paddingLeft: '0px',
                  paddingRight: '0px',
                  height: '45px'
                }}>
                <NavLink to="/logout" className={`sidebar-link  mb-0 logoutbtn`} onClick={onLogout}>
                  <span className="menu-icon">
                    <LogoutSvg />
                  </span>
                  <span className="menu-txt">{t("LogOut")} </span>
                </NavLink>
              </MenuItem>
            </ul>
          </aside>
        </Menu>
      </Sidebar>

       {/* Show submenu only if hovering over an item */}
       {isHovering && activeIndex1 !== null && SubMenu[routes[activeIndex1]?.name] && (
        <div 
          className="hover-submenu"
          onMouseEnter={handleSubMenuEnter}
          onMouseLeave={handleSubMenuLeave}
          style={{
            backgroundColor: '#6353ea',
            color: 'white',
            minWidth: '150px',
            transition: 'all 0.3s ease'
          }}
        >
          <div
            className="mobile-sidebar"
            style={{
              position: 'absolute',
              top: !location.pathname.startsWith("/settings") &&submenuPosition.top,
              bottom: location.pathname.startsWith("/settings") && "0px",
              padding: '10px'
            }}
          >
            {/* Check if the active route has a matching submenu */}
            {SubMenu[routes[activeIndex1].name]?.map((submenuItem, index) => (
              <p
                key={index}
                onClick={() => handleSubMenuClick(submenuItem)}
                className={`submenu-item ${activeSubmenu === submenuItem ? 'active' : ''}`}
                style={{
                  cursor: 'pointer',
                  marginBottom: '3px'
                }}
              >
               {t(submenuItem)}
            </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default SidebarComp;