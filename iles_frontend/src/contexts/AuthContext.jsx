import React, { useEffect, useRef, useState } from "react";
import AuthContext from "./AuthContextInstance";
import { toast } from "react-toastify";
import { authAPI, notificationsAPI } from "@/api/api";
import { getErrorMessage } from "@/api/api";

export const AuthProvider = ({ children }) => {
  const seenNotificationIdsRef = useRef(new Set());
  const hasLoadedNotificationsRef = useRef(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("access_token")) && !localStorage.getItem("user")
  );

  const fetchNotifications = async ({ toastNew = false } = {}) => {
    try {
      const response = await notificationsAPI.getNotifications({ limit: 20 });
      const nextNotifications = response.data;

      if (hasLoadedNotificationsRef.current && toastNew) {
        const newNotifications = nextNotifications.filter(
          (notification) => !seenNotificationIdsRef.current.has(notification.id)
        );

        newNotifications
          .slice()
          .reverse()
          .forEach((notification) => {
            toast.info(notification.title);
          });
      }

      nextNotifications.forEach((notification) => {
        seenNotificationIdsRef.current.add(notification.id);
      });

      hasLoadedNotificationsRef.current = true;
      setNotifications(nextNotifications);
    } catch {
      // Keep notification polling silent so it doesn't interrupt the main app flow.
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    authAPI
      .getProfile()
      .then((response) => {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      seenNotificationIdsRef.current = new Set();
      hasLoadedNotificationsRef.current = false;
      return;
    }

    fetchNotifications();

    const pollingInterval = setInterval(() => {
      fetchNotifications({ toastNew: true });
    }, 30000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [user]);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await authAPI.login(credentials);
      const { access, refresh } = response.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      const profileResponse = await authAPI.getProfile();
      const profile = profileResponse.data;

      setUser(profile);
      localStorage.setItem("user", JSON.stringify(profile));

      return { success: true, user: profile };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Login failed"),
        details: error.response?.data,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Registration failed"),
        details: error.response?.data,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setNotifications([]);
    seenNotificationIdsRef.current = new Set();
    hasLoadedNotificationsRef.current = false;
    setUser(null);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId ? response.data : notification
        )
      );
    } catch {
      // Ignore notification read errors in the shared context.
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch {
      // Ignore notification read errors in the shared context.
    }
  };

  const value = {
    user,
    notifications,
    unreadNotificationsCount: notifications.filter((notification) => !notification.is_read).length,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
