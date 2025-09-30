import { 
  Bell,
  Calendar, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Folder, 
  List, 
  MessageSquare, 
  Search, 
  Settings, 
  Users 
} from 'lucide-react'

export const EMPTY_STATES = {
  TALENT_EARNINGS: {
    icon: DollarSign,
    title: 'No earnings yet',
    description: 'Your earnings will appear here once you complete bookings and receive payments.'
  },
  NO_EVENTS: {
    icon: Calendar,
    title: 'No events found',
    description: 'Create your first event to get started.'
  },
  NO_BOOKINGS: {
    icon: FileText,
    title: 'No bookings yet',
    description: 'Your upcoming bookings will appear here.'
  },
  NO_MESSAGES: {
    icon: MessageSquare,
    title: 'No messages',
    description: 'Your messages will appear here.'
  },
  NO_RESULTS: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you\'re looking for.'
  },
  TALENT_NOTIFICATIONS: {
    icon: Bell,
    title: 'No notifications',
    description: 'Your notifications will appear here.'
  },
  TALENT_REVIEWS: {
    icon: MessageSquare,
    title: 'No reviews yet',
    description: 'Your reviews will appear here once clients leave feedback.'
  }
} as const
