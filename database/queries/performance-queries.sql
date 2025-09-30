-- Performance Optimization Queries for Event Talents Platform
-- These queries address common performance bottlenecks and provide optimized alternatives

-- 1. Optimized User Search with Proper Indexing
-- Issue: Full table scans on user searches
-- Solution: Use proper indexes and optimized WHERE clauses

-- Create indexes for better performance (run these via Prisma migrations)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_active ON "User" (email, "isActive") WHERE "isActive" = true;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_approval ON "User" (role, "adminApprovalStatus") WHERE "adminApprovalStatus" = 'APPROVED';
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_talent_profile_category ON "TalentProfile" (category) WHERE category IS NOT NULL;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_status_dates ON "Booking" (status, "createdAt", "proposedDate");
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_talent_dates ON "TalentAvailability" ("talentId", "startDate", "endDate", status);

-- 2. Optimized Talent Search Query
-- Replaces: Multiple separate queries for talent search
-- With: Single optimized query with proper joins
SELECT 
    u.id,
    u.name,
    u.email,
    u."profilePictureUrl",
    tp.bio,
    tp.tagline,
    tp.category,
    tp.skills,
    tp.location,
    tp."hourlyRate",
    tp."averageRating",
    tp."totalReviews",
    tp."totalBookings",
    COUNT(p.id) as package_count
FROM "User" u
INNER JOIN "TalentProfile" tp ON u.id = tp."userId"
LEFT JOIN "Package" p ON tp.id = p."talentId" AND p."isPublished" = true AND p."isActive" = true
WHERE 
    u.role = 'TALENT'
    AND u."isActive" = true
    AND u."adminApprovalStatus" = 'APPROVED'
    AND ($1::text IS NULL OR tp.category ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR tp.location ILIKE '%' || $2 || '%')
    AND ($3::decimal IS NULL OR tp."hourlyRate" <= $3)
    AND ($4::text IS NULL OR (
        tp.skills::text ILIKE '%' || $4 || '%' 
        OR u.name ILIKE '%' || $4 || '%'
        OR tp.bio ILIKE '%' || $4 || '%'
    ))
GROUP BY u.id, u.name, u.email, u."profilePictureUrl", tp.bio, tp.tagline, 
         tp.category, tp.skills, tp.location, tp."hourlyRate", tp."averageRating", 
         tp."totalReviews", tp."totalBookings"
ORDER BY 
    CASE WHEN $5 = 'rating' THEN tp."averageRating" END DESC NULLS LAST,
    CASE WHEN $5 = 'price_low' THEN tp."hourlyRate" END ASC NULLS LAST,
    CASE WHEN $5 = 'price_high' THEN tp."hourlyRate" END DESC NULLS LAST,
    CASE WHEN $5 = 'experience' THEN tp."totalBookings" END DESC,
    u."createdAt" DESC
LIMIT $6 OFFSET $7;

-- 3. Optimized Booking Analytics Query
-- Issue: Slow aggregation queries for dashboard analytics
-- Solution: Pre-aggregated data with efficient grouping
WITH booking_stats AS (
    SELECT 
        DATE_TRUNC('month', b."createdAt") as month,
        b.status,
        COUNT(*) as booking_count,
        SUM(b.amount) as total_amount,
        AVG(b.amount) as avg_amount,
        COUNT(DISTINCT b."talentId") as unique_talents,
        COUNT(DISTINCT b."organizerId") as unique_organizers
    FROM "Booking" b
    WHERE b."createdAt" >= $1::timestamp
        AND b."createdAt" <= $2::timestamp
    GROUP BY DATE_TRUNC('month', b."createdAt"), b.status
)
SELECT 
    month,
    status,
    booking_count,
    total_amount,
    avg_amount,
    unique_talents,
    unique_organizers,
    LAG(booking_count) OVER (PARTITION BY status ORDER BY month) as prev_month_count,
    ROUND(
        (booking_count - LAG(booking_count) OVER (PARTITION BY status ORDER BY month)) * 100.0 / 
        NULLIF(LAG(booking_count) OVER (PARTITION BY status ORDER BY month), 0), 2
    ) as growth_percentage
FROM booking_stats
ORDER BY month DESC, status;

-- 4. Optimized Availability Check Query
-- Issue: Complex availability checking with multiple table scans
-- Solution: Single query with proper date range handling
WITH availability_conflicts AS (
    SELECT 
        ta.id,
        ta."startDate",
        ta."endDate",
        ta.status,
        'availability' as conflict_type
    FROM "TalentAvailability" ta
    WHERE ta."talentId" = $1
        AND ta.status IN ('UNAVAILABLE', 'BUSY')
        AND ta."startDate" < $3::timestamp  -- endDate parameter
        AND ta."endDate" > $2::timestamp    -- startDate parameter
    
    UNION ALL
    
    SELECT 
        b.id,
        COALESCE(b."acceptedDate", b."proposedDate") as "startDate",
        COALESCE(b."eventEndDateTime", 
                 COALESCE(b."acceptedDate", b."proposedDate") + INTERVAL '8 hours') as "endDate",
        b.status::text,
        'booking' as conflict_type
    FROM "Booking" b
    WHERE b."talentId" = $1
        AND b.status IN ('ACCEPTED', 'IN_PROGRESS', 'PENDING')
        AND COALESCE(b."acceptedDate", b."proposedDate") < $3::timestamp
        AND COALESCE(b."eventEndDateTime", 
                     COALESCE(b."acceptedDate", b."proposedDate") + INTERVAL '8 hours') > $2::timestamp
)
SELECT 
    CASE WHEN COUNT(*) > 0 THEN false ELSE true END as is_available,
    COUNT(*) as conflict_count,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', id,
            'startDate', "startDate",
            'endDate', "endDate",
            'status', status,
            'type', conflict_type
        )
    ) FILTER (WHERE id IS NOT NULL) as conflicts
FROM availability_conflicts;

-- 5. Optimized Message Thread Query
-- Issue: N+1 queries for message threads
-- Solution: Single query with proper aggregation
SELECT 
    CASE 
        WHEN m."senderId" = $1 THEN m."receiverId"
        ELSE m."senderId"
    END as other_user_id,
    u.name as other_user_name,
    u."profilePictureUrl" as other_user_avatar,
    u.role as other_user_role,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE m."isRead" = false AND m."receiverId" = $1) as unread_count,
    MAX(m."createdAt") as last_message_date,
    FIRST_VALUE(m.content) OVER (
        PARTITION BY CASE WHEN m."senderId" = $1 THEN m."receiverId" ELSE m."senderId" END
        ORDER BY m."createdAt" DESC
    ) as last_message_content,
    FIRST_VALUE(m."senderId") OVER (
        PARTITION BY CASE WHEN m."senderId" = $1 THEN m."receiverId" ELSE m."senderId" END
        ORDER BY m."createdAt" DESC
    ) as last_message_sender_id
FROM "Message" m
INNER JOIN "User" u ON u.id = CASE 
    WHEN m."senderId" = $1 THEN m."receiverId"
    ELSE m."senderId"
END
WHERE m."senderId" = $1 OR m."receiverId" = $1
GROUP BY 
    CASE WHEN m."senderId" = $1 THEN m."receiverId" ELSE m."senderId" END,
    u.name,
    u."profilePictureUrl",
    u.role
ORDER BY MAX(m."createdAt") DESC
LIMIT $2 OFFSET $3;

-- 6. Optimized Package Search with Filters
-- Issue: Slow package search with multiple filters
-- Solution: Optimized query with proper indexing strategy
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.location,
    p.price,
    p.duration,
    p.features,
    p."coverImageUrl",
    p."viewCount",
    p."bookingCount",
    p."priceIsHidden",
    tp."userId" as talent_id,
    u.name as talent_name,
    u."profilePictureUrl" as talent_avatar,
    tp."averageRating",
    tp."totalReviews",
    tp.location as talent_location
FROM "Package" p
INNER JOIN "TalentProfile" tp ON p."talentId" = tp.id
INNER JOIN "User" u ON tp."userId" = u.id
WHERE 
    p."isPublished" = true
    AND p."isActive" = true
    AND u."isActive" = true
    AND u."adminApprovalStatus" = 'APPROVED'
    AND ($1::text IS NULL OR p.category ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR p.location ILIKE '%' || $2 || '%')
    AND ($3::decimal IS NULL OR p.price <= $3)
    AND ($4::decimal IS NULL OR p.price >= $4)
    AND ($5::text IS NULL OR (
        p.title ILIKE '%' || $5 || '%'
        OR p.description ILIKE '%' || $5 || '%'
        OR u.name ILIKE '%' || $5 || '%'
    ))
ORDER BY 
    CASE WHEN $6 = 'price_low' THEN p.price END ASC NULLS LAST,
    CASE WHEN $6 = 'price_high' THEN p.price END DESC NULLS LAST,
    CASE WHEN $6 = 'rating' THEN tp."averageRating" END DESC NULLS LAST,
    CASE WHEN $6 = 'popular' THEN p."bookingCount" END DESC,
    p."createdAt" DESC
LIMIT $7 OFFSET $8;

-- 7. Database Health Check Query
-- Monitor database performance and identify issues
SELECT 
    'connection_count' as metric,
    COUNT(*) as value,
    'Current active connections' as description
FROM pg_stat_activity
WHERE state = 'active'

UNION ALL

SELECT 
    'slow_queries' as metric,
    COUNT(*) as value,
    'Queries running longer than 30 seconds' as description
FROM pg_stat_activity
WHERE state = 'active' 
    AND query_start < NOW() - INTERVAL '30 seconds'
    AND query NOT LIKE '%pg_stat_activity%'

UNION ALL

SELECT 
    'database_size' as metric,
    pg_size_pretty(pg_database_size(current_database()))::text as value,
    'Total database size' as description

UNION ALL

SELECT 
    'cache_hit_ratio' as metric,
    ROUND(
        100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2
    )::text as value,
    'Buffer cache hit ratio (should be > 95%)' as description
FROM pg_stat_database
WHERE datname = current_database();

-- 8. Index Usage Analysis Query
-- Identify unused or inefficient indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'Never used'
        WHEN idx_scan < 100 THEN 'Rarely used'
        ELSE 'Frequently used'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, idx_tup_read DESC;
