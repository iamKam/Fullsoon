// subMenu.js
export const getSubMenu = (hasRetaurants) => {
    const subMenu = {
      Stock: ["Stock", "Inventories", "MyOrders"],
      Occupancy: ["Daily occupancy", "Yearly occupancy"],
      Labo: ["Orders", "Production Planning", "Sales Forecast", "Analytics"],
      // Settings: ["Account", "UserManagement", "MyRestaurants", "MyProviders", "Ingredients", "MyMeals", "GroupRestaurants", "Events"]
      Settings: ["Account", "Schedule", "MyRestaurants", "MyProviders", "Ingredients", "MyMeals", "GroupRestaurants", "Events"]
    };

    return subMenu;
  };
  
