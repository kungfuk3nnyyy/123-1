
'use client';

import { Button } from '@/components/ui/button';
import { Users, Briefcase } from 'lucide-react';

interface MarketplaceToggleProps {
  activeView: 'hire' | 'work';
  onViewChange: (view: 'hire' | 'work') => void;
}

export default function MarketplaceToggle({ activeView, onViewChange }: MarketplaceToggleProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        variant={activeView === 'hire' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('hire')}
        className="flex items-center gap-2 rounded-md"
      >
        <Users className="h-4 w-4" />
        Hire Talent
      </Button>
      <Button
        variant={activeView === 'work' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('work')}
        className="flex items-center gap-2 rounded-md"
      >
        <Briefcase className="h-4 w-4" />
        Find Work
      </Button>
    </div>
  );
}
