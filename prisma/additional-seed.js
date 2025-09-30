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
        var talent5, _a, _b, talent6, _c, _d, unverifiedTalent, _e, _f, organizer3, _g, _h, pendingOrganizer, _j, _k, inactiveOrganizer, _l, _m, error_1;
        var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
        return __generator(this, function (_0) {
            switch (_0.label) {
                case 0:
                    console.log('🚀 Adding additional test accounts...');
                    _0.label = 1;
                case 1:
                    _0.trys.push([1, 16, , 17]);
                    _b = (_a = prisma.user).create;
                    _o = {};
                    _p = {
                        name: 'David Decorator',
                        email: 'david.decor@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 2: return [4 /*yield*/, _b.apply(_a, [(_o.data = (_p.password = _0.sent(),
                            _p.role = client_1.UserRole.TALENT,
                            _p.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _p.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _p.isActive = true,
                            _p.isEmailVerified = true,
                            _p.emailVerified = new Date(),
                            _p.TalentProfile = {
                                create: {
                                    bio: 'Creative event decorator and designer specializing in transforming spaces into memorable experiences for any occasion.',
                                    tagline: 'Transforming spaces, creating memories',
                                    category: 'Decoration & Design',
                                    location: 'Eldoret',
                                    skills: ['Event Decoration', 'Floral Arrangements', 'Lighting Design', 'Theme Development', 'Space Planning'],
                                    experience: '7+ years',
                                    hourlyRate: 5500,
                                    averageRating: 4.6,
                                    totalReviews: 15,
                                    totalBookings: 28,
                                    phoneNumber: '+254712345005',
                                    mpesaPhoneNumber: '+254712345005',
                                    mpesaVerified: false,
                                }
                            },
                            _p),
                            _o.include = {
                                TalentProfile: true,
                            },
                            _o)])];
                case 3:
                    talent5 = _0.sent();
                    _d = (_c = prisma.user).create;
                    _q = {};
                    _r = {
                        name: 'James Security',
                        email: 'james.security@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 4: return [4 /*yield*/, _d.apply(_c, [(_q.data = (_r.password = _0.sent(),
                            _r.role = client_1.UserRole.TALENT,
                            _r.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _r.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _r.isActive = true,
                            _r.isEmailVerified = true,
                            _r.emailVerified = new Date(),
                            _r.TalentProfile = {
                                create: {
                                    bio: 'Professional security services provider with trained personnel for events of all sizes, ensuring safety and peace of mind.',
                                    tagline: 'Your safety is our priority',
                                    category: 'Security & Safety',
                                    location: 'Nairobi',
                                    skills: ['Event Security', 'Crowd Control', 'VIP Protection', 'Emergency Response', 'Risk Assessment'],
                                    experience: '15+ years',
                                    hourlyRate: 3000,
                                    averageRating: 4.9,
                                    totalReviews: 22,
                                    totalBookings: 56,
                                    phoneNumber: '+254712345006',
                                    mpesaPhoneNumber: '+254712345006',
                                    mpesaVerified: true,
                                }
                            },
                            _r),
                            _q.include = {
                                TalentProfile: true,
                            },
                            _q)])];
                case 5:
                    talent6 = _0.sent();
                    _f = (_e = prisma.user).create;
                    _s = {};
                    _t = {
                        name: 'Unverified Talent',
                        email: 'unverified.talent@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('talent123', 10)];
                case 6: return [4 /*yield*/, _f.apply(_e, [(_s.data = (_t.password = _0.sent(),
                            _t.role = client_1.UserRole.TALENT,
                            _t.verificationStatus = client_1.VerificationStatus.UNVERIFIED,
                            _t.adminApprovalStatus = client_1.AdminApprovalStatus.PENDING,
                            _t.isActive = true,
                            _t.isEmailVerified = false,
                            _t.TalentProfile = {
                                create: {
                                    bio: 'Transportation service provider for events.',
                                    tagline: 'Reliable transport solutions',
                                    category: 'Transportation',
                                    location: 'Kitale',
                                    skills: ['Event Transportation', 'Logistics'],
                                    experience: '3+ years',
                                    hourlyRate: 2500,
                                    phoneNumber: '+254712345009',
                                }
                            },
                            _t),
                            _s)])];
                case 7:
                    unverifiedTalent = _0.sent();
                    _h = (_g = prisma.user).create;
                    _u = {};
                    _v = {
                        name: 'John Personal Organizer',
                        email: 'john.organizer@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('organizer123', 10)];
                case 8: return [4 /*yield*/, _h.apply(_g, [(_u.data = (_v.password = _0.sent(),
                            _v.role = client_1.UserRole.ORGANIZER,
                            _v.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _v.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _v.isActive = true,
                            _v.isEmailVerified = true,
                            _v.emailVerified = new Date(),
                            _v.OrganizerProfile = {
                                create: {
                                    bio: 'Individual event organizer specializing in private parties and small gatherings.',
                                    location: 'Kisumu',
                                    phoneNumber: '+254712345012',
                                    eventTypes: ['Private Parties', 'Birthday Parties', 'Small Gatherings'],
                                    totalEvents: 23,
                                    averageRating: 4.5,
                                }
                            },
                            _v),
                            _u)])];
                case 9:
                    organizer3 = _0.sent();
                    _k = (_j = prisma.user).create;
                    _w = {};
                    _x = {
                        name: 'Pending Organizer',
                        email: 'pending.organizer@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('organizer123', 10)];
                case 10: return [4 /*yield*/, _k.apply(_j, [(_w.data = (_x.password = _0.sent(),
                            _x.role = client_1.UserRole.ORGANIZER,
                            _x.verificationStatus = client_1.VerificationStatus.PENDING,
                            _x.adminApprovalStatus = client_1.AdminApprovalStatus.PENDING,
                            _x.isActive = true,
                            _x.isEmailVerified = true,
                            _x.emailVerified = new Date(),
                            _x.OrganizerProfile = {
                                create: {
                                    companyName: 'New Events Company',
                                    bio: 'Newly established event management company.',
                                    location: 'Garissa',
                                    phoneNumber: '+254712345013',
                                    eventTypes: ['General Events'],
                                    totalEvents: 0,
                                }
                            },
                            _x),
                            _w)])];
                case 11:
                    pendingOrganizer = _0.sent();
                    _m = (_l = prisma.user).create;
                    _y = {};
                    _z = {
                        name: 'Inactive Organizer',
                        email: 'inactive.organizer@test.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('organizer123', 10)];
                case 12: return [4 /*yield*/, _m.apply(_l, [(_y.data = (_z.password = _0.sent(),
                            _z.role = client_1.UserRole.ORGANIZER,
                            _z.verificationStatus = client_1.VerificationStatus.VERIFIED,
                            _z.adminApprovalStatus = client_1.AdminApprovalStatus.APPROVED,
                            _z.isActive = false,
                            _z.isEmailVerified = true,
                            _z.emailVerified = new Date(),
                            _z.OrganizerProfile = {
                                create: {
                                    bio: 'Temporarily inactive event organizer.',
                                    location: 'Kakamega',
                                    phoneNumber: '+254712345014',
                                    eventTypes: ['Various Events'],
                                    totalEvents: 12,
                                    averageRating: 4.2,
                                }
                            },
                            _z),
                            _y)])];
                case 13:
                    inactiveOrganizer = _0.sent();
                    // Create additional packages
                    return [4 /*yield*/, prisma.package.create({
                            data: {
                                talentId: talent5.TalentProfile.id,
                                title: 'Event Decoration & Setup',
                                description: 'Complete event decoration and setup service including theme development, floral arrangements, and lighting design.',
                                category: 'Decoration & Design',
                                location: 'Eldoret',
                                price: 55000,
                                duration: '8 hours',
                                features: ['Theme development', 'Floral arrangements', 'Lighting design', 'Table decorations', 'Setup and breakdown'],
                                coverImageUrl: 'https://www.reveriesocial.com/wp-content/uploads/2024/01/2024-EVENT-TRENDS-HERO.webp',
                                images: ['https://images.pexels.com/photos/26673721/pexels-photo-26673721.jpeg?cs=srgb&dl=pexels-mibernaa-26673721.jpg&fm=jpg', 'https://curatedevents.com/wp-content/uploads/2025/02/aa2a92e5-7729-455b-94bb-c9c9519b2cf6-scaled-1.webp'],
                                isPublished: true,
                                isActive: true,
                                viewCount: 32,
                                inquiryCount: 8,
                                bookingCount: 5,
                            },
                        })];
                case 14:
                    // Create additional packages
                    _0.sent();
                    return [4 /*yield*/, prisma.package.create({
                            data: {
                                talentId: talent6.TalentProfile.id,
                                title: 'Event Security Service',
                                description: 'Professional security service for events including trained personnel, crowd control, and emergency response capabilities.',
                                category: 'Security & Safety',
                                location: 'Nairobi',
                                price: 25000,
                                duration: '8 hours',
                                features: ['Trained security personnel', 'Crowd control', 'Emergency response', 'VIP protection', '24/7 monitoring'],
                                coverImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Seal_of_U.S._Department_of_State_Diplomatic_Security.svg/1200px-Seal_of_U.S._Department_of_State_Diplomatic_Security.svg.png',
                                images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/UN_security_COP26.jpg/960px-UN_security_COP26.jpg', 'https://upload.wikimedia.org/wikipedia/commons/6/6a/UN_security_COP26.jpg'],
                                isPublished: true,
                                isActive: true,
                                viewCount: 28,
                                inquiryCount: 6,
                                bookingCount: 4,
                            },
                        })];
                case 15:
                    _0.sent();
                    console.log('✅ Additional accounts created successfully!');
                    console.log('');
                    console.log('📋 ADDITIONAL TEST ACCOUNTS:');
                    console.log('='.repeat(50));
                    console.log('');
                    console.log('🎭 ADDITIONAL TALENT ACCOUNTS:');
                    console.log('-'.repeat(30));
                    console.log('Email: david.decor@test.com');
                    console.log('Password: talent123');
                    console.log('Name: David Decorator');
                    console.log('Category: Decoration & Design');
                    console.log('Location: Eldoret');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: james.security@test.com');
                    console.log('Password: talent123');
                    console.log('Name: James Security');
                    console.log('Category: Security & Safety');
                    console.log('Location: Nairobi');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: unverified.talent@test.com');
                    console.log('Password: talent123');
                    console.log('Name: Unverified Talent');
                    console.log('Category: Transportation');
                    console.log('Location: Kitale');
                    console.log('Status: PENDING | UNVERIFIED | Active | Email NOT Verified');
                    console.log('');
                    console.log('🏢 ADDITIONAL ORGANIZER ACCOUNTS:');
                    console.log('-'.repeat(30));
                    console.log('Email: john.organizer@test.com');
                    console.log('Password: organizer123');
                    console.log('Name: John Personal Organizer');
                    console.log('Company: Individual');
                    console.log('Location: Kisumu');
                    console.log('Status: APPROVED | VERIFIED | Active');
                    console.log('');
                    console.log('Email: pending.organizer@test.com');
                    console.log('Password: organizer123');
                    console.log('Name: Pending Organizer');
                    console.log('Company: New Events Company');
                    console.log('Location: Garissa');
                    console.log('Status: PENDING | PENDING | Active');
                    console.log('');
                    console.log('Email: inactive.organizer@test.com');
                    console.log('Password: organizer123');
                    console.log('Name: Inactive Organizer');
                    console.log('Company: Individual');
                    console.log('Location: Kakamega');
                    console.log('Status: APPROVED | VERIFIED | INACTIVE');
                    console.log('');
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _0.sent();
                    console.error('❌ Error creating additional accounts:', error_1);
                    throw error_1;
                case 17: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('💥 Additional seed process failed:', e);
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
