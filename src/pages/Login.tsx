import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn();
      toast.success('Successfully signed in');
    } catch (error) {
      toast.error('Failed to sign in');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-800 flex items-center justify-center">
          <ShieldCheck className="h-10 w-10 mr-2" />
          Track Rental
        </h1>
        <p className="mt-3 text-gray-600">
          Asset and rental management made simple
        </p>
      </div>
      
      <Card>
        <CardBody>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">
              Log in to start managing your rentals
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              variant="primary"
              fullWidth
              isLoading={isLoading}
              onClick={handleSignIn}
            >
              Sign in with Google
            </Button>
          </div>
        </CardBody>
      </Card>
      
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>
          By signing in, you agree to our{' '}
          <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
            Terms of Service
          </span>{' '}
          and{' '}
          <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;