'use client'

import { TalentCard } from './talent-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw, Loader2 } from 'lucide-react'

// Define a more specific type for the talent prop
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
  availability: string | null;
  BankAccount: {
    isVerified: boolean;
  } | null;
}

interface TalentGridProps {
  talents: Talent[]
  loading?: boolean
  onViewProfile: (talentId: string) => void
  onContact: (talentId: string) => void
  onRetry: () => void
}

export function TalentGrid({ 
  talents, 
  loading = false, 
  onViewProfile, 
  onContact, 
  onRetry 
}: TalentGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse border border-gray-200">
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 bg-gray-200 rounded flex-1"></div>
                <div className="h-9 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (talents.length === 0) {
    return (
      <Card className="p-12 border border-gray-200 bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-[#A3B8CC]" />
          </div>
          <h3 className="text-xl font-semibold text-[#212529] mb-3">No Talents Found</h3>
          <p className="text-[#6C757D] mb-6 max-w-md mx-auto">
            We couldn't find any talents matching your criteria. Try adjusting your filters or search terms.
          </p>
          <Button 
            onClick={onRetry}
            className="bg-[#A3B8CC] hover:bg-[#A3B8CC]/90 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {talents.map((talent) => (
        <TalentCard 
          key={talent.id} 
          talent={talent} 
          onViewProfile={onViewProfile}
          onContact={onContact}
        />
      ))}
    </div>
  )
}