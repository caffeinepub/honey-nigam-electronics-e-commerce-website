import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCart, useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: cart } = useGetCart();
  const { data: userProfile } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const cartItemCount = cart?.items.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/assets/generated/honey-nigam-logo-transparent.dim_200x200.png" 
              alt="Honey Nigam" 
              className="h-10 w-10"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Honey Nigam
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-cyan-400">
              Products
            </Link>
            {isAuthenticated && (
              <Link to="/orders" className="text-sm font-medium transition-colors hover:text-cyan-400">
                Orders
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/cart' })}
              className="relative hover:text-cyan-400"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-cyan-500 hover:bg-cyan-600"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {isAuthenticated && userProfile && (
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-cyan-400" />
                <span className="text-muted-foreground">{userProfile.name}</span>
              </div>
            )}

            <Button
              onClick={handleAuth}
              disabled={loginStatus === 'logging-in'}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-sm font-medium transition-colors hover:text-cyan-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/orders" 
                  className="text-sm font-medium transition-colors hover:text-cyan-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Orders
                </Link>
              )}
              {isAuthenticated && userProfile && (
                <div className="flex items-center space-x-2 text-sm pt-2 border-t border-border/40">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="text-muted-foreground">{userProfile.name}</span>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
