
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';

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

interface EventCardProps {
  event: Event;
  onProposalSubmit: (eventId: string) => void;
  showProposalButton: boolean;
}

export default function EventCard({ event, onProposalSubmit, showProposalButton }: EventCardProps) {
  const formatBudget = () => {
    if (event.budgetMin && event.budgetMax) {
      return `KES ${event.budgetMin.toLocaleString()} - ${event.budgetMax.toLocaleString()}`;
    } else if (event.budgetMin) {
      return `KES ${event.budgetMin.toLocaleString()}+`;
    } else if (event.budgetMax) {
      return `Up to KES ${event.budgetMax.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <Badge className={getStatusColor(event.status)}>
                {event.status.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {event.category.map((cat, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="w-10 h-10 bg-gray-200 rounded-full mb-2"></div>
            <p className="text-sm font-medium">{event.user.name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4 line-clamp-3">{event.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(event.eventDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>{formatBudget()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{event._count.Proposal} proposals</span>
          </div>
          
          <div className="flex items-center gap-2">
            {showProposalButton && event.status === 'PUBLISHED' && (
              <Button 
                onClick={() => onProposalSubmit(event.id)}
              >
                Submit Proposal
              </Button>
            )}
            
            {!showProposalButton && event._count.Proposal > 0 && (
              <Button 
                variant="outline"
                onClick={() => window.location.href = `/marketplace/events/${event.id}/applicants`}
              >
                View Applicants ({event._count.Proposal})
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
