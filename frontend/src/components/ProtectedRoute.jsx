import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If the user is not authenticated, navigate to the login page
    if (!user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/Login');
    }

    // If the user does not have an allowed role, navigate to the Unauthorized page
    if (user && !allowedRoles.includes(user.role)) {
      console.log('User role not allowed:', user.role);
      navigate('/Unauthorized');
    }
  }, [user, allowedRoles, navigate]);  // Depend on user, allowedRoles, and navigate to trigger the effect when these values change
  
  // If user is authenticated and has the required role, render children
  return user && allowedRoles.includes(user.role) ? children : null;
};

export default ProtectedRoute;
