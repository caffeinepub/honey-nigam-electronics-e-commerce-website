import { useNavigate } from '@tanstack/react-router';
import { useGetCart, useGetAllProducts, usePlaceOrder, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CheckoutPage() {
  const { data: cart, isLoading: cartLoading } = useGetCart();
  const { data: products } = useGetAllProducts();
  const { data: userProfile } = useGetCallerUserProfile();
  const placeOrder = usePlaceOrder();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!identity) {
    navigate({ to: '/' });
    return null;
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const cartItems = cart?.items || [];
  
  if (cartItems.length === 0) {
    navigate({ to: '/cart' });
    return null;
  }

  const cartProducts = cartItems
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);

  const subtotal = cartProducts.reduce((sum, item) => {
    return sum + Number(item!.product.price) * Number(item!.quantity);
  }, 0);

  const handlePlaceOrder = async () => {
    try {
      const orderId = await placeOrder.mutateAsync(cart!);
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
      setTimeout(() => {
        navigate({ to: '/orders' });
      }, 2000);
    } catch (error) {
      toast.error('Failed to place order');
      console.error(error);
    }
  };

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-400" />
        <h2 className="text-3xl font-bold mb-2">Order Placed Successfully!</h2>
        <p className="text-muted-foreground mb-6">Redirecting to order history...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{userProfile?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{userProfile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shipping Address</p>
                <p className="font-semibold">{userProfile?.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartProducts.map((item) => {
                const imageUrl = item!.product.images[0]?.getDirectURL() || '/assets/generated/smartphone-hero.dim_400x400.png';
                const price = (Number(item!.product.price) / 100).toFixed(2);
                const itemTotal = ((Number(item!.product.price) * Number(item!.quantity)) / 100).toFixed(2);

                return (
                  <div key={item!.productId} className="flex gap-4">
                    <img
                      src={imageUrl}
                      alt={item!.product.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item!.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${price} × {item!.quantity.toString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-400">${itemTotal}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="border-border/40 bg-card/50 backdrop-blur sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-cyan-400">${(subtotal / 100).toFixed(2)}</span>
              </div>
              <Button
                onClick={handlePlaceOrder}
                disabled={placeOrder.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {placeOrder.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
