import { useState, useMemo } from 'react';
import { useGetAllProducts, useGetCart, useUpdateCart } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import ProductCard from '../components/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../backend';
import { Category } from '../backend';
import { useNavigate } from '@tanstack/react-router';
import { useIsCallerAdmin } from '../hooks/useQueries';

export default function HomePage() {
  const { data: products, isLoading } = useGetAllProducts();
  const { data: cart } = useGetCart();
  const updateCart = useUpdateCart();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsCallerAdmin();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price-low') {
        return Number(a.price) - Number(b.price);
      } else {
        return Number(b.price) - Number(a.price);
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleAddToCart = async (product: Product) => {
    if (!identity) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (Number(product.inventory) === 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItem = cart?.items.find((item) => item.productId === product.id);
    const newQuantity = existingItem ? Number(existingItem.quantity) + 1 : 1;

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
      : [...(cart?.items || []), { productId: product.id, quantity: BigInt(1) }];

    try {
      await updateCart.mutateAsync({ items: updatedItems });
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <img
          src="/assets/generated/hero-banner.dim_1200x400.png"
          alt="Hero Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Premium Electronics
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
            Discover the latest in phones, laptops, and cutting-edge gadgets
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value={Category.phones}>Phones</TabsTrigger>
              <TabsTrigger value={Category.laptops}>Laptops</TabsTrigger>
              <TabsTrigger value={Category.accessories}>Accessories</TabsTrigger>
              <TabsTrigger value={Category.gadgets}>Gadgets</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Admin Button */}
        {isAdmin && (
          <div className="mb-6">
            <Button
              onClick={() => navigate({ to: '/admin' })}
              variant="outline"
              className="border-cyan-500/50 hover:bg-cyan-500/10"
            >
              Admin Panel
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
