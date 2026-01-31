import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { auth, db } from './services/firebase';
import { User, Item, BORDERS, Rating } from './types';
import { hasPermission, PERMISSIONS, canEditItem, ROLES } from './services/permissions';
import DownloadButton from './components/DownloadButton';
import { SkeletonCard } from './components/SkeletonCard';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { SmartImage } from './components/SmartImage';
import { 
  Search, Menu, X, Upload, LogOut, 
  Trash2, Edit, Play, 
  ChevronLeft, ChevronRight, Settings, Hash, UserPlus, LogIn, Star,
  Shield, Users, Ban, MicOff, Award,
  ChevronDown, Check, Filter, SortAsc, Loader2, RefreshCw, LayoutDashboard, Wrench,
  Home, Map, Box, Palette, Zap, Image as ImageIcon, FileText, MoreVertical, AlertTriangle
} from 'lucide-react';

// --- ASSETS ---
const ASSETS = {
  TITLE: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/title.png',
  NO_PFP: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/nopfp.png',
  ICON_DC: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/dc.png',
  ICON_YT: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/yt.png',
  ICON_WA: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/wa.png',
};

// --- HELPER FUNCTIONS ---

const calculateAvgRating = (ratings?: Record<string, Rating>) => {
  if (!ratings) return 0;
  const list = Object.values(ratings);
  if (list.length === 0) return 0;
  return list.reduce((acc, r) => acc + (r.rating || 0), 0) / list.length;
};

const renderProfilePic = (user: User, className: string) => {
  const isCustom = user.profileBorder === 'custom';
  const border = BORDERS[user.profileBorder || 'default'];
  
  return (
    <div 
      className={`relative rounded-full flex-shrink-0 transition-all duration-300 ${!isCustom ? 'p-[2px] ' + (border?.class || 'border-2 border-[#2d2d3a]') : ''} ${className}`}
      style={isCustom ? { 
        padding: '2px',
        borderStyle: 'solid', 
        borderColor: user.customColor || '#ffffff',
        borderWidth: `${user.customBorderWidth || 2}px`,
        boxShadow: user.customColor ? `0 0 15px ${user.customColor}40` : 'none'
      } : {}}
    >
      <SmartImage 
        src={user.profilePic || ASSETS.NO_PFP} 
        width={200}
        className="w-full h-full rounded-full bg-bg-card object-cover" 
        alt={user.username || 'User'} 
      />
    </div>
  );
};

// --- COMPONENTS ---

// 1. User Avatar with caching
const userCache: Record<string, User> = {};
const UserAvatar: React.FC<{ userId: string; className?: string; onClick?: () => void }> = ({ userId, className, onClick }) => {
  const [user, setUser] = useState<User | null>(userCache[userId] || null);

  useEffect(() => {
    if (user) return;
    if (userCache[userId]) {
      setUser(userCache[userId]);
      return;
    }
    db.ref(`users/${userId}`).once('value').then((snap: any) => {
      const val = snap.val();
      if (val) {
        userCache[userId] = val;
        setUser(val);
      }
    });
  }, [userId, user]);

  const border = BORDERS[user?.profileBorder || 'default'];
  const isCustom = user?.profileBorder === 'custom';
  
  return (
    <div 
      className={`relative rounded-full flex-shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer ${className || 'w-10 h-10'} ${!isCustom ? 'p-[2px] ' + (border?.class || 'border-2 border-[#2d2d3a]') : ''}`}
      onClick={onClick}
      style={isCustom ? { 
        padding: '2px',
        borderStyle: 'solid', 
        borderColor: user?.customColor || '#ffffff',
        borderWidth: `${user?.customBorderWidth || 2}px`,
        boxShadow: user?.customColor ? `0 0 10px ${user.customColor}40` : 'none'
      } : {}}
    >
      <SmartImage 
        src={user?.profilePic || ASSETS.NO_PFP} 
        width={100}
        className="w-full h-full rounded-full bg-bg-card object-cover" 
        alt={user?.username || 'User'} 
      />
    </div>
  );
};

// 2. Custom Dropdown
interface DropdownOption {
  label: string;
  value: string;
}
const CustomDropdown: React.FC<{
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  icon?: React.ElementType;
  className?: string;
  isCompact?: boolean;
}> = ({ options, value, onChange, icon: Icon, className, isCompact }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 border transition-all text-sm font-medium shadow-sm active:scale-95 duration-200 ${
          isCompact 
          ? 'bg-transparent border-transparent hover:bg-white/10 text-white px-3 py-2 rounded-full' 
          : 'bg-[#1a1a1e] border-white/10 hover:border-white/20 hover:bg-white/5 text-white px-4 py-3 rounded-xl'
        }`}
      >
        <div className="flex items-center gap-2 max-w-[80%]">
           {Icon && <Icon size={16} className="text-gray-400 flex-shrink-0" />}
           {!isCompact && <span className="truncate">{selectedLabel}</span>}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div 
        className={`absolute top-full right-0 mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 transition-all duration-200 origin-top transform min-w-[200px] ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
      >
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${value === option.value ? 'bg-primary/20 text-primary-light font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="truncate pr-2">{option.label}</span>
              {value === option.value && <Check size={14} className="text-primary-light flex-shrink-0"/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  
  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastLoadedKeyRef = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [users, setUsers] = useState<Record<string, User>>({}); 
  const [categories, setCategories] = useState<string[]>(['Add-On', 'Map', 'Texture Pack', 'Skins', 'Shaders']);
  const [viewProfileUser, setViewProfileUser] = useState<User | null>(null);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Admin UI State
  const [adminTab, setAdminTab] = useState<'users' | 'content'>('users');
  const [adminSearch, setAdminSearch] = useState('');

  // Search Animation State
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [overflowVisible, setOverflowVisible] = useState(false); // New state to handle dropdown clipping
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Modals
  const [activeModal, setActiveModal] = useState<'upload' | 'detail' | 'profile' | 'editProfile' | 'category' | 'admin' | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Forms
  const [uploadForm, setUploadForm] = useState<Partial<Item>>({});
  const [editProfileForm, setEditProfileForm] = useState<Partial<User>>({});
  
  const [slideIndex, setSlideIndex] = useState(0);
  const autoScrollRef = useRef<any>(null);

  // Focus Management for Search
  useEffect(() => {
    if (isSearchExpanded) {
        // Switch overflow to visible after animation completes to allow dropdowns to show
        const overflowTimer = setTimeout(() => {
            setOverflowVisible(true);
        }, 500);

        const focusTimer = setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 300); 

        return () => {
            clearTimeout(focusTimer);
            clearTimeout(overflowTimer);
        };
    } else {
        setOverflowVisible(false);
    }
  }, [isSearchExpanded]);

  // Click Outside for Search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
         setIsSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialization
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (u: any) => {
      setCurrentUser(u);
      if (u) {
        const userRef = db.ref(`users/${u.uid}`);
        userRef.on('value', async (snapshot: any) => {
          let val = snapshot.val();
          if (!val) {
             const newProfile = {
                username: u.email?.split('@')[0] || 'User',
                role: 'user',
                banned: false,
                muted: false,
                profilePic: ASSETS.NO_PFP,
                profileBorder: 'default',
                createdAt: Date.now()
             };
             try {
                await userRef.set(newProfile);
                val = newProfile;
             } catch (err) {}
          }
          if (val?.banned) {
            auth.signOut();
            setAuthError("Account banned.");
            return;
          }
          setUserData(val);
          if (val) userCache[u.uid] = val; 
        });
      } else {
        setUserData(null);
      }
    });

    db.ref('categories').on('value', (snapshot: any) => {
      if (snapshot.exists()) setCategories(snapshot.val());
    });
    
    fetchItems(true);
    return () => unsubAuth();
  }, []);

  // Database Pagination
  const ITEMS_PER_PAGE = 12;

  const fetchItems = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setHasMore(true);
      lastLoadedKeyRef.current = null;
    } else {
      setLoadingMore(true);
    }

    try {
      let ref = db.ref('items').orderByKey();
      const currentKey = lastLoadedKeyRef.current;
      
      if (!reset && currentKey) {
        ref = ref.endAt(currentKey).limitToLast(ITEMS_PER_PAGE + 1);
      } else {
        ref = ref.limitToLast(ITEMS_PER_PAGE);
      }
      
      const snapshot = await ref.once('value');
      const rawList: Item[] = [];
      snapshot.forEach((child: any) => {
         rawList.push({ id: child.key, ...child.val() });
      });

      if (!reset && currentKey) {
          if (rawList.length > 0 && rawList[rawList.length - 1].id === currentKey) {
              rawList.pop();
          }
      }

      const itemsArr = rawList.reverse();
      if (itemsArr.length < ITEMS_PER_PAGE) setHasMore(false);
      
      if (itemsArr.length > 0) {
        lastLoadedKeyRef.current = itemsArr[itemsArr.length - 1].id;
      } else {
        setHasMore(false);
      }

      if (reset) {
        setItems(itemsArr);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          return [...prev, ...itemsArr.filter(i => !existingIds.has(i.id))];
        });
      }
    } catch (err) {
      console.warn("Pagination warning:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Admin & Profile Data Loading
  useEffect(() => {
    if (activeModal === 'admin' && hasPermission(userData, PERMISSIONS.VIEW_ADMIN_DASHBOARD)) {
       const ref = db.ref('users');
       const listener = ref.on('value', (snapshot: any) => {
         setUsers(snapshot.val() || {});
       });
       return () => ref.off('value', listener);
    }
  }, [activeModal, userData]);

  useEffect(() => {
    if (activeModal === 'profile' && selectedProfileId) {
       if (userCache[selectedProfileId]) {
         setViewProfileUser(userCache[selectedProfileId]);
       } else {
         db.ref(`users/${selectedProfileId}`).once('value').then((snap: any) => {
           const val = snap.val();
           if (val) {
             userCache[selectedProfileId] = val;
             setViewProfileUser(val);
           }
         });
       }
    } else {
      setViewProfileUser(null);
    }
  }, [activeModal, selectedProfileId]);

  // Gallery Auto Scroll
  useEffect(() => {
    if (activeModal === 'detail' && selectedItem) {
      const totalSlides = (selectedItem.gallery?.length || 0) > 0 ? selectedItem.gallery!.length : 1;
      if (totalSlides > 1) {
        autoScrollRef.current = setInterval(() => {
          setSlideIndex((prev) => (prev + 1) % totalSlides);
        }, 4000);
      }
    }
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [activeModal, selectedItem]);

  // --- ACTIONS ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const trimmedUser = authEmail.trim();
    if (trimmedUser.length < 3) {
      setAuthError("Username too short.");
      setAuthLoading(false);
      return;
    }
    const isEmail = trimmedUser.includes('@');
    if (isEmail) {
        setAuthError("Please use a username.");
        setAuthLoading(false);
        return;
    }
    const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validUsernameRegex.test(trimmedUser)) {
       setAuthError("Invalid characters in username.");
       setAuthLoading(false);
       return;
    }
    if (authPass.length < 6) {
      setAuthError("Password must be 6+ chars.");
      setAuthLoading(false);
      return;
    }

    const email = `${trimmedUser}@vcm.com`;
    
    try {
      if (authMode === 'register') {
        const cred = await auth.createUserWithEmailAndPassword(email, authPass);
        if (cred.user) {
          await db.ref(`users/${cred.user.uid}`).set({
            username: trimmedUser,
            role: 'user',
            banned: false,
            muted: false,
            profilePic: ASSETS.NO_PFP,
            profileBorder: 'default',
            createdAt: Date.now()
          });
        }
      } else {
        await auth.signInWithEmailAndPassword(email, authPass);
      }
      setSidebarOpen(false);
      setAuthEmail('');
      setAuthPass('');
    } catch (err: any) {
      console.error("Auth failed:", err);
      const code = err.code;
      if (code === 'auth/email-already-in-use') setAuthError("Username taken.");
      else if (code.includes('invalid') || code.includes('user-not-found') || code.includes('wrong-password')) setAuthError("Invalid username or password.");
      else setAuthError("Auth failed. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;
    if (userData.muted) return alert("You are muted.");

    const isEdit = !!uploadForm.id;
    const timestamp = Date.now();
    
    const payload: Partial<Item> = {
      title: uploadForm.title,
      desc: uploadForm.desc,
      cat: uploadForm.cat,
      link: uploadForm.link,
      youtube: uploadForm.youtube || '',
      originalCreator: uploadForm.originalCreator || '',
      img: uploadForm.img,
      gallery: uploadForm.gallery || [],
    };

    if (isEdit) {
      const originalItem = items.find(i => i.id === uploadForm.id);
      if (!originalItem) return;
      if (!canEditItem(userData, currentUser.uid, originalItem.authorId)) return alert("Permission denied.");

      const newChangelog = [...(originalItem.changelog || [])];
      newChangelog.push({ version: 'Update', text: 'Updated details', timestamp });

      await db.ref(`items/${uploadForm.id}`).update({ ...payload, changelog: newChangelog });
      setItems(prev => prev.map(i => i.id === uploadForm.id ? { ...i, ...payload } : i));
    } else {
      const newItemRef = db.ref('items').push();
      const newItem = {
        ...payload,
        id: newItemRef.key,
        authorId: currentUser.uid,
        author: userData.username || 'User',
        changelog: [{ version: 'v1.0', text: 'Initial Release', timestamp }],
        featured: false,
      };
      await newItemRef.set(newItem);
      setItems(prev => [newItem as Item, ...prev]);
    }
    setActiveModal(null);
    setUploadForm({});
  };

  const handleDeleteItem = async (id: string, authorId: string) => {
    if (!currentUser) return;
    const isAuthor = currentUser.uid === authorId;
    if (!isAuthor && !hasPermission(userData, PERMISSIONS.MANAGE_CONTENT)) return alert("Permission denied.");
    
    if (window.confirm('Delete permanently?')) {
      await db.ref(`items/${id}`).set(null);
      setItems(prev => prev.filter(i => i.id !== id));
      setActiveModal(null);
    }
  };

  const handleToggleFeature = async (item: Item) => {
    if (!hasPermission(userData, PERMISSIONS.FEATURE_POSTS)) return;
    const newVal = !item.featured;
    await db.ref(`items/${item.id}`).update({ featured: newVal });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, featured: newVal } : i));
  };

  const handleAdminUpdateUser = async (uid: string, data: Partial<User>) => {
     if (!currentUser || !hasPermission(userData, PERMISSIONS.MANAGE_USERS)) return;
     await db.ref(`users/${uid}`).update(data);
  };

  const handleDeleteUser = async (uid: string) => {
    if (!currentUser || !hasPermission(userData, PERMISSIONS.MANAGE_USERS)) return;
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      await db.ref(`users/${uid}`).set(null);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: 'img' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (field === 'img') {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadForm(prev => ({ ...prev, img: ev.target?.result as string }));
      reader.readAsDataURL(files[0]);
    } else {
      const newGallery: string[] = [];
      Array.from(files).slice(0, 5).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) newGallery.push(ev.target.result as string);
          if (newGallery.length === Math.min(files.length, 5)) {
             setUploadForm(prev => ({ ...prev, gallery: newGallery }));
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const filteredItems = useMemo(() => {
    let res = items.filter(i => 
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
      (!catFilter || i.cat === catFilter)
    );

    res.sort((a, b) => {
      const timeA = a.changelog?.[a.changelog.length - 1]?.timestamp || 0;
      const timeB = b.changelog?.[b.changelog.length - 1]?.timestamp || 0;
      const ratingA = calculateAvgRating(a.ratings);
      const ratingB = calculateAvgRating(b.ratings);

      if (sortBy === 'highest_rating') return ratingB - ratingA;
      if (sortBy === 'oldest') return (a.changelog?.[0]?.timestamp || 0) - (b.changelog?.[0]?.timestamp || 0);
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      return timeB - timeA; 
    });

    return res;
  }, [items, searchTerm, catFilter, sortBy]);

  const featuredItems = useMemo(() => items.filter(i => i.featured), [items]);

  return (
    <div className="min-h-screen flex font-sans text-gray-100 bg-bg-body">
      
      {/* Mobile Menu Button */}
      <button 
        className="fixed top-4 right-4 z-50 p-3 glass-panel rounded-full md:hidden shadow-xl text-white hover:bg-white/10 transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#0a0a0c] border-r border-white/5 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 pb-2">
            <SmartImage src={ASSETS.TITLE} alt="Visual Craft" className="w-full h-auto object-contain max-h-20 bg-transparent" width={300} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-6">
          {!currentUser ? (
            <div className="animate-fade-in space-y-4">
              <div className="text-center mb-6">
                <h3 className="font-bold text-xl text-white tracking-tight">Welcome</h3>
                <p className="text-xs text-gray-400 mt-1">Join the community</p>
              </div>
              
              <form onSubmit={handleAuth} className="space-y-3">
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                      <Users size={16}/>
                   </div>
                   <input 
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-gray-600 text-white"
                     placeholder="Username"
                     value={authEmail}
                     onChange={e => setAuthEmail(e.target.value)}
                     disabled={authLoading}
                   />
                </div>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                      <Shield size={16}/>
                   </div>
                   <input 
                     type="password"
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-gray-600 text-white"
                     placeholder="Password"
                     value={authPass}
                     onChange={e => setAuthPass(e.target.value)}
                     disabled={authLoading}
                   />
                </div>
                
                {authError && <div className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{authError}</div>}
                
                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-primary to-primary-light py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(109,40,217,0.4)] transition-all transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 text-white mt-2 disabled:opacity-50"
                >
                   {authLoading ? <Loader2 size={16} className="animate-spin"/> : (authMode === 'login' ? <LogIn size={16}/> : <UserPlus size={16}/>)}
                   {authMode === 'login' ? 'Login' : 'Register'}
                </button>
              </form>
              <button 
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(null); }}
                className="text-xs text-gray-400 hover:text-white w-full text-center mt-2 transition-colors"
              >
                {authMode === 'login' ? 'Create an account' : 'Back to Login'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* User Profile Card */}
              <div 
                className="bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all group relative overflow-hidden"
                onClick={() => { setEditProfileForm(userData || {}); setActiveModal('editProfile'); }}
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="flex items-center gap-4 relative z-10">
                    {userData && renderProfilePic(userData, 'w-12 h-12 shadow-lg')}
                    <div className="overflow-hidden">
                      <h3 className="font-bold truncate text-base group-hover:text-primary-light transition-colors">{userData?.username}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> {userData?.role}
                         </span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Navigation Actions */}
              <div className="space-y-2">
                <button onClick={() => { setUploadForm({}); setActiveModal('upload'); }} className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center gap-3 font-semibold hover:shadow-[0_8px_30px_rgba(109,40,217,0.3)] transition-all transform hover:-translate-y-0.5 text-white text-sm group">
                  <Upload size={18} className="group-hover:scale-110 transition-transform"/> Upload Creation
                </button>
                
                {hasPermission(userData, PERMISSIONS.VIEW_ADMIN_DASHBOARD) && (
                  <div className="mt-8 border-t border-white/10 pt-6">
                     <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-2">Admin Panel</h4>
                     <div className="space-y-1">
                       <button onClick={() => setActiveModal('admin')} className="w-full py-2.5 px-3 text-left rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3">
                         <LayoutDashboard size={16} className="text-blue-400"/> Dashboard
                       </button>
                       {hasPermission(userData, PERMISSIONS.MANAGE_CATEGORIES) && (
                         <button onClick={() => setActiveModal('category')} className="w-full py-2.5 px-3 text-left rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3">
                           <Hash size={16} className="text-purple-400"/> Categories
                         </button>
                       )}
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {currentUser && (
            <div className="p-6 border-t border-white/5 bg-[#08080a]/50">
                <button onClick={() => auth.signOut()} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-2 w-full px-4 py-3 rounded-xl hover:bg-white/5 transition-all font-medium group">
                  <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/> Sign Out
                </button>
            </div>
        )}
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 max-w-[1920px] mx-auto w-full pt-20 md:pt-8 min-h-screen flex flex-col">
        
        {/* Featured Section */}
        {featuredItems.length > 0 && !searchTerm && !catFilter && (
           <div className="mb-12">
               <FeaturedCarousel items={featuredItems} onItemClick={(item) => { setSelectedItem(item); setActiveModal('detail'); }} />
           </div>
        )}

        {/* ANIMATED SEARCH PILL */}
        <div className="sticky top-4 z-30 flex justify-center mb-10 pointer-events-none">
            <div 
              ref={searchContainerRef}
              onClick={(e) => {
                 if(isSearchExpanded) return;
                 e.preventDefault();
                 setIsSearchExpanded(true);
              }}
              className={`
                bg-[#131316]/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] 
                transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-auto
                ${isSearchExpanded 
                   ? 'w-full max-w-4xl rounded-2xl p-4 cursor-default ring-1 ring-white/10' 
                   : 'w-[160px] h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(109,40,217,0.4)]'
                }
                ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}
              `}
            >
               <div className="relative w-full h-full flex items-center justify-center">
                 {/* Idle State */}
                 <div className={`absolute transition-all duration-300 ${isSearchExpanded ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                    <div className="flex items-center gap-2 text-gray-300 font-medium">
                        <Search size={18} />
                        <span className="text-sm">Search</span>
                        {(searchTerm || catFilter) && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"/>}
                    </div>
                 </div>

                 {/* Expanded State */}
                 <div className={`w-full flex flex-col lg:flex-row gap-4 transition-all duration-500 delay-75 ${isSearchExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
                   <div className="relative flex-1 group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                     <input 
                       ref={inputRef}
                       type="text" 
                       placeholder="Search addons, maps, textures..." 
                       className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-10 py-3.5 text-white placeholder:text-gray-600 font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                       value={searchTerm}
                       onChange={e => { setSearchTerm(e.target.value); }}
                     />
                     {searchTerm && (
                         <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10">
                            <X size={14}/>
                         </button>
                     )}
                   </div>
                   
                   <div className="flex flex-wrap md:flex-nowrap gap-3">
                     <CustomDropdown 
                       options={[{ label: 'All Categories', value: '' }, ...categories.map(c => ({ label: c, value: c }))]} 
                       value={catFilter} 
                       onChange={(val) => { setCatFilter(val); }}
                       icon={Filter}
                       className="flex-1 md:w-56"
                     />
                     <CustomDropdown 
                       options={[
                         { label: 'Newest First', value: 'newest' },
                         { label: 'Highest Rated', value: 'highest_rating' },
                         { label: 'Oldest First', value: 'oldest' },
                       ]} 
                       value={sortBy} 
                       onChange={setSortBy}
                       icon={SortAsc}
                       className="flex-1 md:w-48"
                     />
                   </div>
                   
                   <button onClick={(e) => { e.stopPropagation(); setIsSearchExpanded(false); }} className="lg:hidden w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-gray-400">
                      Close Search
                   </button>
                 </div>
               </div>
            </div>
        </div>

        {/* Main Grid Header */}
        <div className="flex flex-wrap justify-between items-end mb-8 px-2 gap-4">
            <div>
                <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
                {catFilter || 'All Items'} 
                <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">{filteredItems.length}</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Discover the best community creations</p>
            </div>
            
            <button onClick={() => fetchItems(true)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white border border-transparent hover:border-white/10" title="Refresh">
               <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
            </button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {loading ? (
             [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            filteredItems.map((item, idx) => {
              const avg = calculateAvgRating(item.ratings);
              const canEdit = canEditItem(userData, currentUser?.uid, item.authorId);

              return (
                <div 
                    key={item.id} 
                    className="group bg-[#16161a] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] flex flex-col relative animate-fade-in-up" 
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {item.featured && (
                    <div className="absolute top-3 right-3 z-20 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                      <Star size={10} fill="black" /> FEATURED
                    </div>
                  )}

                  <div className="relative aspect-video bg-[#0a0a0c] overflow-hidden cursor-pointer" onClick={() => { setSelectedItem(item); setSlideIndex(0); setActiveModal('detail'); }}>
                    <SmartImage 
                      src={item.img} 
                      alt={item.title} 
                      width={600}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16161a] via-transparent to-transparent opacity-60"></div>
                    
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-white border border-white/10 group-hover:bg-primary group-hover:border-primary transition-colors shadow-lg">
                            {item.cat}
                        </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-1 truncate text-white leading-tight group-hover:text-primary-light transition-colors">{item.title}</h3>
                    
                    <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs">
                        <SmartImage src={userCache[item.authorId]?.profilePic} width={32} className="w-5 h-5 rounded-full" alt={item.author} />
                        <span className="truncate hover:text-white transition-colors">{item.author}</span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                        <Star size={14} fill={avg > 0 ? "#fbbf24" : "none"} className={avg > 0 ? "text-yellow-400" : "text-gray-600"} />
                        <span className={`text-sm font-bold ${avg > 0 ? 'text-white' : 'text-gray-500'}`}>{avg > 0 ? avg.toFixed(1) : "New"}</span>
                      </div>
                      
                      <div className="flex gap-2">
                         {canEdit && (
                            <button onClick={() => { setUploadForm(item); setActiveModal('upload'); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit size={16} /></button>
                         )}
                         <button onClick={() => { setSelectedItem(item); setActiveModal('detail'); }} className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-white/5 hover:border-white/20">
                           View
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {!loading && filteredItems.length === 0 && (
           <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-600">
             <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                 <Box size={48} className="opacity-20"/>
             </div>
             <p className="text-xl font-bold text-gray-400">No items found</p>
             <p className="text-sm mt-2">Try adjusting your search filters.</p>
           </div>
        )}

        {/* Load More */}
        {!loading && hasMore && !searchTerm && !catFilter && (
           <div className="flex justify-center mt-12 mb-8">
             <button 
               onClick={() => fetchItems()} 
               disabled={loadingMore}
               className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center gap-3 hover:scale-105 active:scale-95"
             >
               {loadingMore && <Loader2 size={16} className="animate-spin"/>}
               Load More Items
             </button>
           </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* Admin Dashboard */}
      {activeModal === 'admin' && hasPermission(userData, PERMISSIONS.VIEW_ADMIN_DASHBOARD) && (
        <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-bg-body overflow-hidden animate-fade-in">
          {/* Admin Sidebar */}
          <div className="w-full md:w-64 bg-[#0e0e11] border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col shadow-2xl z-20 shrink-0 h-auto md:h-full">
             <div className="p-4 md:p-6 pb-2 md:pb-2 flex items-center md:block justify-between w-full md:w-auto">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 tracking-tight"><Shield className="text-primary"/> Admin</h2>
                    <p className="text-xs text-gray-500 mt-1 hidden md:block">Management Dashboard</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="md:hidden text-gray-400 hover:text-white p-2"><X size={20}/></button>
             </div>
             
             <div className="hidden md:flex flex-1 p-4 flex-col space-y-2 mt-4">
                <button 
                  onClick={() => setAdminTab('users')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${adminTab === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                   <Users size={18}/> Users
                </button>
                <button 
                  onClick={() => setAdminTab('content')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${adminTab === 'content' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                   <FileText size={18}/> Content
                </button>
             </div>
             
             {/* Mobile Tabs */}
             <div className="flex md:hidden w-full px-4 pb-2 gap-2">
                <button onClick={() => setAdminTab('users')} className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${adminTab === 'users' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'}`}>Users</button>
                <button onClick={() => setAdminTab('content')} className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${adminTab === 'content' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'}`}>Content</button>
             </div>

             <div className="hidden md:block p-4 border-t border-white/5">
                <button onClick={() => setActiveModal(null)} className="w-full flex items-center gap-2 text-gray-400 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
                   <LogOut size={16} className="rotate-180"/> Exit Dashboard
                </button>
             </div>
          </div>
          
          {/* Admin Main Area */}
          <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
             {/* Admin Header */}
             <div className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0e0e11]/50 backdrop-blur-xl z-10 shrink-0">
                <h3 className="text-lg md:text-xl font-bold text-white capitalize">{adminTab} Management</h3>
                
                <div className="relative w-40 md:w-96">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                   <input 
                      value={adminSearch}
                      onChange={e => setAdminSearch(e.target.value)}
                      className="w-full bg-[#1a1a1e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-white focus:border-primary/50 outline-none"
                      placeholder={`Search...`}
                   />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                {adminTab === 'users' ? (
                  <div className="space-y-2 max-w-5xl mx-auto">
                    {/* User List Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                       <div className="col-span-5">User</div>
                       <div className="col-span-3">Role</div>
                       <div className="col-span-4 text-right">Actions</div>
                    </div>
                    
                    {(Object.entries(users) as [string, User][])
                      .filter(([_, u]) => u.username?.toLowerCase().includes(adminSearch.toLowerCase()))
                      .map(([uid, user]) => (
                      <div key={uid} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center bg-[#0e0e11] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors group">
                         <div className="w-full md:col-span-5 flex items-center gap-3">
                            <SmartImage src={user.profilePic} className="w-10 h-10 rounded-full bg-gray-800" width={64} alt=""/>
                            <div className="overflow-hidden">
                               <div className="font-bold text-white flex items-center gap-2">
                                 <span className="truncate">{user.username}</span>
                                 {user.banned && <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] border border-red-500/20">BANNED</span>}
                                 {user.muted && <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[10px] border border-yellow-500/20">MUTED</span>}
                               </div>
                               <p className="text-xs text-gray-500 truncate w-32 md:w-full">{uid}</p>
                            </div>
                         </div>
                         
                         <div className="w-full md:col-span-3 flex items-center justify-between md:block">
                            <span className="md:hidden text-xs font-bold text-gray-500 uppercase">Role:</span>
                            {user.role === 'owner' ? (
                               <span className="text-red-500 font-bold uppercase text-xs tracking-wider border border-red-500/20 bg-red-500/10 px-2 py-1 rounded">Owner</span>
                            ) : (
                               <select 
                                 value={user.role} 
                                 onChange={(e) => handleAdminUpdateUser(uid, { role: e.target.value as any })}
                                 className="bg-[#1a1a1e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary/50 w-32 md:w-full max-w-[120px]"
                                 disabled={!hasPermission(userData, PERMISSIONS.MANAGE_USERS)}
                               >
                                 <option value="user">Member</option>
                                 <option value="staff">Staff</option>
                                 <option value="admin">Admin</option>
                               </select>
                            )}
                         </div>
                         
                         <div className="w-full md:col-span-4 flex items-center justify-end gap-2 border-t border-white/5 pt-3 md:pt-0 md:border-0">
                            {hasPermission(userData, PERMISSIONS.MANAGE_USERS) && user.role !== 'owner' && (
                               <>
                                 <button 
                                   onClick={() => handleAdminUpdateUser(uid, { muted: !user.muted })}
                                   className={`p-2 rounded-lg transition-colors ${user.muted ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                   title={user.muted ? "Unmute" : "Mute"}
                                 >
                                    <MicOff size={16}/>
                                 </button>
                                 <button 
                                   onClick={() => handleAdminUpdateUser(uid, { banned: !user.banned })}
                                   className={`p-2 rounded-lg transition-colors ${user.banned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                   title={user.banned ? "Unban" : "Ban"}
                                 >
                                    <Ban size={16}/>
                                 </button>
                                 <div className="w-px h-6 bg-white/10 mx-1"></div>
                                 <button 
                                   onClick={() => handleDeleteUser(uid)}
                                   className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
                                   title="Delete Account"
                                 >
                                    <Trash2 size={16}/>
                                 </button>
                               </>
                            )}
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
                    {items
                      .filter(i => i.title.toLowerCase().includes(adminSearch.toLowerCase()))
                      .map(item => (
                        <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#0e0e11] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-all">
                           <div className="flex items-center gap-4 w-full md:w-auto">
                               <SmartImage src={item.img} className="w-20 h-14 rounded-lg object-cover bg-gray-800 shrink-0" alt=""/>
                               <div className="flex-1 min-w-0 md:hidden">
                                  <h4 className="font-bold text-white truncate">{item.title}</h4>
                                  <p className="text-xs text-gray-500">by <span className="text-gray-300">{item.author}</span></p>
                               </div>
                           </div>
                           
                           <div className="flex-1 min-w-0 hidden md:block">
                              <h4 className="font-bold text-white truncate">{item.title}</h4>
                              <p className="text-xs text-gray-500">by <span className="text-gray-300">{item.author}</span> • {item.cat}</p>
                           </div>
                           
                           <div className="flex items-center justify-end w-full md:w-auto gap-2 border-t border-white/5 pt-3 md:pt-0 md:border-0">
                              {hasPermission(userData, PERMISSIONS.FEATURE_POSTS) && (
                                <button 
                                  onClick={() => handleToggleFeature(item)}
                                  className={`p-2 rounded-lg transition-colors border ${item.featured ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-white/5 text-gray-400 border-transparent hover:text-white'}`}
                                  title="Toggle Feature"
                                >
                                   <Star size={18} fill={item.featured ? "currentColor" : "none"}/>
                                </button>
                              )}
                              
                              <button 
                                onClick={() => { setSelectedItem(item); setActiveModal('upload'); }}
                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Edit"
                              >
                                 <Edit size={18}/>
                              </button>
                              
                              <button 
                                onClick={() => handleDeleteItem(item.id, item.authorId)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
                                title="Delete Content"
                              >
                                 <Trash2 size={18}/>
                              </button>
                           </div>
                        </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {activeModal === 'detail' && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0e0e11] w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-white/10 flex flex-col lg:flex-row overflow-hidden">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 z-30 p-2.5 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors border border-white/10 text-white"><X size={20}/></button>
            
            {/* Left: Gallery */}
            <div className="lg:w-2/3 bg-black relative min-h-[400px] flex flex-col justify-center">
                {/* Background Blur Effect */}
                <div className="absolute inset-0 overflow-hidden">
                     <SmartImage src={selectedItem.gallery?.[slideIndex] || selectedItem.img} alt="" className="w-full h-full object-cover opacity-30 blur-3xl scale-125" width={200} />
                </div>
                
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-10">
                    <SmartImage 
                        src={(selectedItem.gallery && selectedItem.gallery.length > 0) ? selectedItem.gallery[slideIndex] : selectedItem.img} 
                        alt={selectedItem.title}
                        width={1200}
                        className="max-w-full max-h-[60vh] object-contain shadow-2xl rounded-lg"
                    />
                </div>

                {/* Controls */}
                {selectedItem.gallery && selectedItem.gallery.length > 1 && (
                    <>
                    <button onClick={() => setSlideIndex(prev => prev === 0 ? (selectedItem.gallery?.length||1)-1 : prev-1)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full hover:bg-primary transition-colors border border-white/10"><ChevronLeft/></button>
                    <button onClick={() => setSlideIndex(prev => prev === (selectedItem.gallery?.length||1)-1 ? 0 : prev+1)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full hover:bg-primary transition-colors border border-white/10"><ChevronRight/></button>
                    
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 z-20">
                        {selectedItem.gallery.map((img, idx) => (
                            <button 
                            key={idx} 
                            onClick={() => setSlideIndex(idx)}
                            className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${idx === slideIndex ? 'border-primary opacity-100 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            >
                            <SmartImage src={img} width={100} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>
                    </>
                )}
            </div>

            {/* Right: Info */}
            <div className="lg:w-1/3 bg-[#0e0e11] border-l border-white/5 flex flex-col h-full max-h-[95vh]">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                            <span className="bg-primary/10 text-primary-light px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">{selectedItem.cat}</span>
                            {selectedItem.featured && <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-500/20 flex items-center gap-1"><Star size={12} fill="currentColor"/> Featured</span>}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white mb-6">{selectedItem.title}</h2>
                    
                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                            <div className="flex items-center gap-3 cursor-pointer group p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors" onClick={() => {setActiveModal('profile'); setSelectedProfileId(selectedItem.authorId);}}>
                                <UserAvatar userId={selectedItem.authorId} className="w-10 h-10 ring-2 ring-white/10 group-hover:ring-primary transition-all" />
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Created By</p>
                                    <p className="font-bold text-white group-hover:text-primary transition-colors">{selectedItem.author}</p>
                                </div>
                            </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 custom-scrollbar">
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                            <ReactMarkdown>{selectedItem.desc}</ReactMarkdown>
                    </div>
                </div>

                <div className="p-8 pt-4 border-t border-white/5 space-y-4 bg-[#0e0e11]">
                    <DownloadButton href={selectedItem.link} sizeStr="Download Now" />
                    
                    {selectedItem.youtube && (
                        <a href={selectedItem.youtube} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#FF0000]/10 hover:bg-[#FF0000] text-[#FF0000] hover:text-white border border-[#FF0000]/30 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
                            <Play size={18} fill="currentColor" /> Watch Trailer
                        </a>
                    )}

                    {(canEditItem(userData, currentUser?.uid, selectedItem.authorId) || hasPermission(userData, PERMISSIONS.MANAGE_CONTENT)) && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                             {canEditItem(userData, currentUser?.uid, selectedItem.authorId) && (
                                 <button onClick={() => { setUploadForm(selectedItem); setActiveModal('upload'); }} className="bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold text-sm transition-colors border border-white/5 text-gray-300 hover:text-white">
                                    Edit Details
                                 </button>
                             )}
                             {(currentUser?.uid === selectedItem.authorId || hasPermission(userData, PERMISSIONS.MANAGE_CONTENT)) && (
                                 <button onClick={() => handleDeleteItem(selectedItem.id, selectedItem.authorId)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-sm transition-colors border border-red-500/20">
                                    Delete
                                 </button>
                             )}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Edit Modal */}
      {activeModal === 'upload' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-white/10 animate-fade-in-up">
             <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X/></button>
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Upload className="text-primary"/> {uploadForm.id ? 'Edit Creation' : 'Upload Creation'}</h2>
             
             <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                       <input required placeholder="Enter a catchy title..." value={uploadForm.title || ''} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:border-primary/50 transition-colors text-white"/>
                   </div>
                   <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                       <textarea required placeholder="Describe your creation using Markdown..." rows={6} value={uploadForm.desc || ''} onChange={e => setUploadForm({...uploadForm, desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:border-primary/50 transition-colors text-white"/>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                    <div className="relative">
                        <select value={uploadForm.cat || categories[0]} onChange={e => setUploadForm({...uploadForm, cat: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none appearance-none text-white">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={16}/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Cover Image</label>
                    <div className="relative group">
                        <input type="file" accept="image/*" onChange={e => handleFile(e, 'img')} className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary-light hover:file:bg-primary/30 cursor-pointer"/>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-400 uppercase">Gallery (Max 5)</label>
                   <input type="file" multiple accept="image/*" onChange={e => handleFile(e, 'gallery')} className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary-light hover:file:bg-primary/30 cursor-pointer"/>
                   {uploadForm.gallery && uploadForm.gallery.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                            {uploadForm.gallery.map((src, i) => (
                                <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 group">
                                    <SmartImage src={src} className="w-full h-full object-cover" width={100} alt="" />
                                    <button type="button" onClick={() => setUploadForm(p => ({...p, gallery: p.gallery?.filter((_, idx) => idx !== i)}))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-red-500"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                   )}
                </div>

                <div className="space-y-4 pt-2 border-t border-white/5">
                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase">Download Link</label>
                       <input required placeholder="https://..." value={uploadForm.link || ''} onChange={e => setUploadForm({...uploadForm, link: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:border-primary/50 text-white font-mono text-sm"/>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input placeholder="YouTube Trailer URL (Optional)" value={uploadForm.youtube || ''} onChange={e => setUploadForm({...uploadForm, youtube: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:border-primary/50 text-white"/>
                      <input placeholder="Original Creator (If not you)" value={uploadForm.originalCreator || ''} onChange={e => setUploadForm({...uploadForm, originalCreator: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:border-primary/50 text-white"/>
                   </div>
                </div>

                <button className="w-full bg-gradient-to-r from-primary to-primary-light py-4 rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all hover:-translate-y-1 hover:shadow-purple-900/50 mt-4 text-white">
                  {uploadForm.id ? 'Save Changes' : 'Post Creation'}
                </button>
             </form>
           </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-white/10 animate-fade-in-up">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4"><X className="text-gray-400"/></button>
            <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
            
            <div className="flex justify-center mb-6">
              {renderProfilePic({ ...userData!, ...editProfileForm } as User, 'w-24 h-24')}
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
               <div>
                 <label className="text-xs text-gray-500 mb-1 block uppercase font-bold">Profile Picture</label>
                 <input type="file" onChange={e => {
                    const f = e.target.files?.[0];
                    if(f) {
                      const r = new FileReader();
                      r.onload = ev => setEditProfileForm({...editProfileForm, profilePic: ev.target?.result as string});
                      r.readAsDataURL(f);
                    }
                 }} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"/>
               </div>
               
               <textarea placeholder="Write a short bio..." rows={3} value={editProfileForm.bio || ''} onChange={e => setEditProfileForm({...editProfileForm, bio: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-primary/50 text-white"/>
               
               <div>
                  <label className="text-xs text-gray-500 mb-2 block uppercase font-bold">Profile Border</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(BORDERS).map(([key, val]) => (
                      <div key={key} onClick={() => setEditProfileForm({...editProfileForm, profileBorder: key})} className={`cursor-pointer p-2 rounded-lg border transition-all ${editProfileForm.profileBorder === key ? 'border-primary bg-primary/10' : 'border-white/5 hover:bg-white/5'}`}>
                        <div className={`w-6 h-6 rounded-full mx-auto bg-gray-700 ${val.class}`}></div>
                        <p className="text-[10px] text-center mt-2 truncate text-gray-400">{val.name}</p>
                      </div>
                    ))}
                  </div>
               </div>

               {editProfileForm.profileBorder === 'custom' && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 animate-fade-in">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Border Color</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={editProfileForm.customColor || '#8b5cf6'} 
                                onChange={e => setEditProfileForm({...editProfileForm, customColor: e.target.value})}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                            />
                            <input 
                                type="text" 
                                value={editProfileForm.customColor || '#8b5cf6'} 
                                onChange={e => setEditProfileForm({...editProfileForm, customColor: e.target.value})}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm w-32 font-mono text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Border Thickness</label>
                            <span className="text-xs font-mono text-gray-400">{editProfileForm.customBorderWidth || 2}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="1"
                            value={editProfileForm.customBorderWidth || 2} 
                            onChange={e => setEditProfileForm({...editProfileForm, customBorderWidth: parseInt(e.target.value)})}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                  </div>
               )}
            </div>

            <button onClick={async () => {
              if(!currentUser) return;
              await db.ref(`users/${currentUser.uid}`).update(editProfileForm);
              setActiveModal(null);
            }} className="w-full bg-primary hover:bg-primary-light mt-6 py-3 rounded-xl font-bold transition-colors text-white">Save Profile</button>
          </div>
        </div>
      )}

      {/* Category Manager (Admin) */}
      {activeModal === 'category' && hasPermission(userData, PERMISSIONS.MANAGE_CATEGORIES) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-sm rounded-2xl p-6 relative border border-white/10 animate-fade-in-up">
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4"><X/></button>
              <h3 className="text-xl font-bold mb-4">Manage Categories</h3>
              
              <div className="flex gap-2 mb-4">
                <input id="newCat" className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none text-white" placeholder="New Category"/>
                <button onClick={() => {
                  const val = (document.getElementById('newCat') as HTMLInputElement).value;
                  if(val && !categories.includes(val)) {
                    db.ref('categories').set([...categories, val]);
                    (document.getElementById('newCat') as HTMLInputElement).value = '';
                  }
                }} className="bg-primary px-4 rounded-lg text-sm font-bold hover:bg-primary-light text-white">Add</button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {categories.map(c => (
                  <div key={c} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-sm font-medium">{c}</span>
                    <button onClick={() => {
                      if(window.confirm(`Delete ${c}?`)) db.ref('categories').set(categories.filter(x => x !== c));
                    }} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
           </div>
         </div>
      )}

      {/* CSS Animation Extras */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
    </div>
  );
}