
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, MapPin, Calendar, DollarSign, Search, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { EMPTY_STATES } from '@/constants/empty-states';
import MarketplaceToggle from '@/components/marketplace/MarketplaceToggle';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import EventCard from '@/components/marketplace/EventCard';
import EventPostModal from '@/components/marketplace/EventPostModal';
import ProposalModal from '@/components/marketplace/ProposalModal';
import { PublicHeader } from '@/components/public-header';
import { useDebounce } from '@/hooks/useDebounce';

interface TalentPackage {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  priceIsHidden?: boolean;
  coverImageUrl?: string;
  rating: number;
  reviews: number;
  provider: {
    id: string;
    name: string;
    location: string;
    verified: boolean;
    skills: string[];
    bio: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  category: string[];
  location: string;
  eventDate: string;
  budgetMin?: number;
  budgetMax?: number;
  status: string;
  user: {
    name: string;
    image?: string;
  };
  _count: {
    Proposal: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [activeView, setActiveView] = useState<'hire' | 'work'>('hire');
  const [packages, setPackages] = useState<TalentPackage[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    priceRange: [0, 10000],
    rating: 0,
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Set default view based on user role
  useEffect(() => {
    if (session?.user?.role === 'TALENT') {
      setActiveView('work');
    } else {
      setActiveView('hire');
    }
  }, [session]);

  // Fetch data when view, filters, or debounced search changes
  useEffect(() => {
    fetchData(1); // Reset to page 1 when filters change
  }, [activeView, filters, debouncedSearchQuery]);

  // Initial data load
  useEffect(() => {
    if (initialLoading) {
      fetchData(1);
    }
  }, []);

  const fetchData = useCallback(async (page: number = 1) => {
    if (page === 1) {
      setLoading(true);
    }
    setError(null);

    try {
      if (activeView === 'hire') {
        // Prepare query params for packages
        const params = new URLSearchParams();
        
        // Add search query if present
        if (debouncedSearchQuery.trim()) {
          params.append('search', debouncedSearchQuery.trim());
        }
        
        // Only include category and location if they're not 'all'
        if (filters.category && filters.category !== 'all') {
          params.append('category', filters.category);
        }
        if (filters.location && filters.location !== 'all') {
          params.append('location', filters.location);
        }
        
        // Always include price range and rating
        params.append('minPrice', filters.priceRange[0].toString());
        params.append('maxPrice', filters.priceRange[1].toString());
        
        // Add pagination
        params.append('page', page.toString());
        params.append('limit', '12');
        
        // Fetch talent packages
        const response = await fetch(`/api/packages?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch packages: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch packages');
        }
        
        setPackages(data.packages || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 12
        });
      } else {
        // Prepare query params for events
        const eventParams = new URLSearchParams();
        
        // Add search query if present
        if (debouncedSearchQuery.trim()) {
          eventParams.append('search', debouncedSearchQuery.trim());
        }
        
        // Only include category and location if they're not 'all'
        if (filters.category && filters.category !== 'all') {
          eventParams.append('category', filters.category);
        }
        if (filters.location && filters.location !== 'all') {
          eventParams.append('location', filters.location);
        }
        
        // Always include budget range
        eventParams.append('minBudget', filters.priceRange[0].toString());
        eventParams.append('maxBudget', filters.priceRange[1].toString());
        
        // Add pagination
        eventParams.append('page', page.toString());
        eventParams.append('limit', '10');
        
        // Fetch events/job posts
        const response = await fetch(`/api/events?${eventParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch events');
        }
        
        setEvents(data.events || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      // Set empty data on error
      if (activeView === 'hire') {
        setPackages([]);
      } else {
        setEvents([]);
      }
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: activeView === 'hire' ? 12 : 10
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [activeView, filters, debouncedSearchQuery]);

  const handleProposalSubmit = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowProposalModal(true);
    }
  };

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      fetchData(pagination.currentPage + 1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const hasResults = activeView === 'hire' ? packages.length > 0 : events.length > 0;
  const showEmptyState = !loading && !initialLoading && !hasResults;
  const showLoadingState = loading || initialLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h1>
            <p className="text-gray-600">
              {activeView === 'hire' 
                ? 'Find and hire talented professionals for your events'
                : 'Discover exciting opportunities and submit proposals'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <MarketplaceToggle 
              activeView={activeView} 
              onViewChange={setActiveView} 
            />
            
            {activeView === 'hire' && session?.user?.role === 'ORGANIZER' && (
              <Button onClick={() => setShowEventModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post Event
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={`Search ${activeView === 'hire' ? 'talents and services' : 'events and opportunities'}...`}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                ×
              </Button>
            )}
          </div>
          {debouncedSearchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching for "{debouncedSearchQuery}"...
                </span>
              ) : (
                `Showing results for "${debouncedSearchQuery}"`
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <FilterSidebar 
              activeView={activeView}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {error}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchData(1)}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Results Count */}
            {!showLoadingState && !error && (
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  {pagination.totalItems > 0 ? (
                    <>
                      Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} {activeView === 'hire' ? 'talents' : 'events'}
                    </>
                  ) : (
                    `No ${activeView === 'hire' ? 'talents' : 'events'} found`
                  )}
                </p>
              </div>
            )}

            {showLoadingState ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : showEmptyState ? (
              <EmptyState
                icon={activeView === 'hire' ? EMPTY_STATES.MARKETPLACE_PACKAGES.icon : EMPTY_STATES.MARKETPLACE_EVENTS.icon}
                title={debouncedSearchQuery ? `No results found for "${debouncedSearchQuery}"` : (activeView === 'hire' ? EMPTY_STATES.MARKETPLACE_PACKAGES.title : EMPTY_STATES.MARKETPLACE_EVENTS.title)}
                description={debouncedSearchQuery ? 'Try adjusting your search terms or filters to find what you\'re looking for.' : (activeView === 'hire' ? EMPTY_STATES.MARKETPLACE_PACKAGES.description : EMPTY_STATES.MARKETPLACE_EVENTS.description)}
                size="lg"
                action={activeView === 'work' && session?.user?.role === 'ORGANIZER' && !debouncedSearchQuery ? {
                  label: 'Post Your First Event',
                  onClick: () => setShowEventModal(true)
                } : debouncedSearchQuery ? {
                  label: 'Clear Search',
                  onClick: clearSearch
                } : undefined}
              />
            ) : (
              <>
                {activeView === 'hire' ? (
                  // Talent Packages Grid
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{pkg.title}</CardTitle>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {pkg.location}
                              </p>
                            </div>
                            <Badge variant="secondary">{pkg.category}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-4 line-clamp-3">{pkg.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                {pkg.provider.verified && (
                                  <span className="text-xs text-blue-600">✓</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{pkg.provider.name}</p>
                                <p className="text-xs text-gray-500">
                                  ⭐ {pkg.rating > 0 ? pkg.rating.toFixed(1) : 'New'} 
                                  ({pkg.reviews} reviews)
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {!pkg.priceIsHidden && (
                                <p className="text-lg font-bold text-green-600">
                                  KES {pkg.price.toLocaleString()}
                                </p>
                              )}
                              <Button size="sm" className="mt-2">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Events List
                  <div className="space-y-4">
                    {events.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        onProposalSubmit={handleProposalSubmit}
                        showProposalButton={session?.user?.role === 'TALENT'}
                      />
                    ))}
                  </div>
                )}

                {/* Load More Button */}
                {pagination.currentPage < pagination.totalPages && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={handleLoadMore}
                      disabled={loading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More (${pagination.totalItems - (pagination.currentPage * pagination.itemsPerPage)} remaining)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventPostModal 
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onEventCreated={() => fetchData(1)}
      />

      <ProposalModal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        event={selectedEvent}
        onProposalSubmitted={() => fetchData(1)}
      />
    </div>
  );
}
