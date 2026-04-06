import { Request, Response, NextFunction } from 'express';
import { Profile } from '../models/Profile';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    // Fetch the full User document (with avatarUrl, isOnline) alongside the Profile
    const [profile, userDoc] = await Promise.all([
      Profile.findOne({ user: authReq.user._id }).populate('user', 'firstName lastName email role avatarUrl isOnline createdAt'),
      User.findById(authReq.user._id).select('-password')
    ]);

    if (!profile) {
      // Return at least user doc if profile doesn't exist yet
      if (userDoc) {
        res.json({ user: userDoc });
        return;
      }
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    // Merge avatarUrl and isOnline from the User document into the response
    const profileObj = profile.toObject() as any;
    if (userDoc) {
      if (profileObj.user && typeof profileObj.user === 'object') {
        profileObj.user.avatarUrl = (userDoc as any).avatarUrl;
        profileObj.user.isOnline = (userDoc as any).isOnline;
      }
      profileObj.avatarUrl = (userDoc as any).avatarUrl;
    }

    res.json(profileObj);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const { bio, title, company, website, location, socialLinks, preferences, history } = req.body;

    let profile = await Profile.findOne({ user: authReq.user._id });

    if (!profile) {
      profile = new Profile({ user: authReq.user._id });
    }

    profile.bio = bio !== undefined ? bio : profile.bio;
    profile.title = title !== undefined ? title : profile.title;
    profile.company = company !== undefined ? company : profile.company;
    profile.website = website !== undefined ? website : profile.website;
    profile.location = location !== undefined ? location : profile.location;
    if (socialLinks) {
       profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
    }
    if (preferences) profile.preferences = preferences;
    profile.history = history !== undefined ? history : profile.history;

    const updatedProfile = await profile.save();
    
    // send back with populated user
    const populatedProfile = await Profile.findById(updatedProfile._id).populate('user', 'firstName lastName email role');

    res.json(populatedProfile);
  } catch (error) {
    next(error);
  }
};

export const updateMyAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image uploaded' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    // The avatarUrl legally exists directly on User model not Profile
    const updatedUser = await User.findByIdAndUpdate(
      authReq.user._id,
      { avatarUrl: fileUrl },
      { new: true }
    ).select('-password');

    res.json({ message: 'Avatar updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const getInvestors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profiles = await Profile.find().populate({
      path: 'user',
      match: { role: 'investor' },
      select: 'firstName lastName email role avatarUrl isOnline'
    });
    // Filter out profiles where user is null (i.e., not an investor)
    const investors = profiles.filter(p => p.user !== null);
    
    // Map to a flatter format matching the frontend expectations
    const formatted = investors.map((p: any) => ({
      id: p.user._id,
      name: `${p.user.firstName} ${p.user.lastName}`,
      bio: p.bio,
      investmentStage: p.preferences?.investmentStage || [],
      investmentInterests: p.preferences?.industries || [],
      minimumInvestment: p.preferences?.minInvestment || 'N/A',
      maximumInvestment: p.preferences?.maxInvestment || 'N/A',
      totalInvestments: p.preferences?.totalInvestments || 0,
      portfolioCompanies: p.preferences?.portfolioCompanies || [],
      location: p.location,
      isOnline: p.user.isOnline || false,
      // Use real avatarUrl from User model, fall back to ui-avatars
      avatarUrl: p.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user.firstName + ' ' + p.user.lastName)}&background=random`
    }));
    
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getEntrepreneurs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profiles = await Profile.find().populate({
      path: 'user',
      match: { role: 'entrepreneur' },
      select: 'firstName lastName email role avatarUrl isOnline createdAt'
    });
    // Filter out profiles where user is null (i.e., not an entrepreneur)
    const entrepreneurs = profiles.filter(p => p.user !== null);
    
    // Map to a flatter format matching the frontend expectations
    const formatted = entrepreneurs.map((p: any) => ({
      id: p.user._id,
      name: `${p.user.firstName} ${p.user.lastName}`,
      startupName: p.company || 'Startup',
      industry: (p.preferences?.industries && p.preferences.industries[0]) || 'Technology',
      pitchSummary: p.bio || 'We are building the future.',
      fundingNeeded: p.preferences?.fundingNeeded || '$1M - $5M',
      teamSize: p.preferences?.teamSize || 1,
      foundedYear: p.preferences?.foundedYear || new Date(p.user.createdAt || Date.now()).getFullYear(),
      location: p.location || 'Remote',
      isOnline: p.user.isOnline || false,
      // Use real avatarUrl from User model, fall back to ui-avatars
      avatarUrl: p.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user.firstName + ' ' + p.user.lastName)}&background=random`
    }));
    
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    // Also fetch their profile for extra info
    const profile = await Profile.findOne({ user: user._id });
    res.json({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatarUrl: (user as any).avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=random`,
      isOnline: (user as any).isOnline || false,
      bio: profile?.bio || '',
      location: profile?.location || '',
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};
