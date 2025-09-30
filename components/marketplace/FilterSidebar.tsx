
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface FilterSidebarProps {
  activeView: 'hire' | 'work';
  filters: {
    category: string;
    location: string;
    priceRange: number[];
    rating: number;
  };
  onFiltersChange: (filters: any) => void;
}

const categories = [
  'Music & Entertainment',
  'Photography & Videography',
  'Event Planning',
  'Catering & Food',
  'Decoration & Design',
  'Security & Safety',
  'Transportation',
  'Technical & AV',
  'Marketing & Promotion',
  'Other'
];

const locations = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Kakamega'
];

export default function FilterSidebar({ activeView, filters, onFiltersChange }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      location: 'all',
      priceRange: [0, 10000],
      rating: 0,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = 
    (localFilters.category && localFilters.category !== 'all') || 
    (localFilters.location && localFilters.location !== 'all') || 
    localFilters.priceRange[0] > 0 || 
    localFilters.priceRange[1] < 10000 || 
    localFilters.rating > 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <Select value={localFilters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div>
          <Label className="text-sm font-medium">Location</Label>
          <Select value={localFilters.location} onValueChange={(value) => updateFilter('location', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price/Budget Range */}
        <div>
          <Label className="text-sm font-medium">
            {activeView === 'hire' ? 'Price Range' : 'Budget Range'} (KES)
          </Label>
          <div className="mt-4 px-2">
            <Slider
              value={localFilters.priceRange}
              onValueChange={(value) => updateFilter('priceRange', value)}
              max={10000}
              min={0}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>KES {localFilters.priceRange[0].toLocaleString()}</span>
              <span>KES {localFilters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Rating Filter (only for hire view) */}
        {activeView === 'hire' && (
          <div>
            <Label className="text-sm font-medium">Minimum Rating</Label>
            <Select 
              value={localFilters.rating.toString()} 
              onValueChange={(value) => updateFilter('rating', parseInt(value))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any rating</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="2">2+ stars</SelectItem>
                <SelectItem value="1">1+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div>
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {localFilters.category && localFilters.category !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.category}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('category', 'all')}
                  />
                </Badge>
              )}
              {localFilters.location && localFilters.location !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.location}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('location', 'all')}
                  />
                </Badge>
              )}
              {(localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 10000) && (
                <Badge variant="secondary" className="text-xs">
                  KES {localFilters.priceRange[0]}-{localFilters.priceRange[1]}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('priceRange', [0, 10000])}
                  />
                </Badge>
              )}
              {localFilters.rating > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {localFilters.rating}+ stars
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('rating', 0)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
