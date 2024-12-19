import { hasToken } from '@/utils/storage'
import { Navigate, useLocation } from 'react-router-dom'
type Props = {
  children: JSX.Element
}

/**
 * AuthRoute is a higher-order component that handles authentication login.
 * It checks if a token exists in the local storage. If it does, it renders
 * the children components. Otherwise, it redirects the user to the login page.
 *
 * @param {Props} props - The component props.
 * @param {JSX.Element} props.children - The child components to be rendered if authenticated.
 * @return {JSX.Element} The component to be rendered based on authentication status.
 */
export default function AuthRoute({ children }: Props) {
  // Get the current location from react-router-dom
  const location = useLocation()

  /**
   * Renders the component based on authentication status.
   * If a token exists, it renders the children components.
   * Otherwise, it redirects the user to the login page.
   *
   * @return {JSX.Element} The component to be rendered.
   */
  const render = () => {
    // Check if a token exists in the local storage
    if (hasToken()) {
      // If a token exists, render the children components
      return children
    } else {
      // If no token exists, redirect the user to the login page
      return (
        <Navigate
          to={'/login'}
          state={{ from: location.pathname }} // Include the current path as the referrer
        />
      )
    }
  }

  // Call the render function and return the result
  return render()
}
