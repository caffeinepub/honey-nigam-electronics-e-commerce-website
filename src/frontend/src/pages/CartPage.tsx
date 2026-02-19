import { useNavigate } from '@tanstack/react-router';
import { useGetCart, useUpdateCart, useGetAllProducts } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const { data: cart, isLoading: cartLoading } = useGetCart();
  const { data: products } = useGetAllProducts();
  const updateCart = useUpdateCart();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Please Login</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to view your cart</p>
        <Button onClick={() => navigate({ to: '/' })}>Go to Products</Button>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const cartProducts = cartItems
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);

  const subtotal = cartProducts.reduce((sum, item) => {
    return sum + Number(item!.product.price) * Number(item!.quantity);
  }, 0);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const updatedItems = cart!.items.map((item) =>
      item.productId === productId ? { ...item, quantity: BigInt(newQuantity) } : item
    );

    try {
      await updateCart.mutateAsync({ items: updatedItems });
    } catch (error) {
      toast.error('Failed to update cart');
      console.error(error);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    const updatedItems = cart!.items.filter((item) => item.productId !== productId);

    try {
      await updateCart.mutateAsync({ items: updatedItems });
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
      console.error(error);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some products to get started</p>
        <Button onClick={() => navigate({ to: '/' })}>Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartProducts.map((item) => {
            const imageUrl = item!.product.images[0]?.getDirectURL() || '/assets/generated/smartphone-hero.dim_400x400.png';
            const price = (Number(item!.product.price) / 100).toFixed(2);
            const itemTotal = ((Number(item!.product.price) * Number(item!.quantity)) / 100).toFixed(2);

            return (
              <Card key={item!.productId} className="border-border/40 bg-card/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={imageUrl}
                      alt={item!.product.name}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item!.product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">${price} each</p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item!.productId, Number(item!.quantity) - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{item!.quantity.toString()}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item!.productId, Number(item!.quantity) + 1)}
                          disabled={Number(item!.quantity) >= Number(item!.product.inventory)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item!.productId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-lg text-cyan-400">${itemTotal}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-cyan-400">${(subtotal / 100).toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => navigate({ to: '/checkout' })}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
