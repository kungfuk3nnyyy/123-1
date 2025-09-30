"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var admin1, _a, _b, admin2, _c, _d, talent1, _e, _f, talent2, _g, _h, talent3, _j, _k, talent4, _l, _m, pendingTalent, _o, _p, rejectedTalent, _q, _r, organizer1, _s, _t, organizer2, _u, _v, error_1;
        var _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15;
        return __generator(this, function (_16) {
            switch (_16.label) {
                case 0:
                    console.log('🚀 Starting comprehensive seed process...');
                    _16.label = 1;
                case 1:
                    _16.trys.push([1, 27, , 28]);
                    // Clear existing data
                    console.log('🧹 Clearing existing data...');
                    return [4 /*yield*/, prisma.$transaction([
                            prisma.booking.deleteMany({}),
                            prisma.proposal.deleteMany({}),
                            prisma.event.deleteMany({}),
                            prisma.package.deleteMany({}),
                            prisma.talentProfile.deleteMany({}),
                            prisma.organizerProfile.deleteMany({}),
                            prisma.user.deleteMany({}),
                        ])];
                case 2:
                    _16.sent();
                    console.log('✅ Existing data cleared');
                    // Create Admin Users
                    console.log('👑 Creating Admin Users...');
                    _b = (_a = prisma.user).create;
                    _w = {};
                    _x = {
                        name: 'Super Admin',
                        email: 'admin@gigsec.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('admin123', 10)];
                case 3: return [4 /*yield*/, _b.apply(_a, [(_w.data = (_x.password = _16.sent(),
                            _x.role = client_1.UserRole.ADMIN,
                            _x.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _x.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _x.isActive = true,
                            _x.isEmailVerified = true,
                            _x.emailVerified = new Date(),
                            _x),
                            _w)])];
                case 4:
                    admin1 = _16.sent();
                    _d = (_c = prisma.user).create;
                    _y = {};
                    _z = {
                        name: 'Platform Manager',
                        email: 'manager@gigsec.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('manager123', 10)];
                case 5: return [4 /*yield*/, _d.apply(_c, [(_y.data = (_z.password = _16.sent(),
                            _z.role = client_1.UserRole.ADMIN,
                            _z.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _z.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _z.isActive = true,
                            _z.isEmailVerified = true,
                            _z.emailVerified = new Date(),
                            _z),
                            _y)])];
                case 6:
                    admin2 = _16.sent();
                    console.log('✅ Created admin accounts');
                    // Create Talent Users
                    console.log('🎭 Creating Talent Users...');
                    _f = (_e = prisma.user).create;
                    _0 = {};
                    _1 = {
                        name: 'Alex Musician',
                        email: 'alex.musician@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 7: return [4 /*yield*/, _f.apply(_e, [(_0.data = (_1.password = _16.sent(),
                            _1.role = client_1.UserRole.TALENT,
                            _1.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _1.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _1.isActive = true,
                            _1.isEmailVerified = true,
                            _1.emailVerified = new Date(),
                            _1.TalentProfile = {
                                create: {
                                    bio: 'Professional musician with 8+ years of experience in live performances, studio recordings, and event entertainment.',
                                    tagline: 'Bringing your events to life with soulful music',
                                    category: 'Music & Entertainment',
                                    location: 'Nairobi',
                                    skills: ['Guitar', 'Piano', 'Vocals', 'Live Performance', 'Studio Recording'],
                                    experience: '8+ years',
                                    hourlyRate: 5000,
                                    averageRating: 4.8,
                                    totalReviews: 24,
                                    totalBookings: 45,
                                    phoneNumber: '+254712345001',
                                    website: 'https://alexmusician.com',
                                    mpesaPhoneNumber: '+254712345001',
                                    mpesaVerified: true,
                                }
                            },
                            _1),
                            _0.include = {
                                TalentProfile: true,
                            },
                            _0)])];
                case 8:
                    talent1 = _16.sent();
                    _h = (_g = prisma.user).create;
                    _2 = {};
                    _3 = {
                        name: 'Sarah Photography',
                        email: 'sarah.photo@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 9: return [4 /*yield*/, _h.apply(_g, [(_2.data = (_3.password = _16.sent(),
                            _3.role = client_1.UserRole.TALENT,
                            _3.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _3.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _3.isActive = true,
                            _3.isEmailVerified = true,
                            _3.emailVerified = new Date(),
                            _3.TalentProfile = {
                                create: {
                                    bio: 'Award-winning photographer specializing in weddings, corporate events, and portrait photography with a creative eye for detail.',
                                    tagline: 'Capturing your precious moments with artistic vision',
                                    category: 'Photography & Videography',
                                    location: 'Mombasa',
                                    skills: ['Wedding Photography', 'Event Photography', 'Portrait Photography', 'Photo Editing', 'Drone Photography'],
                                    experience: '6+ years',
                                    hourlyRate: 8000,
                                    averageRating: 4.9,
                                    totalReviews: 32,
                                    totalBookings: 67,
                                    phoneNumber: '+254712345002',
                                    website: 'https://sarahphotography.co.ke',
                                    mpesaPhoneNumber: '+254712345002',
                                    mpesaVerified: true,
                                }
                            },
                            _3),
                            _2.include = {
                                TalentProfile: true,
                            },
                            _2)])];
                case 10:
                    talent2 = _16.sent();
                    _k = (_j = prisma.user).create;
                    _4 = {};
                    _5 = {
                        name: 'Mike Event Planner',
                        email: 'mike.events@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 11: return [4 /*yield*/, _k.apply(_j, [(_4.data = (_5.password = _16.sent(),
                            _5.role = client_1.UserRole.TALENT,
                            _5.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _5.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _5.isActive = true,
                            _5.isEmailVerified = true,
                            _5.emailVerified = new Date(),
                            _5.TalentProfile = {
                                create: {
                                    bio: 'Experienced event planner specializing in corporate events, weddings, and private celebrations with attention to every detail.',
                                    tagline: 'Making your dream events a reality',
                                    category: 'Event Planning',
                                    location: 'Kisumu',
                                    skills: ['Event Coordination', 'Vendor Management', 'Budget Planning', 'Timeline Management', 'Venue Selection'],
                                    experience: '10+ years',
                                    hourlyRate: 6000,
                                    averageRating: 4.7,
                                    totalReviews: 18,
                                    totalBookings: 34,
                                    phoneNumber: '+254712345003',
                                    website: 'https://mikeevents.co.ke',
                                    mpesaPhoneNumber: '+254712345003',
                                    mpesaVerified: true,
                                }
                            },
                            _5),
                            _4.include = {
                                TalentProfile: true,
                            },
                            _4)])];
                case 12:
                    talent3 = _16.sent();
                    _m = (_l = prisma.user).create;
                    _6 = {};
                    _7 = {
                        name: 'Grace Catering',
                        email: 'grace.catering@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 13: return [4 /*yield*/, _m.apply(_l, [(_6.data = (_7.password = _16.sent(),
                            _7.role = client_1.UserRole.TALENT,
                            _7.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _7.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _7.isActive = true,
                            _7.isEmailVerified = true,
                            _7.emailVerified = new Date(),
                            _7.TalentProfile = {
                                create: {
                                    bio: 'Professional caterer offering both local Kenyan cuisine and international dishes for all types of events and celebrations.',
                                    tagline: 'Delicious food that brings people together',
                                    category: 'Catering & Food',
                                    location: 'Nakuru',
                                    skills: ['Kenyan Cuisine', 'International Cuisine', 'Event Catering', 'Menu Planning', 'Food Safety'],
                                    experience: '12+ years',
                                    hourlyRate: 4500,
                                    averageRating: 4.8,
                                    totalReviews: 41,
                                    totalBookings: 89,
                                    phoneNumber: '+254712345004',
                                    mpesaPhoneNumber: '+254712345004',
                                    mpesaVerified: true,
                                }
                            },
                            _7),
                            _6.include = {
                                TalentProfile: true,
                            },
                            _6)])];
                case 14:
                    talent4 = _16.sent();
                    _p = (_o = prisma.user).create;
                    _8 = {};
                    _9 = {
                        name: 'Pending Talent',
                        email: 'pending.talent@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 15: return [4 /*yield*/, _p.apply(_o, [(_8.data = (_9.password = _16.sent(),
                            _9.role = client_1.UserRole.TALENT,
                            _9.verificationStatus = client_1.VerificationStatus.PENDING,
                            _9.adminApprovalStatus = client_1.AdminApprovalStatus.PENDING,
                            _9.isActive = true,
                            _9.isEmailVerified = true,
                            _9.emailVerified = new Date(),
                            _9.TalentProfile = {
                                create: {
                                    bio: 'New DJ looking to provide entertainment services for events.',
                                    tagline: 'Fresh beats for your events',
                                    category: 'Music & Entertainment',
                                    location: 'Thika',
                                    skills: ['DJ Services', 'Music Mixing', 'Sound System'],
                                    experience: '2+ years',
                                    hourlyRate: 3500,
                                    phoneNumber: '+254712345007',
                                    mpesaPhoneNumber: '+254712345007',
                                    mpesaVerified: false,
                                }
                            },
                            _9),
                            _8)])];
                case 16:
                    pendingTalent = _16.sent();
                    _r = (_q = prisma.user).create;
                    _10 = {};
                    _11 = {
                        name: 'Rejected Talent',
                        email: 'rejected.talent@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 17: return [4 /*yield*/, _r.apply(_q, [(_10.data = (_11.password = _16.sent(),
                            _11.role = client_1.UserRole.TALENT,
                            _11.verificationStatus = client_1.VerificationStatus.REJECTED,
                            _11.adminApprovalStatus = client_1.AdminApprovalStatus.REJECTED,
                            _11.isActive = false,
                            _11.isEmailVerified = true,
                            _11.emailVerified = new Date(),
                            _11.TalentProfile = {
                                create: {
                                    bio: 'Videographer with basic equipment.',
                                    tagline: 'Basic video services',
                                    category: 'Photography & Videography',
                                    location: 'Malindi',
                                    skills: ['Basic Videography'],
                                    experience: '1 year',
                                    hourlyRate: 2000,
                                    phoneNumber: '+254712345008',
                                }
                            },
                            _11),
                            _10)])];
                case 18:
                    rejectedTalent = _16.sent();
                    console.log('✅ Created talent accounts');
                    // Create Organizer Users
                    console.log('🏢 Creating Organizer Users...');
                    _t = (_s = prisma.user).create;
                    _12 = {};
                    _13 = {
                        name: 'Corporate Events Kenya',
                        email: 'corporate@eventskenya.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('organizer123', 10)];
                case 19: return [4 /*yield*/, _t.apply(_s, [(_12.data = (_13.password = _16.sent(),
                            _13.role = client_1.UserRole.ORGANIZER,
                            _13.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _13.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _13.isActive = true,
                            _13.isEmailVerified = true,
                            _13.emailVerified = new Date(),
                            _13.OrganizerProfile = {
                                create: {
                                    companyName: 'Corporate Events Kenya Ltd',
                                    bio: 'Leading corporate event management company in Kenya, specializing in conferences, seminars, and corporate celebrations.',
                                    location: 'Nairobi',
                                    website: 'https://corporateeventskenya.com',
                                    phoneNumber: '+254712345010',
                                    eventTypes: ['Corporate Events', 'Conferences', 'Seminars', 'Product Launches'],
                                    totalEvents: 45,
                                    averageRating: 4.7,
                                }
                            },
                            _13),
                            _12)])];
                case 20:
                    organizer1 = _16.sent();
                    _v = (_u = prisma.user).create;
                    _14 = {};
                    _15 = {
                        name: 'Coastal Weddings',
                        email: 'info@coastalweddings.co.ke'
                    };
                    return [4 /*yield*/, bcrypt.hash('organizer123', 10)];
                case 21: return [4 /*yield*/, _v.apply(_u, [(_14.data = (_15.password = _16.sent(),
                            _15.role = client_1.UserRole.ORGANIZER,
                            _15.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _15.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _15.isActive = true,
                            _15.isEmailVerified = true,
                            _15.emailVerified = new Date(),
                            _15.OrganizerProfile = {
                                create: {
                                    companyName: 'Coastal Weddings & Events',
                                    bio: 'Mombasa-based wedding and event organizers specializing in beach weddings and destination events.',
                                    location: 'Mombasa',
                                    website: 'https://coastalweddings.co.ke',
                                    phoneNumber: '+254712345011',
                                    eventTypes: ['Weddings', 'Beach Events', 'Destination Events', 'Private Parties'],
                                    totalEvents: 67,
                                    averageRating: 4.9,
                                }
                            },
                            _15),
                            _14)])];
                case 22:
                    organizer2 = _16.sent();
                    console.log('✅ Created organizer accounts');
                    // Create Packages
                    console.log('📦 Creating Packages...');
                    return [4 /*yield*/, prisma.package.create({
                            data: {
                                talentId: talent1.TalentProfile.id,
                                title: 'Wedding Music Package',
                                description: 'Complete music entertainment for your wedding ceremony and reception including sound system, microphones, and playlist customization.',
                                category: 'Music & Entertainment',
                                location: 'Nairobi',
                                price: 35000,
                                duration: '6 hours',
                                features: ['Professional sound system', 'Wireless microphones', 'Custom playlist', 'MC services', '6-hour performance'],
                                coverImageUrl: 'https://static.wixstatic.com/media/c28ff8_05342b0daf6b456588d18c2f44dced95~mv2.jpg/v1/fill/w_640,h_428,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/c28ff8_05342b0daf6b456588d18c2f44dced95~mv2.jpg',
                                images: ['https://i.ytimg.com/vi/Avaa4_702eM/sddefault.jpg', 'https://i.pinimg.com/736x/47/c3/d4/47c3d4e9d57f674ff91ad09d47d80102.jpg'],
                                isPublished: true,
                                isActive: true,
                                viewCount: 45,
                                inquiryCount: 12,
                                bookingCount: 8,
                            },
                        })];
                case 23:
                    _16.sent();
                    return [4 /*yield*/, prisma.package.create({
                            data: {
                                talentId: talent2.TalentProfile.id,
                                title: 'Corporate Event Photography',
                                description: 'Professional photography coverage for corporate events, conferences, and business gatherings with same-day preview.',
                                category: 'Photography & Videography',
                                location: 'Mombasa',
                                price: 45000,
                                duration: '8 hours',
                                features: ['Professional photographer', 'High-resolution images', 'Same-day preview', 'Online gallery', 'Print-ready files'],
                                coverImageUrl: 'https://images.unsplash.com/photo-1560564029-6eb181a872c4?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW9tYmFzYXxlbnwwfHwwfHx8MA%3D%3D',
                                images: ['https://silvergumtype.com/wp-content/uploads/2024/04/james-nader-portfolio.jpg', 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?cs=srgb&dl=pexels-andre-furtado-43594-1264210.jpg&fm=jpg'],
                                isPublished: true,
                                isActive: true,
                                viewCount: 67,
                                inquiryCount: 18,
                                bookingCount: 12,
                            },
                        })];
                case 24:
                    _16.sent();
                    console.log('✅ Created packages');
                    // Create Events
                    console.log('📅 Creating Events...');
                    return [4 /*yield*/, prisma.event.create({
                            data: {
                                organizerId: organizer1.id,
                                title: 'Annual Corporate Gala 2025',
                                description: 'Join us for an elegant evening of networking, awards, and celebration at our annual corporate gala featuring keynote speakers and entertainment.',
                                category: ['Event Planning', 'Catering & Food', 'Music & Entertainment', 'Decoration & Design'],
                                location: 'Nairobi',
                                eventDate: new Date('2025-11-15T19:00:00'),
                                duration: 300,
                                requirements: 'Professional attire required. Must have experience with corporate events and ability to handle 200+ guests.',
                                budgetMin: 150000,
                                budgetMax: 300000,
                                status: client_1.EventStatus.PUBLISHED,
                                isPublic: true,
                                isActive: true,
                            },
                        })];
                case 25:
                    _16.sent();
                    return [4 /*yield*/, prisma.event.create({
                            data: {
                                organizerId: organizer2.id,
                                title: 'Beach Wedding Ceremony',
                                description: 'Romantic beach wedding ceremony and reception for 150 guests with ocean views, requiring coordination of multiple vendors.',
                                category: ['Decoration & Design', 'Photography & Videography', 'Catering & Food', 'Music & Entertainment'],
                                location: 'Mombasa',
                                eventDate: new Date('2025-12-10T15:00:00'),
                                duration: 480,
                                requirements: 'Experience with beach/outdoor events essential. Must coordinate with multiple vendors and handle weather contingencies.',
                                budgetMin: 250000,
                                budgetMax: 500000,
                                status: client_1.EventStatus.PUBLISHED,
                                isPublic: true,
                                isActive: true,
                            },
                        })];
                case 26:
                    _16.sent();
                    console.log('✅ Created events');
                    console.log('');
                    console.log('🎉 Seed completed successfully!');
                    console.log('');
                    console.log('📋 TEST ACCOUNT CREDENTIALS:');
                    console.log('='.repeat(80));
                    console.log('');
                    console.log('🔐 ADMIN ACCOUNTS:');
                    console.log('-'.repeat(40));
                    console.log('Email: admin@gigsec.com');
                    console.log('Password: admin123');
                    console.log('Name: Super Admin');
                    console.log('Status: APPROVED | VERIFIED');
                    console.log('');
                    console.log('Email: manager@gigsec.com');
                    console.log('Password: manager123');
                    console.log('Name: Platform Manager');
                    console.log('Status: APPROVED | VERIFIED');
                    console.log('');
                    console.log('🎭 TALENT ACCOUNTS:');
                    console.log('-'.repeat(40));
                    console.log('Email: alex.musician@test.com');
                    console.log('Password: talent123');
                    console.log('Name: Alex Musician');
                    console.log('Category: Music & Entertainment');
                    console.log('Location: Nairobi');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: sarah.photo@test.com');
                    console.log('Password: talent123');
                    console.log('Name: Sarah Photography');
                    console.log('Category: Photography & Videography');
                    console.log('Location: Mombasa');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: mike.events@test.com');
                    console.log('Password: talent123');
                    console.log('Name: Mike Event Planner');
                    console.log('Category: Event Planning');
                    console.log('Location: Kisumu');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: grace.catering@test.com');
                    console.log('Password: talent123');
                    console.log('Name: Grace Catering');
                    console.log('Category: Catering & Food');
                    console.log('Location: Nakuru');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: pending.talent@test.com');
                    console.log('Password: talent123');
                    console.log('Name: Pending Talent');
                    console.log('Category: Music & Entertainment');
                    console.log('Location: Thika');
                    console.log('Status: PENDING | PENDING | Active');
                    console.log('');
                    console.log('Email: rejected.talent@test.com');
                    console.log('Password: talent123');
                    console.log('Name: Rejected Talent');
                    console.log('Category: Photography & Videography');
                    console.log('Location: Malindi');
                    console.log('Status: REJECTED | REJECTED | Inactive');
                    console.log('');
                    console.log('🏢 ORGANIZER ACCOUNTS:');
                    console.log('-'.repeat(40));
                    console.log('Email: corporate@eventskenya.com');
                    console.log('Password: organizer123');
                    console.log('Name: Corporate Events Kenya');
                    console.log('Company: Corporate Events Kenya Ltd');
                    console.log('Location: Nairobi');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: info@coastalweddings.co.ke');
                    console.log('Password: organizer123');
                    console.log('Name: Coastal Weddings');
                    console.log('Company: Coastal Weddings & Events');
                    console.log('Location: Mombasa');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('='.repeat(80));
                    console.log('');
                    console.log('📊 SUMMARY:');
                    console.log('Total Users Created: 8');
                    console.log('- Admins: 2');
                    console.log('- Talents: 4 (2 approved, 1 pending, 1 rejected)');
                    console.log('- Organizers: 2');
                    console.log('Packages Created: 2');
                    console.log('Events Created: 2');
                    console.log('');
                    console.log('🎯 Test Coverage:');
                    console.log('- Different user roles (Admin, Talent, Organizer)');
                    console.log('- Various approval statuses (Pending, Approved, Rejected)');
                    console.log('- Different verification states (Verified, Pending, Rejected)');
                    console.log('- Active and inactive accounts');
                    console.log('- Multiple talent categories and locations');
                    console.log('- Sample packages and events for testing');
                    console.log('');
                    console.log('✨ Ready for comprehensive testing!');
                    return [3 /*break*/, 28];
                case 27:
                    error_1 = _16.sent();
                    console.error('❌ Error during seed process:', error_1);
                    throw error_1;
                case 28: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('💥 Seed process failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
