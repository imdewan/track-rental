import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/assets/AssetList';
import AssetForm from './pages/assets/AssetForm';
import ContactList from './pages/contacts/ContactList';
import ContactForm from './pages/contacts/ContactForm';
import RentalList from './pages/rentals/RentalList';
import RentalForm from './pages/rentals/RentalForm';
import RentalDetails from './pages/rentals/RentalDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          {/* App routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Asset routes */}
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/:id" element={<AssetForm />} />
            
            {/* Contact routes */}
            <Route path="/contacts" element={<ContactList />} />
            <Route path="/contacts/new" element={<ContactForm />} />
            <Route path="/contacts/:id" element={<ContactForm />} />
            
            {/* Rental routes */}
            <Route path="/rentals" element={<RentalList />} />
            <Route path="/rentals/new" element={<RentalForm />} />
            <Route path="/rentals/:id" element={<RentalForm />} />
            <Route path="/rentals/:id/details" element={<RentalDetails />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;