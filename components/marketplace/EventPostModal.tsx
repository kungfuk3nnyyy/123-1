
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface EventPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
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

export default function EventPostModal({ isOpen, onClose, onEventCreated }: EventPostModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: [] as string[],
    location: '',
    eventDate: '',
    budgetMin: '',
    budgetMax: '',
    requirements: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryAdd = (category: string) => {
    if (!formData.category.includes(category)) {
      setFormData(prev => ({
        ...prev,
        category: [...prev.category, category]
      }));
    }
  };

  const handleCategoryRemove = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.filter(c => c !== category)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error('You must be logged in to post an event');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
          eventDate: new Date(formData.eventDate).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const result = await response.json();
      toast.success('Event posted successfully!');
      onEventCreated();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: [],
        location: '',
        eventDate: '',
        budgetMin: '',
        budgetMax: '',
        requirements: '',
        status: 'DRAFT'
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your event in detail"
              rows={4}
              required
            />
          </div>

          {/* Categories */}
          <div>
            <Label>Categories *</Label>
            <Select onValueChange={handleCategoryAdd}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Add categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.category.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.category.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleCategoryRemove(category)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Location and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Event location"
                required
              />
            </div>
            <div>
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <Label>Budget Range (KES)</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                  placeholder="Minimum budget"
                  min="0"
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                  placeholder="Maximum budget"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <Label htmlFor="requirements">Special Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="Any special requirements or qualifications needed"
              rows={3}
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'DRAFT' | 'PUBLISHED') => handleInputChange('status', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Save as Draft</SelectItem>
                <SelectItem value="PUBLISHED">Publish Now</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
