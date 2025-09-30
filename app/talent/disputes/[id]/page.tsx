import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, FileText, MessageSquare, Gavel } from 'lucide-react';
import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

// Define the detailed structure of the dispute data
interface DisputeDetails {
  id: string;
  reason: string;
  explanation: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  User: { name: string | null }; // User who raised the dispute
  Booking: {
    id: string;
    amount: number;
    Event: {
      title: string;
      eventDate: Date;
    };
    User_Booking_organizerIdToUser: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    User_Booking_talentIdToUser: {
        id: string;
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

// This function fetches data securely on the server
async function getDisputeDetails(disputeId: string): Promise<DisputeDetails | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Redirect to login if not authenticated
      redirect('/auth/login');
    }
  
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        User: { select: { name: true } },
        Booking: {
          include: {
            Event: { select: { title: true, eventDate: true } },
            User_Booking_organizerIdToUser: { select: { id: true, name: true, email: true, image: true } },
            User_Booking_talentIdToUser: { select: { id: true } },
          },
        },
      },
    });
  
    if (!dispute) {
      return null;
    }
  
    // Security check: Ensure the logged-in user is the talent for this booking
    if (dispute.Booking.User_Booking_talentIdToUser.id !== session.user.id) {
      return null; // Don't return data if the user is not authorized
    }
  
    // Prisma returns Decimal types for money, so we convert it to a number
    return {
      ...dispute,
      Booking: {
        ...dispute.Booking,
        amount: Number(dispute.Booking.amount),
      }
    };
}


export default async function TalentDisputeDetailPage({ params }: { params: { id: string } }) {
  const dispute = await getDisputeDetails(params.id);

  if (!dispute) {
    notFound();
  }

  const organizer = dispute.Booking.User_Booking_organizerIdToUser;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/talent/disputes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Disputes
        </Link>
      </Button>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
              <CardDescription>
                Dispute filed on {format(new Date(dispute.createdAt), 'MMMM dd, yyyy')} regarding the event: "{dispute.Booking.Event.title}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center"><FileText className="h-5 w-5 mr-2" /> Dispute Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="font-semibold">Status:</span> <DisputeStatusBadge status={dispute.status}/></div>
                        <div><span className="font-semibold">Reason:</span> {dispute.reason.replace(/_/g, ' ')}</div>
                        <div><span className="font-semibold">Dispute Filed By:</span> {dispute.User.name}</div>
                        <div><span className="font-semibold">Event Date:</span> {format(new Date(dispute.Booking.Event.eventDate), 'MMM dd, yyyy')}</div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2 flex items-center"><MessageSquare className="h-5 w-5 mr-2"/> Explanation Provided</h3>
                    <p className="text-sm text-muted-foreground p-4 bg-gray-50 rounded-md border">{dispute.explanation}</p>
                </div>
            </CardContent>
          </Card>
           <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg flex items-center"><Gavel className="h-5 w-5 mr-2" /> Resolution</h3>
                </CardHeader>
                <CardContent>
                    {dispute.status.startsWith('RESOLVED') ? (
                        <div className="space-y-2">
                             <p className="text-sm text-muted-foreground">
                                This dispute was resolved on {format(new Date(dispute.resolvedAt!), 'MMMM dd, yyyy')}.
                            </p>
                            <p className="text-sm p-4 bg-gray-50 rounded-md border">{dispute.resolutionNotes}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">This dispute is currently under review by our team.</p>
                    )}
                </CardContent>
           </Card>
        </div>
        <div className="space-y-6">
             <Card>
                <CardHeader>
                     <CardTitle className="text-base flex items-center"><User className="h-5 w-5 mr-2" /> Organizer</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                     <Avatar>
                        <AvatarImage src={organizer.image || undefined} />
                        <AvatarFallback>{organizer.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{organizer.name}</p>
                        <p className="text-xs text-muted-foreground">{organizer.email}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                     <CardTitle className="text-base">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between"><span>Booking ID:</span> <span className="font-mono text-xs">{dispute.Booking.id}</span></div>
                    <div className="flex justify-between"><span>Booking Amount:</span> <span>KES {dispute.Booking.amount}</span></div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

