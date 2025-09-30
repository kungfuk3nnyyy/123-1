
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';
import { EMPTY_STATES } from '@/constants/empty-states';
import ProposalManagementCard from '@/components/marketplace/ProposalManagementCard';

interface TalentProfile {
  bio: string | null;
  averageRating: number | null;
  totalReviews: number;
  totalBookings: number;
}

interface Proposal {
  id: string;
  quoteAmountKes: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  Talent: {
    id: string;
    name: string | null;
    image: string | null;
    TalentProfile: TalentProfile | null;
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
  };
}

export default function EventApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventAndProposals();
    }
  }, [eventId]);

  const fetchEventAndProposals = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const eventResponse = await fetch(`/api/events/${eventId}`);
      if (!eventResponse.ok) {
        throw new Error('Failed to fetch event details');
      }
      const eventData = await eventResponse.json();
      setEvent(eventData.event || eventData);

      // Fetch proposals for this event
      const proposalsResponse = await fetch(`/api/events/${eventId}/proposals`);
      if (!proposalsResponse.ok) {
        throw new Error('Failed to fetch proposals');
      }
      const proposalsData = await proposalsResponse.json();
      setProposals(proposalsData.proposals || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = () => {
    if (!event) return '';
    if (event.budgetMin && event.budgetMax) {
      return `KES ${event.budgetMin.toLocaleString()} - ${event.budgetMax.toLocaleString()}`;
    } else if (event.budgetMin) {
      return `KES ${event.budgetMin.toLocaleString()}+`;
    } else if (event.budgetMax) {
      return `Up to KES ${event.budgetMax.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  const getProposalStats = () => {
    const total = proposals.length;
    const pending = proposals.filter(p => p.status === 'PENDING').length;
    const accepted = proposals.filter(p => p.status === 'ACCEPTED').length;
    const rejected = proposals.filter(p => p.status === 'REJECTED').length;
    
    return { total, pending, accepted, rejected };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {error || 'Event not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const stats = getProposalStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Proposals for {event.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(event.eventDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{formatBudget()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{event.description}</p>
            <div className="flex flex-wrap gap-2">
              {event.category.map((cat, index) => (
                <Badge key={index} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Proposal Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATES.MARKETPLACE_EVENTS.icon}
              title="No Proposals Yet"
              description="No talents have submitted proposals for this event yet. Share your event or browse talents to invite them."
              size="lg"
              action={{
                label: 'Browse Marketplace',
                onClick: () => router.push('/marketplace')
              }}
            />
          ) : (
            proposals.map((proposal) => (
              <ProposalManagementCard
                key={proposal.id}
                proposal={proposal}
                onProposalUpdate={fetchEventAndProposals}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
