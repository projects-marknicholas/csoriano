import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useLogout } from "../hooks/useLogout";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Box,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  ClickAwayListener
} from "@mui/material";
import { FaUserCircle, FaHome, FaBell, FaComments } from "react-icons/fa";

const API_URL = import.meta.env.VITE_LOCAL_URL || 'http://localhost:4000';

const Navbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const [dropdownAnchor, setDropdownAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupNotificationSSE();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/chat/notifications/list?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupNotificationSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem('token');
    eventSourceRef.current = new EventSource(
      `${API_URL}/api/chat/notifications?userId=${user.id}&token=${token}`
    );

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error parsing SSE notification:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE notification connection error:', error);
      setTimeout(() => {
        if (user) {
          setupNotificationSSE();
        }
      }, 3000);
    };
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/chat/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogoutClick = () => {
    logout();
    setDropdownAnchor(null);
  };

  const handleDashboardNavigation = () => {
    if (user?.role === "designEngineer") {
      navigate("/DesignEngineerDashboard");
    } else if (user?.role === "user") {
      navigate("/UserDashboard");
    } else if (user?.role === "admin") {
      navigate("/AdminDashboard");
    }
  };

  const toggleDropdown = (event) => {
    setDropdownAnchor(event.currentTarget);
  };

  const closeDropdown = () => {
    setDropdownAnchor(null);
  };

  const toggleNotifications = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const closeNotifications = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    // You can add navigation logic here based on notification type
    closeNotifications();
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#f5f5f5",
        color: "#3f5930",
        boxShadow: "none",
        padding: "0.5rem 1rem",
      }}
    >
      <Toolbar sx={{ display: "flex", alignItems: "center" }}>
        {/* Company Info */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
              color: "#a7b194",
              fontSize: { xs: "28px", md: "32px" },
            }}
          >
            C. SORIANO
            <Typography
              variant="body1"
              component="span"
              sx={{
                ml: 1,
                color: "#a7b194",
                fontSize: { xs: "12px", md: "14px" },
              }}
            >
              CONSTRUCTION & SUPPLY
            </Typography>
          </Typography>
        </Box>

        {/* Dashboard Button */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Button
            startIcon={<FaHome style={{ color: "#3f5930" }} />}
            onClick={handleDashboardNavigation}
            sx={{
              color: "#3f5930",
              textTransform: "none",
              fontSize: { xs: "16px", md: "18px" },
              fontWeight: "bold",
              gap: "8px",
              "&:hover": {
                backgroundColor: "transparent",
                color: "#6b7c61",
              },
            }}
          >
            Dashboard
          </Button>
        </Box>

        {/* User Info and Icons */}
        {user && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Notifications Bell */}
            
            {user?.role !== "admin" && (
              <IconButton
                onClick={toggleNotifications}
                sx={{
                  color: "#a7b194",
                  "&:hover": {
                    color: "#6b7c61",
                  },
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <FaBell style={{ fontSize: "20px" }} />
                </Badge>
              </IconButton>
            )}

            {/* Notification Menu */}
            {user?.role !== "admin" && (
              <Menu
                anchorEl={notificationAnchor}
                open={Boolean(notificationAnchor)}
                onClose={closeNotifications}
                PaperProps={{
                  style: {
                    width: '350px',
                    maxHeight: '400px',
                  },
                }}
              >
                <MenuItem disabled>
                  <Typography variant="h6">Notifications</Typography>
                </MenuItem>
                <Divider />
                {notifications.length === 0 ? (
                  <MenuItem disabled>
                    <ListItemText primary="No notifications" />
                  </MenuItem>
                ) : (
                  <List sx={{ width: '100%', p: 0 }}>
                    {notifications.slice(0, 5).map((notification) => (
                      <ListItem
                        key={notification._id}
                        button
                        onClick={() => handleNotificationClick(notification)}
                        sx={{
                          backgroundColor: notification.isRead ? 'transparent' : '#f0f7ff',
                          borderLeft: notification.isRead ? 'none' : '3px solid #3f51b5',
                        }}
                      >
                        <ListItemIcon>
                          <FaComments />
                        </ListItemIcon>
                        <ListItemText
                          primary={notification.message}
                          secondary={new Date(notification.createdAt).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Menu>
            )}

            <Typography
              variant="body1"
              sx={{
                color: "#a7b194",
                fontWeight: "bold",
                fontSize: { xs: "14px", md: "inherit" },
              }}
            >
              Hi, {user.Username}
            </Typography>
            
            <IconButton
              onClick={toggleDropdown}
              sx={{
                color: "#a7b194",
                "&:hover": {
                  color: "#6b7c61",
                },
              }}
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
            >
              <FaUserCircle style={{ fontSize: "24px" }} />
            </IconButton>
            
            <Menu
              anchorEl={dropdownAnchor}
              open={Boolean(dropdownAnchor)}
              onClose={closeDropdown}
              PaperProps={{
                style: {
                  width: "200px",
                },
              }}
            >
              <MenuItem onClick={handleLogoutClick}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;