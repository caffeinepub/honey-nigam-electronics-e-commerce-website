import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetProduct, useGetCart, useUpdateCart } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowLeft, Minus, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { productId } = useParams({ from: '/product/$productId' });
  const { data: product, isLoading } = useGetProduct(productId);
  const { data: cart } = useGetCart();
  const updateCart = useUpdateCart();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    );
  }

  const imageUrl = product.images[0]?.getDirectURL() || '/assets/generated/smartphone-hero.dim_400x400.png';
  const price = (Number(product.price) / 100).toFixed(2);
  const inStock = Number(product.inventory) > 0;
  const maxQuantity = Math.min(Number(product.inventory), 10);

  const handleAddToCart = async () => {
    if (!identity) {
      toast.error('Please login to add items to cart');
      return;
    }

    const existingItem = cart?.items.find((item) => item.productId === product.id);
    const currentQuantity = existingItem ? Number(existingItem.quantity) : 0;
    const newQuantity = currentQuantity + quantity;

    if (newQuantity > Number(product.inventory)) {
      toast.error('Not enough inventory available');
      return;
    }

    const updatedItems = existingItem
      ? cart!.items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: BigInt(newQuantity) }
            : item
        )
      : [...(cart?.items || []), { productId: product.id, quantity: BigInt(quantity) }];

    try {
      await updateCart.mutateAsync({ items: updatedItems });
      toast.success(`Added ${quantity} item(s) to cart!`);
      setQuantity(1);
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/' })}
        className="mb-6 hover:text-cyan-400"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <Card className="overflow-hidden border-border/40 bg-card/50 backdrop-blur">
          <CardContent className="p-0">
            <div className="aspect-square bg-muted/50">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
            <Badge variant="outline" className="text-cyan-400 border-cyan-400">
              {product.category}
            </Badge>
          </div>

          <div className="flex items-baseline space-x-4">
            <span className="text-4xl font-bold text-cyan-400">${price}</span>
            {inStock ? (
              <Badge variant="outline" className="text-green-400 border-green-400">
                In Stock ({product.inventory.toString()})
              </Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <Separator />

          {inStock && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={updateCart.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg py-6"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {updateCart.isPending ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
