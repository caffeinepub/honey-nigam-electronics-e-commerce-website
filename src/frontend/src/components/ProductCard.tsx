import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../backend';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageUrl = product.images[0]?.getDirectURL() || '/assets/generated/smartphone-hero.dim_400x400.png';
  const price = (Number(product.price) / 100).toFixed(2);
  const inStock = Number(product.inventory) > 0;

  return (
    <Card className="group overflow-hidden border-border/40 bg-card/50 backdrop-blur hover:border-cyan-500/50 transition-all duration-300">
      <Link to="/product/$productId" params={{ productId: product.id }}>
        <div className="aspect-square overflow-hidden bg-muted/50">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to="/product/$productId" params={{ productId: product.id }}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-cyan-400">${price}</span>
          {!inStock && (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onAddToCart?.(product)}
          disabled={!inStock}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
