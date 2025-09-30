import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { withSecurity } from '@/lib/security/middleware'
import { userInputSchemas, validateInput } from '@/lib/security/validation'
import { sanitizeUserInput, sanitizeFileName } from '@/lib/security/sanitization'
import { secureFileUpload, uploadConfigs } from '@/lib/security/fileUpload'

export const dynamic = 'force-dynamic'

// GET request handler to fetch the user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        TalentProfile: {
          include: {
            File: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If a talent user exists but has no profile yet, this will create one.
    if (!user.TalentProfile) {
      await prisma.talentProfile.create({
        data: {
          userId: session.user.id,
        }
      });
      // Re-fetch the user to include the newly created profile
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          TalentProfile: {
            include: {
              File: true
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// This is a placeholder for a real cloud storage upload function.
// In a real app, you would use a service like AWS S3, Cloudinary, or Google Cloud Storage.
async function uploadToCloudStorage(file: File): Promise<string> {
  // 1. Get file buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;

  // 2. THIS IS FOR LOCAL DEVELOPMENT ONLY.
  // It saves the file to the local `public` directory.
  // This approach is NOT suitable for production on platforms like Vercel.
  const uploadDir = path.join(process.cwd(), 'public/uploads/profile-images');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  
  // 3. In production, you would upload the buffer to your cloud service here
  // and get a permanent URL back.
  // Example: const cloudUrl = await someCloudSdk.upload(buffer, { filename });
  
  // 4. For now, we return the local path.
  return `/uploads/profile-images/${filename}`;
}


// PUT request handler to update the profile, including image upload
const putHandler = async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.TALENT) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const profileDataString = formData.get('profileData') as string;
    const profileImageFile = formData.get('profileImage') as File | null;

    if (!profileDataString) {
      return NextResponse.json({ error: 'Profile data is missing' }, { status: 400 });
    }
    
    let profileData;
    try {
      profileData = JSON.parse(profileDataString);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid profile data format' }, { status: 400 });
    }

    // Validate and sanitize profile data
    try {
      profileData = validateInput(userInputSchemas.profile, profileData);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sanitize all string inputs
    profileData = sanitizeUserInput(profileData);
    const { name, ...talentProfileData } = profileData;

    let imageUrl: string | undefined = undefined;

    // Handle the file upload if a new profile image is provided
    if (profileImageFile) {
      try {
        const uploadResult = await secureFileUpload(
          profileImageFile,
          uploadConfigs.profileImages,
          session.user.id
        );
        imageUrl = uploadResult.fileUrl;
      } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : 'File upload failed' 
        }, { status: 400 });
      }
    }

    // Use a database transaction to update both the User and TalentProfile models together
    const [, talentProfileUpdateResult] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: name,
          ...(imageUrl && { image: imageUrl }), // Only update the image URL if a new one was uploaded
        },
      }),
      prisma.talentProfile.update({
        where: { userId: session.user.id },
        data: {
          ...talentProfileData,
          skills: { set: talentProfileData.skills || [] },
          pastClients: { set: talentProfileData.pastClients || [] },
          hourlyRate: talentProfileData.hourlyRate ? parseFloat(talentProfileData.hourlyRate) : null,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: talentProfileUpdateResult });
  } catch (error) {
    console.error('Profile update error:', error);
    // Provide a more specific error message if the username is already taken
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
         return NextResponse.json({ error: 'Username is already taken. Please choose another one.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = withSecurity({
  rateLimit: { requests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 minutes
  sanitizeInput: true,
  allowedMethods: ['PUT']
})(putHandler);

