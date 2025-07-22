import { customFetch } from "./customFetch";
import storage from "./storage";

class Request {
  appEndpoint;
  appCode;
  router;
  setLoading;

  constructor() {
    this.appEndpoint = process.env.REACT_APP_API_ENDPOINT;
  }

  setRouter(router) {
    this.router = router;
  }

  setLoadingFunc(setLoading) {
    this.setLoading = setLoading;
  }

  setLoader(state) {
    if (this.setLoading) {
      this.setLoading(state);
    }
  }

  getAuth() {
    let result = {};
    const authToken = storage.getItem("token");
    if (authToken) {
      result = { Authorization: `Bearer ${authToken}` };
    }
    return result;
  }

  generateQuery(params) {
    const esc = encodeURIComponent;

    return Object.keys(params)
      .filter(
        (i) =>
          (Array.isArray(params[i]) && params[i].length) ||
          !Array.isArray(params[i])
      )
      .map((k) => {
        const ele = params[k];
        if (Array.isArray(ele)) {
          return ele.length === 1
            ? `${k}[]=${esc(ele)}`
            : ele.map((l) => `${k}=${esc(l)}`).join("&");
        }
        return `${esc(k)}=${esc(ele)}`;
      })
      .join("&");
  }

  async post(endpoint, formData, isCancelLoader = true) {
    try {
      this.setLoader(true);
      const url = `${this.appEndpoint}${endpoint}`;
      const result = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          ...this.getAuth(),
        },
        body: JSON.stringify(formData),
      });

      // if (result.ok) {
      //   //success
      // } else {
      //   //error handling
      // }

      return result;
    } catch (error) {
      //error handling
      throw new Error(error);
    } finally {
      if (isCancelLoader) {
        this.setLoader(false);
      }
    }
  }

  async put(endpoint, formData) {
    try {
      const url = `${this.appEndpoint}${endpoint}`;
      let body = formData;
      return await fetch(url, {
        method: "PUT",
        body,
        headers: { ...this.getAuth() },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async get(endpoint, params = {}, isParsed = true, loading = true, abort = false) {
    try {
      this.setLoader(loading);
      const query = this.generateQuery(params);
      const url = `${this.appEndpoint}/${endpoint}${query ? `?${query}` : ""}`;
      const result = await customFetch(`${url}`, {
        ...(abort && {signalKey: `${endpoint}${Object.keys(params).length}`}),
        headers: { ...this.getAuth() },
      });

      if(result.status >= 500 && result.status < 512) {
        return null
      }

      if (result.status !== 200) {
        throw result;
      }

      if (isParsed) {
        return await result.json();
      }

      return result;
    } catch (error) {
      console.log(error);
      const { status } = error;
      const response = await error.json();

      if (status === 401) {
        if (this.router.history) {
          storage.removeItem("token");
          this.router.history.push("/signin");
        }
      }
      
      throw {...response, status };
    } finally {
      this.setLoader(false);
    }
  }

  async delete(endpoint, formData) {
    try {
      const url = `${this.appEndpoint}${endpoint}`;
      return await fetch(url, {
        method: "DELETE",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          ...this.getAuth(),
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async patch(endpoint, formData) {
    try {
      const url = `${this.appEndpoint}${endpoint}`;
      return await fetch(url, {
        method: "PATCH",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          ...this.getAuth(),
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async patchFile(endpoint, body) {
    try {
      const url = `${this.appEndpoint}${endpoint}`;
      return fetch(url, {
        method: "PATCH",
        body,
        headers: { ...this.getAuth() },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async bodyFile(endpoint, body) {
    try {
      this.setLoader(true);
      const url = `${this.appEndpoint}${endpoint}`;
      return fetch(url, {
        method: "POST",
        body,
        headers: { ...this.getAuth() },
      });
    } catch (error) {
      throw new Error(error);
    } finally {
      this.setLoader(false);
    }
  }
}

export default new Request();
