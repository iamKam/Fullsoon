import { useState, useEffect } from "react";

import storage from "services/storage";
import { useUserData } from "contexts/AuthContextManagement";
import { customFetch } from "services/customFetch";

function useFetch(
  endpoint,
  payload = {},
  requiredRestaurantId = true,
  fd = [],
  requiredFields = []
) {
  const appEndpoint = process.env.REACT_APP_API_ENDPOINT;
  const { selectedRestaurantId, isRestaurantLoaded, hasRetaurants } =
    useUserData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuth = () => {
    let result = {};
    const authToken = storage.getItem("token");
    if (authToken) {
      result = { Authorization: `Bearer ${authToken}` };
    }
    return result;
  };

  const generateQuery = (params) => {
    const esc = encodeURIComponent;
    return Object.keys(params)
      .filter(
        (i) =>
          (Array.isArray(params[i]) && params[i].length) ||
          !Array.isArray(params[i])
      )
      .map((k, i) => {
        const ele = params[k];
        if (Array.isArray(ele)) {
          return ele.length === 1
            ? `${k}[]=${esc(ele as any)}`
            : ele.map((l) => `${k}=${esc(l)}`).join("&");
        }
        return `${esc(k)}=${esc(ele)}`;
      })
      .join("&");
  };

  const apiCall = async () => {
    try {
      setLoading(true);
      const query = generateQuery({
        ...payload,
        //restaurant_id: selectedRestaurantId,
      });
      const url = `${appEndpoint}/${endpoint}${query ? `?${query}` : ""}`;
      const result = await customFetch(`${url}`, {
        signalKey: `${endpoint}${Object.keys(payload).length}`,
        headers: { ...getAuth() },
      });
      if(result.status >= 500 && result.status < 512) {
        setLoading(false);
        setData(null)
        return;
      }
      if(result.ok) {
        setData(await result.json());
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requiredRestaurantId && !selectedRestaurantId) {
      return;
    }

    if (requiredFields.length) {
      let error: null | string = null;
      requiredFields.forEach((field) => {
        if (!payload[field]) {
          error = `${field} is required`;
          return;
        }
      });
      if (error) {
        return;
      }
    }

    apiCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, selectedRestaurantId, ...fd]);

  useEffect(() => {
    if (isRestaurantLoaded && !hasRetaurants) {
      setLoading(false);
    }
  }, [isRestaurantLoaded, hasRetaurants]);

  return { loading, data, apiCall };
}

export default useFetch;
