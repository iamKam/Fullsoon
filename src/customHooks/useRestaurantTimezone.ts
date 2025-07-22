import moment from "moment";
import { useUserData } from "contexts/AuthContextManagement";

const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

function useRestaurantTimezone() {
  const {
    selectedRestaurant,
  }: { selectedRestaurant: any; isRestaurantLoaded: any; hasRetaurants: any } =
    useUserData();

  const convertTimezone = (date: string) => {
    if (!selectedRestaurant) {
      return;
    }
    return moment(date).utc().format(DEFAULT_DATE_FORMAT);
  };

  return { convertTimezone };
}

export default useRestaurantTimezone;
