import { useNavigate } from '@tanstack/react-router';
import { useGetOrderHistory, useGetAllProducts } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Loader2 } from 'lucide-react';

export default function OrderHistoryPage() {
  const { data: orders, isLoading } = useGetOrderHistory();
  const { data: products } = useGetAllProducts();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Please Login</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to view your orders</p>
        <Button onClick={() => navigate({ to: '/' })}>Go to Products</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
        <Button onClick={() => navigate({ to: '/' })}>Browse Products</Button>
      </div>
    );
  }

  const sortedOrders = [...orders].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>

      <div className="space-y-6">
        {sortedOrders.map((order) => {
          const orderDate = new Date(Number(order.createdAt) / 1000000);
          const orderTotal = (Number(order.total) / 100).toFixed(2);

          return (
            <Card key={order.id} className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 16)}...</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {orderDate.toLocaleDateString()} at {orderDate.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Completed
                    </Badge>
                    <span className="text-xl font-bold text-cyan-400">${orderTotal}</span>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.items.map((item) => {
                    const product = products?.find((p) => p.id === item.productId);
                    if (!product) return null;

                    const imageUrl = product.images[0]?.getDirectURL() || '/assets/generated/smartphone-hero.dim_400x400.png';
                    const price = (Number(product.price) / 100).toFixed(2);

                    return (
                      <div key={item.productId} className="flex gap-4">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${price} × {item.quantity.toString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${((Number(product.price) * Number(item.quantity)) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
