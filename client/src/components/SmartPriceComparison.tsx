import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingDown, Search, ExternalLink, Star, MapPin, Clock } from 'lucide-react';

interface PriceComparison {
  id: string;
  productName: string;
  currentPrice: number;
  bestPrice: number;
  savings: number;
  savingsPercentage: number;
  vendor: string;
  rating: number;
  location: string;
  lastUpdated: string;
  inStock: boolean;
}

interface SmartPriceComparisonProps {
  onSavingsFound?: (comparison: PriceComparison) => void;
}

export default function SmartPriceComparison({ onSavingsFound }: SmartPriceComparisonProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);

  const searchPrices = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    console.log('Searching for price comparisons:', searchQuery);
    
    // TODO: remove mock functionality - integrate with price comparison APIs
    setTimeout(() => {
      const mockComparisons: PriceComparison[] = [
        {
          id: '1',
          productName: searchQuery,
          currentPrice: 299.99,
          bestPrice: 249.99,
          savings: 50.00,
          savingsPercentage: 16.7,
          vendor: 'Amazon',
          rating: 4.5,
          location: 'Online',
          lastUpdated: '2 hours ago',
          inStock: true
        },
        {
          id: '2',
          productName: searchQuery,
          currentPrice: 299.99,
          bestPrice: 259.99,
          savings: 40.00,
          savingsPercentage: 13.3,
          vendor: 'Best Buy',
          rating: 4.3,
          location: '2.5 miles away',
          lastUpdated: '1 hour ago',
          inStock: true
        },
        {
          id: '3',
          productName: searchQuery,
          currentPrice: 299.99,
          bestPrice: 269.99,
          savings: 30.00,
          savingsPercentage: 10.0,
          vendor: 'Target',
          rating: 4.1,
          location: '3.2 miles away',
          lastUpdated: '30 minutes ago',
          inStock: false
        }
      ];
      
      setComparisons(mockComparisons);
      mockComparisons.forEach(comp => onSavingsFound?.(comp));
      setIsSearching(false);
    }, 2000);
  };

  const getSavingsColor = (percentage: number) => {
    if (percentage >= 15) return 'text-chart-2';
    if (percentage >= 10) return 'text-chart-3';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6" data-testid="price-comparison">
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Smart Price Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for a product to compare prices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPrices()}
              className="flex-1"
              data-testid="input-product-search"
            />
            <Button
              onClick={searchPrices}
              disabled={!searchQuery.trim() || isSearching}
              data-testid="button-search-prices"
            >
              {isSearching ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Compare
                </>
              )}
            </Button>
          </div>

          {comparisons.length === 0 && !isSearching && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a product name to find the best deals</p>
              <p className="text-sm">We'll search across multiple vendors for savings</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Comparison Results */}
      {comparisons.length > 0 && (
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Price Comparison Results</span>
              <Badge variant="secondary">
                {comparisons.length} vendors found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comparisons.map((comparison, index) => (
              <div 
                key={comparison.id}
                className={`border rounded-lg p-4 space-y-3 ${index === 0 ? 'border-chart-2 bg-chart-2/5' : ''}`}
                data-testid={`comparison-${comparison.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{comparison.vendor}</h4>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          Best Deal
                        </Badge>
                      )}
                      {!comparison.inStock && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-chart-3 text-chart-3" />
                        <span>{comparison.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{comparison.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Updated {comparison.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!comparison.inStock}
                    data-testid={`button-visit-${comparison.id}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Visit Store
                  </Button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-lg font-bold">${comparison.bestPrice}</p>
                    <p className="text-sm text-muted-foreground line-through">
                      ${comparison.currentPrice}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getSavingsColor(comparison.savingsPercentage)}`}>
                      Save ${comparison.savings}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ({comparison.savingsPercentage}% off)
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Prices are updated in real-time from verified vendors
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}