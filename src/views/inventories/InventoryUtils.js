import drinks from '../../assets/images/inventories/drinks.svg';
import fruites from '../../assets/images/inventories/fruites.svg';
import meet from '../../assets/images/inventories/meet.svg';
import milkProducts from '../../assets/images/inventories/milkProducts.svg';
import others from '../../assets/images/inventories/others.svg';
import pasta from '../../assets/images/inventories/pasta.svg';
import frozen from '../../assets/images/inventories/frozen.svg';
import packaging from '../../assets/images/inventories/packaging.svg';

export const INGREDIENT_CATEGORIES = [
  { id: "frozen", value: ["frozen"], label: "Frozen", imagePath : frozen, color : "#3669E9"},
  { id: "meatFish", value: ["meatFish"], label: "Meet & Fish", imagePath : meet, color : "#535355" },
  { id: "fruitsAndVegetables", value: ["fruitsAndVegetables",], label: "Fruits & Vegetables" , imagePath : fruites, color : "#9EDF5D"},
  { id: "otherFreshProducts", value: ["otherFreshProducts"], label: "Other Fresh Products", imagePath : milkProducts, color : "#FFC700"},
  { id: "dryGroceries", value: ["dryGroceries"], label: "Grosseries" , imagePath : pasta, color :"#8232FF"},
  { id: "drinks", value: ["drinks"], label: "Drinks" , imagePath : drinks , color : "#DF5D5D"},
  { id: "packaging", value: ["packaging"], label: "Packaging", imagePath : packaging, color:"#8C5000"},
  { id: "others", value: ["others"], label: "Others", imagePath : others, color : "#FFC700"}
];