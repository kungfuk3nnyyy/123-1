'use client'

import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MapPin, 
  Star, 
  Camera,
  Music,
  Mic,
  Palette,
  Video,
  Package,
  DollarSign,
  Clock
} from 'lucide-react'

// This interface now includes `availability`
interface Talent {
  id: string;
  User: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  category: string | null;
  location: string | null;
  averageRating: number | null;
  totalReviews: number;
  hourlyRate: number | null;
  availability: string | null; // Added availability
  BankAccount: {
    isVerified: boolean;
  } | null;
}

interface TalentCardProps {
  talent: Talent;
  onViewProfile: (id: string) => void;
  onContact: (id: string) => void;
}

const getCategoryIcon = (category: string | null) => {
  if (!category) return Package
  const cat = category.toLowerCase()
  if (cat.includes('photo')) return Camera
  if (cat.includes('music') || cat.includes('musician')) return Music
  if (cat.includes('dj')) return Mic
  if (cat.includes('video')) return Video
  if (cat.includes('art') || cat.includes('design')) return Palette
  return Package
}

const formatCurrency = (amount: number | null) => {
    if (amount === null || isNaN(amount)) return 'N/A'
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount)
}

export function TalentCard({ talent, onViewProfile, onContact }: TalentCardProps) {
  const rating = talent.averageRating || 0
  const reviews = talent.totalReviews || 0
  const CategoryIcon = getCategoryIcon(talent.category)
  const talentUserId = talent.User?.id
  
  // Dynamic styling for availability status
  const availabilityColor = {
    Available: 'text-green-600',
    'Partially Available': 'text-orange-500',
    Busy: 'text-red-500',
  }[talent.availability || ''] || 'text-gray-500';

  if (!talentUserId) return null // Don't render card if user data is missing

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={talent.User?.image || ''} alt={talent.User?.name || 'Talent'} />
            <AvatarFallback>{talent.User?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{talent.User?.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1"><CategoryIcon className="h-4 w-4" /> {talent.category}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{talent.location || 'Not set'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-primary">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
            {reviews > 0 && <span className="text-xs">({reviews})</span>}
          </div>
        </div>

        {/* --- SECTION for Rate and Availability --- */}
        <div className="border-t my-3"></div>
        <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1.5 text-gray-400"/>
                <span className="font-semibold">{formatCurrency(talent.hourlyRate)}</span>
                <span className="text-gray-500 ml-1">/hr</span>
            </div>
            <div className="flex items-center">
                 <Clock className={`w-4 h-4 mr-1.5 ${availabilityColor}`} />
                 <span className={`font-semibold ${availabilityColor}`}>{talent.availability || 'Not set'}</span>
            </div>
        </div>
        {/* --- END OF SECTION --- */}
        
      </CardContent>
      <CardFooter className="bg-muted/40 p-2 flex gap-2 mt-auto">
        <Button variant="outline" className="w-full" onClick={() => onViewProfile(talentUserId)}>View Profile</Button>
        <Button className="w-full" onClick={() => onContact(talentUserId)}>Contact</Button>
      </CardFooter>
    </Card>
  )
}

