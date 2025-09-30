
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Eye, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Define the structure of the dispute data fetched from the API
interface Dispute {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  eventTitle: string;
  eventDate: Date | null;
  eventLocation: string;
  organizerName: string;
  organizerEmail: string;
  talentName: string;
  talentEmail: string;
  disputedByName: string;
  disputedByRole: string;
  bookingAmount: number;
  Booking: {
    Event: {
      title: string;
    };
    User_Booking_talentIdToUser: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

const DisputeStatusBadge = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: string } = {
    OPEN: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    RESOLVED_ORGANIZER_FAVOR: 'bg-green-100 text-green-800',
    RESOLVED_TALENT_FAVOR: 'bg-green-100 text-green-800',
    RESOLVED_PARTIAL: 'bg-gray-100 text-gray-800',
  };
  return <Badge className={`${statusStyles[status] || 'bg-gray-100'} hover:bg-gray-200`}>{status.replace(/_/g, ' ')}</Badge>;
};

export default function OrganizerDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/disputes');
        if (!response.ok) {
          throw new Error('Failed to fetch disputes data.');
        }
        const result = await response.json();
        if (result.success) {
          setDisputes(result.data);
        } else {
          throw new Error(result.error || 'An unknown error occurred.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching disputes.');
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading disputes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">My Disputes</h1>
            <p className="text-muted-foreground">View and manage your past and ongoing disputes.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Dispute History</CardTitle>
            <CardDescription>A record of all your current and past disputes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Talent</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      You have no disputes.
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dispute.eventTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {dispute.eventLocation}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1.5 text-gray-400" />
                            <div>
                              <p className="font-medium">{dispute.talentName}</p>
                              <p className="text-xs text-muted-foreground">{dispute.talentEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{dispute.reason.replace(/_/g, ' ')}</TableCell>
                        <TableCell><DisputeStatusBadge status={dispute.status} /></TableCell>
                        <TableCell>
                          <p className="font-medium">KES {dispute.bookingAmount?.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>{format(new Date(dispute.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/organizer/disputes/${dispute.id}`)}>
                            <Eye className="h-4 w-4 mr-2"/>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
};
