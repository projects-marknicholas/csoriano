import { useState } from "react";
import axios from "axios";

export const useSignup = () => {
  const [isLoading, setIsLoading] = useState(null);
  const [error, setError] = useState(null);

  const signup = async (password, Firstname, Lastname, Address) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_LOCAL_URL}/api/user/signup`,
        {
          password,
          Firstname,
          Lastname,
          Address
        }
      );

      const json = response.data;

      if (response.status >= 400) {
        setError(json.error);
      } else {
        return { user: json };
      }
    } catch (error) {
      setError(error.response?.data?.error || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading, error };
};