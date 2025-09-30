#!/bin/bash

# Script to add empty state imports and update empty states across multiple pages

# Function to add imports to a file if not already present
add_imports() {
    local file="$1"
    if [ -f "$file" ]; then
        # Check if imports already exist
        if ! grep -q "EmptyState" "$file"; then
            # Find the last import line and add our imports after it
            sed -i '/^import.*from.*lucide-react/a import { EmptyState } from '\''@/components/ui/empty-state'\''\nimport { EMPTY_STATES } from '\''@/constants/empty-states'\''' "$file"
        fi
    fi
}

# Function to update specific empty state patterns
update_empty_state() {
    local file="$1"
    local pattern="$2"
    local replacement="$3"
    
    if [ -f "$file" ]; then
        # Use perl for multi-line replacements
        perl -i -pe "BEGIN{undef $/;} s/$pattern/$replacement/smg" "$file"
    fi
}

echo "Adding EmptyState imports to key pages..."

# Add imports to all relevant pages
add_imports "app/talent/notifications/page.tsx"
add_imports "app/talent/referrals/page.tsx"
add_imports "app/talent/disputes/page.tsx"
add_imports "app/talent/reviews/page.tsx"
add_imports "app/talent/earnings/page.tsx"
add_imports "app/talent/events/page.tsx"
add_imports "app/admin/bookings/page.tsx"
add_imports "app/admin/disputes/page.tsx"
add_imports "app/admin/analytics/page.tsx"
add_imports "app/admin/transactions/page.tsx"
add_imports "app/admin/payouts/page.tsx"
add_imports "app/admin/packages/page.tsx"

echo "Imports added successfully!"
echo "Manual updates still needed for specific empty state implementations."
