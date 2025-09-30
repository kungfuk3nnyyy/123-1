
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string[];
  location: string;
  eventDate: string;
  budgetMin?: number;
  budgetMax?: number;
  user: {
    name: string;
  };
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onProposalSubmitted: () => void;
}

export default function ProposalModal({ isOpen, onClose, event, onProposalSubmitted }: ProposalModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quoteAmountKes: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !event) {
      toast.error('You must be logged in to submit a proposal');
      return;
    }

    if (!formData.quoteAmountKes || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteAmountKes: parseFloat(formData.quoteAmountKes),
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit proposal');
      }

      toast.success('Proposal submitted successfully!');
      onProposalSubmitted();
      onClose();
      
      // Reset form
      setFormData({
        quoteAmountKes: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      toast.error(error.message || 'Failed to submit proposal. Please try again.');
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

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Proposal</DialogTitle>
        </DialogHeader>
        
        {/* Event Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {event.category.map((cat, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
          <p className="text-gray-700 mb-3 line-clamp-3">{event.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(event.eventDate), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>{formatBudget()}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-600">Posted by: <span className="font-medium">{event.user.name}</span></p>
          </div>
        </div>

        {/* Proposal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quote Amount */}
          <div>
            <Label htmlFor="quoteAmountKes">Your Quote (KES) *</Label>
            <Input
              id="quoteAmountKes"
              type="number"
              value={formData.quoteAmountKes}
              onChange={(e) => handleInputChange('quoteAmountKes', e.target.value)}
              placeholder="Enter your quote amount"
              min="0"
              step="0.01"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the amount you would charge for this event
            </p>
          </div>

          {/* Proposal Message */}
          <div>
            <Label htmlFor="message">Proposal Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Explain why you're the right fit for this event. Include your experience, approach, and any relevant details."
              rows={6}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Make your proposal stand out by highlighting your relevant experience and unique approach
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
