
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MessageSquare, 
  MapPin, 
  CheckCircle,
  X,
  User,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

interface ProposalManagementCardProps {
  proposal: Proposal;
  onProposalUpdate: () => void;
}

export default function ProposalManagementCard({ proposal, onProposalUpdate }: ProposalManagementCardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleProposalAction = async (action: 'accept' | 'reject') => {
    setActionLoading(action);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} proposal`);
      }

      const result = await response.json();
      toast.success(`Proposal ${action}ed successfully!`);
      
      if (action === 'accept') {
        toast.info('A booking has been created. You can now proceed with payment.');
      }
      
      onProposalUpdate();
    } catch (error: any) {
      console.error(`Error ${action}ing proposal:`, error);
      toast.error(error.message || `Failed to ${action} proposal. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={proposal.Talent.image || ''} alt={proposal.Talent.name || ''} />
              <AvatarFallback>
                {proposal.Talent.name?.charAt(0)?.toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{proposal.Talent.name || 'Anonymous Talent'}</CardTitle>
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status.toLowerCase().replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {proposal.Talent.TalentProfile?.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span>{proposal.Talent.TalentProfile.averageRating.toFixed(1)}</span>
                    <span className="text-gray-500">({proposal.Talent.TalentProfile.totalReviews} reviews)</span>
                  </div>
                )}
                {proposal.Talent.TalentProfile?.totalBookings && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{proposal.Talent.TalentProfile.totalBookings} bookings</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(proposal.quoteAmountKes)}
            </div>
            <div className="text-sm text-gray-500">
              <Calendar className="h-3 w-3 inline mr-1" />
              {format(new Date(proposal.createdAt), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Talent Bio */}
        {proposal.Talent.TalentProfile?.bio && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">About the Talent:</h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {proposal.Talent.TalentProfile.bio}
            </p>
          </div>
        )}

        {/* Proposal Message */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Proposal Message:</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {proposal.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Talent
          </Button>
          
          {proposal.status === 'PENDING' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleProposalAction('accept')}
                disabled={actionLoading !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === 'accept' ? (
                  'Accepting...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleProposalAction('reject')}
                disabled={actionLoading !== null}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {actionLoading === 'reject' ? (
                  'Rejecting...'
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
