import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const { currentUser, logOut } = useAuth();
  const location = useLocation();
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <nav className="bg-blue-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-white text-xl font-bold">
                Track Rental
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/")
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/assets"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/assets")
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                Assets
              </Link>
              <Link
                to="/contacts"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/contacts")
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                Contacts
              </Link>
              <Link
                to="/rentals"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/rentals")
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                Rentals
              </Link>
            </div>
          </div>

          {/* User menu (desktop) */}
          {currentUser ? (
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center text-white bg-blue-700 hover:bg-blue-600 p-2 rounded-full focus:outline-none"
                >
                  <User className="h-5 w-5" />

                  <span className="ml-2 mr-1">{currentUser.displayName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex sm:items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (window.location.href = "/login")}
              >
                Sign in
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/")
                ? "bg-blue-900 text-white"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/assets"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/assets")
                ? "bg-blue-900 text-white"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            }`}
          >
            Assets
          </Link>
          <Link
            to="/contacts"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/contacts")
                ? "bg-blue-900 text-white"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            }`}
          >
            Contacts
          </Link>
          <Link
            to="/rentals"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/rentals")
                ? "bg-blue-900 text-white"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            }`}
          >
            Rentals
          </Link>
        </div>

        {/* Mobile user menu */}
        {currentUser && (
          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {currentUser.displayName}
                </div>
                <div className="text-sm font-medium text-blue-100">
                  {currentUser.email}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
