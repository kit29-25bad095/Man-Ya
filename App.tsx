
import React, { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import type { User, Chat, Message, AppSettings, Page, Theme, Post, Story } from './types';
import { MOCK_USERS, MOCK_CHATS, MOCK_POSTS, MOCK_STORIES } from './data';
import { LockIcon, UnlockIcon, PhotoIcon, SendIcon, EditIcon, CheckIcon, UserCircleIcon, CogIcon, ChatBubbleLeftRightIcon, ArrowLeftIcon, SunIcon, MoonIcon, ComputerDesktopIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon, BellIcon, CameraIcon, InformationCircleIcon, PlusIcon, XMarkIcon, TrashIcon, FingerPrintIcon, GlobeAltIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, FaceSmileIcon, ClockIcon, ShieldExclamationIcon, UserMinusIcon } from './constants';

// --- CONTEXT ---
const AppContext = createContext<{
  currentUser: User | null;
  users: User[];
  chats: Chat[];
  settings: AppSettings;
  login: (username: string) => boolean;
  signup: (username: string) => boolean;
  logout: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  getChatPartner: (chat: Chat) => User;
  messages: { [key: string]: Message[] };
  setMessages: React.Dispatch<React.SetStateAction<{ [key: string]: Message[] }>>;
  lockedChats: { [key: string]: string };
  toggleChatLock: (chatId: string, pin: string | null) => void;
  posts: Post[];
  addPost: (newPostData: Omit<Post, 'id' | 'timestamp'>) => void;
  updatePost: (postId: string, newCaption: string) => void;
  stories: Story[];
  addStory: (newStoryData: Omit<Story, 'id' | 'timestamp'>) => void;
  deleteStory: (storyId: string) => void;
  toggleReaction: (chatId: string, messageId: string, emoji: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  clearChatHistory: (chatId: string) => void;
  updateChatSettings: (chatId: string, timer: number | null) => void;
  changeSecurityCode: (userId: string) => void;
  toggleBlockUser: (userIdToBlock: string) => void;
} | null>(null);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    notifications: true,
    profileIsPublic: false,
    enablePosts: false,
    enableStories: false,
    twoFactorEnabled: false,
    enableBiometrics: false,
    showSecurityNotifications: true,
  });
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(() => {
    const initialMessages: { [key: string]: Message[] } = {};
    MOCK_CHATS.forEach(chat => {
      initialMessages[chat.id] = chat.messages;
    });
    return initialMessages;
  });
  const [lockedChats, setLockedChats] = useState<{ [key: string]: string }>({});
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);

  const login = (username: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      setCurrentUser(user);
      // Sync logged-in user's public profile setting with global settings
      setSettings(prev => ({...prev, profileIsPublic: user.profileIsPublic }));
      return true;
    }
    return false;
  };

  const signup = (username: string) => {
    const userExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      return false;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username,
      avatarUrl: `https://picsum.photos/seed/${username}/200`,
      profileIsPublic: false,
      securityCode: Array(4).fill(0).map(() => Math.random().toString(36).substring(2, 5)).join('-'),
      blockedUserIds: [],
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const getChatPartner = useCallback((chat: Chat) => {
    const partnerId = chat.participantIds.find(id => id !== currentUser?.id);
    return users.find(u => u.id === partnerId)!;
  }, [currentUser, users]);

  const toggleChatLock = (chatId: string, pin: string | null) => {
    setLockedChats(prev => {
      const newLocked = { ...prev };
      if (pin) {
        newLocked[chatId] = pin;
      } else {
        delete newLocked[chatId];
      }
      return newLocked;
    });
  };

  const addPost = (newPostData: Omit<Post, 'id' | 'timestamp'>) => {
    const newPost: Post = {
        ...newPostData,
        id: `post-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (postId: string, newCaption: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: newCaption } : p));
  };

  const addStory = (newStoryData: Omit<Story, 'id' | 'timestamp'>) => {
    const newStory: Story = {
      ...newStoryData,
      id: `story-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setStories(prev => [newStory, ...prev]);
  };
  
  const deleteStory = (storyId: string) => {
    setStories(prev => prev.filter(story => story.id !== storyId));
  };

  const toggleReaction = (chatId: string, messageId: string, emoji: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;

    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      const newMessages = chatMessages.map(message => {
        if (message.id === messageId) {
          const reactions = message.reactions ? [...message.reactions] : [];
          let reaction = reactions.find(r => r.emoji === emoji);

          if (reaction) {
            // Reaction exists, check if user has reacted
            if (reaction.userIds.includes(userId)) {
              // User has reacted, so remove reaction
              reaction.userIds = reaction.userIds.filter(id => id !== userId);
            } else {
              // User has not reacted, so add reaction
              reaction.userIds.push(userId);
            }
            // If no one is reacting with this emoji anymore, remove it
            if (reaction.userIds.length === 0) {
              return { ...message, reactions: reactions.filter(r => r.emoji !== emoji) };
            }
          } else {
            // Reaction does not exist, create it
            reactions.push({ emoji, userIds: [userId] });
          }
          return { ...message, reactions };
        }
        return message;
      });
      return { ...prev, [chatId]: newMessages };
    });
  };

  const deleteMessage = (chatId: string, messageId: string) => {
      setMessages(prev => ({
          ...prev,
          [chatId]: prev[chatId].filter(m => m.id !== messageId),
      }));
  };

  const clearChatHistory = (chatId: string) => {
      setMessages(prev => ({
          ...prev,
          [chatId]: [],
      }));
  };
  
  const updateChatSettings = (chatId: string, timer: number | null) => {
    setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, disappearingMessageTimer: timer } : chat
    ));
  };

  const changeSecurityCode = (userId: string) => {
    const newCode = Array(4).fill(0).map(() => Math.random().toString(36).substring(2, 5)).join('-');
    setUsers(prevUsers => prevUsers.map(user => 
        user.id === userId ? { ...user, securityCode: newCode } : user
    ));

    setMessages(prevMessages => {
        const newMessages = {...prevMessages};
        const userWhoChanged = users.find(u => u.id === userId);
        
        chats.forEach(chat => {
            if (chat.participantIds.includes(userId)) {
                const userName = userId === currentUser?.id ? "Your" : `${userWhoChanged?.username}'s`;

                const systemMessage: Message = {
                    id: `sys-${chat.id}-${Date.now()}`,
                    senderId: 'system',
                    text: `${userName} security code changed.`,
                    timestamp: new Date().toISOString(),
                    type: 'system',
                };

                const existingMessages = newMessages[chat.id] || [];
                if (settings.showSecurityNotifications) {
                  newMessages[chat.id] = [...existingMessages, systemMessage];
                }
            }
        });
        return newMessages;
    });
  };

  const toggleBlockUser = (userIdToBlock: string) => {
    if (!currentUser) return;
    
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id === currentUser.id) {
          const blockedIds = user.blockedUserIds || [];
          const isBlocked = blockedIds.includes(userIdToBlock);
          return {
            ...user,
            blockedUserIds: isBlocked 
              ? blockedIds.filter(id => id !== userIdToBlock)
              : [...blockedIds, userIdToBlock],
          };
        }
        return user;
      })
    );
     // Also update currentUser state to reflect changes immediately
    setCurrentUser(prev => {
        if (!prev) return null;
        const blockedIds = prev.blockedUserIds || [];
        const isBlocked = blockedIds.includes(userIdToBlock);
        return {
             ...prev,
             blockedUserIds: isBlocked 
              ? blockedIds.filter(id => id !== userIdToBlock)
              : [...blockedIds, userIdToBlock],
        }
    })
  };

  const value = {
    currentUser,
    users,
    chats,
    settings,
    login,
    signup,
    logout,
    updateSettings,
    getChatPartner,
    messages,
    setMessages,
    lockedChats,
    toggleChatLock,
    posts,
    addPost,
    updatePost,
    stories,
    addStory,
    deleteStory,
    toggleReaction,
    deleteMessage,
    clearChatHistory,
    updateChatSettings,
    changeSecurityCode,
    toggleBlockUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- THEME MANAGEMENT ---
const useTheme = () => {
  const { settings, updateSettings } = useAppContext();

  useEffect(() => {
    const root = window.document.documentElement;
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (settings.theme === 'dark' || (settings.theme === 'system' && systemIsDark)) {
      root.classList.add('dark');
      root.style.setProperty('--system-bg', '#111827');
      root.style.setProperty('--system-text', '#F9FAFB');
      root.style.setProperty('--system-border', '#374151');
      root.style.setProperty('--system-bg-secondary', '#1F2937');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--system-bg', '#FFFFFF');
      root.style.setProperty('--system-text', '#111827');
      root.style.setProperty('--system-border', '#E5E7EB');
      root.style.setProperty('--system-bg-secondary', '#F3F4F6');
    }
  }, [settings.theme]);

  const setTheme = (theme: Theme) => updateSettings({ theme });
  return { theme: settings.theme, setTheme };
};

// --- COMPONENTS ---
const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
      enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-system-bg-secondary rounded-2xl shadow-2xl w-full max-w-md m-4">
                <div className="flex justify-between items-center p-4 border-b border-system-border">
                    <h3 className="text-lg font-bold text-system-text">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XMarkIcon />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const PinInput: React.FC<{ onComplete: (pin: string) => void }> = ({ onComplete }) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      if (value !== '' && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        nextInput?.focus();
      }
      
      if (newPin.every(digit => digit !== '')) {
        onComplete(newPin.join(''));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
       const prevInput = document.getElementById(`pin-${index - 1}`);
       prevInput?.focus();
    }
  };

  return (
    <div className="flex justify-center space-x-3">
      {pin.map((digit, index) => (
        <input
          key={index}
          id={`pin-${index}`}
          type="password"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-12 h-14 bg-system-bg text-system-text border-2 border-system-border rounded-lg text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
};

const CreatePostModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { addPost, currentUser } = useAppContext();
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleClose = () => {
        setCaption('');
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onClose();
    };

    const handlePost = () => {
        if (!image || !currentUser) return;
        addPost({
            userId: currentUser.id,
            imageUrl: image,
            caption: caption,
        });
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create a new post">
            <div className="space-y-4">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full h-64 bg-system-bg border-2 border-dashed border-system-border rounded-lg flex items-center justify-center cursor-pointer text-gray-400 hover:border-purple-500 transition-colors"
                >
                    {image ? (
                        <img src={image} alt="preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <div className="text-center">
                            <PhotoIcon className="mx-auto w-12 h-12" />
                            <p>Click to upload an image</p>
                        </div>
                    )}
                </div>
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    rows={3}
                    className="w-full p-2 bg-system-bg border border-system-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-system-text"
                />
                <button 
                    onClick={handlePost} 
                    disabled={!image}
                    className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Post
                </button>
            </div>
        </Modal>
    );
};

const EditPostModal: React.FC<{ isOpen: boolean; onClose: () => void; post: Post | null }> = ({ isOpen, onClose, post }) => {
    const { updatePost } = useAppContext();
    const [caption, setCaption] = useState('');

    useEffect(() => {
        if (post) {
            setCaption(post.caption);
        }
    }, [post]);

    if (!post) return null;

    const handleSave = () => {
        updatePost(post.id, caption);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit post">
            <div className="space-y-4">
                <div className="w-full h-64 bg-system-bg rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={post.imageUrl} alt="post content" className="w-full h-full object-cover" />
                </div>
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    rows={3}
                    className="w-full p-2 bg-system-bg border border-system-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-system-text"
                />
                <button 
                    onClick={handleSave} 
                    className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300"
                >
                    Save Changes
                </button>
            </div>
        </Modal>
    );
};

const CreateStoryModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { addStory, currentUser } = useAppContext();
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => { setImage(event.target?.result as string); };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleClose = () => {
        setCaption('');
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onClose();
    };

    const handleShare = () => {
        if (!image || !currentUser) return;
        addStory({
            userId: currentUser.id,
            mediaUrl: image,
            mediaType: 'image',
            caption: caption,
        });
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create a new story">
            <div className="space-y-4">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full aspect-[9/16] bg-system-bg border-2 border-dashed border-system-border rounded-lg flex items-center justify-center cursor-pointer text-gray-400 hover:border-purple-500 transition-colors"
                >
                    {image ? (
                        <img src={image} alt="preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <div className="text-center">
                            <CameraIcon className="mx-auto w-12 h-12" />
                            <p>Click to upload media</p>
                        </div>
                    )}
                </div>
                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full p-2 bg-system-bg border border-system-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-system-text"
                />
                <button 
                    onClick={handleShare} 
                    disabled={!image}
                    className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Share to Story
                </button>
            </div>
        </Modal>
    );
};

const StoryViewerModal: React.FC<{ user: User | null; stories: Story[]; onClose: () => void }> = ({ user, stories, onClose }) => {
    const { currentUser, deleteStory } = useAppContext();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!user || stories.length === 0) {
            onClose();
            return;
        }
        if (currentIndex >= stories.length) {
            setCurrentIndex(stories.length - 1);
        }
    }, [stories, currentIndex, user, onClose]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [user]);
    
    useEffect(() => {
        if (!user || stories.length === 0) return;
        const timer = setTimeout(() => {
            if (currentIndex < stories.length - 1) {
                setCurrentIndex(i => i + 1);
            } else {
                onClose();
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [currentIndex, stories.length, onClose, user]);

    if (!user || stories.length === 0) return null;

    const currentStory = stories[currentIndex];

    const goToPrev = () => setCurrentIndex(i => Math.max(0, i - 1));
    const goToNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            onClose();
        }
    };

    const handleDelete = () => {
        deleteStory(currentStory.id);
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fadeIn">
            <div className="relative w-full h-full max-w-md max-h-[95vh] bg-gray-900 rounded-lg overflow-hidden">
                <div className="absolute top-0 left-0 right-0 p-2 z-20">
                    <div className="flex items-center gap-2">
                        {stories.map((_, index) => (
                            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full">
                                <div 
                                    className={`h-full bg-white rounded-full ${index < currentIndex ? 'w-full' : ''} ${index === currentIndex ? 'animate-story-progress' : ''}`}
                                    style={{ animationDuration: '5s' }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center">
                            <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full mr-2"/>
                            <span className="text-white font-semibold text-sm">{user.username}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {currentUser?.id === user.id && (
                                <button onClick={handleDelete} className="text-white"><TrashIcon /></button>
                            )}
                            <button onClick={onClose} className="text-white"><XMarkIcon /></button>
                        </div>
                    </div>
                </div>

                <img src={currentStory.mediaUrl} alt={currentStory.caption} className="w-full h-full object-cover" />
                
                {currentStory.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-gradient-to-t from-black/70 to-transparent z-10">
                        <p className="text-white">{currentStory.caption}</p>
                    </div>
                )}

                <div className="absolute inset-0 flex justify-between z-20">
                    <button onClick={goToPrev} className="w-1/3 h-full"></button>
                    <button onClick={goToNext} className="w-2/3 h-full"></button>
                </div>
            </div>
             <style>{`
                @keyframes storyProgress {
                    from { width: 0% }
                    to { width: 100% }
                }
                .animate-story-progress {
                    animation: storyProgress 5s linear forwards;
                }
            `}</style>
        </div>
    );
};

const UnlockChatModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUnlock: () => void;
    chatId: string | null;
}> = ({ isOpen, onClose, onUnlock, chatId }) => {
    const { settings, lockedChats } = useAppContext();
    const [pinError, setPinError] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handlePinComplete = (pin: string) => {
        if (chatId && lockedChats[chatId] === pin) {
            onUnlock();
            setPinError(false);
        } else {
            setPinError(true);
            setTimeout(() => setPinError(false), 1500);
        }
    };
    
    const simulateBiometricAuth = () => new Promise<boolean>((resolve) => {
        setIsAuthenticating(true);
        setTimeout(() => {
            // In a real app, this would use the Web Authentication API
            // For this demo, we'll just simulate a successful authentication
            setIsAuthenticating(false);
            alert("Biometric authentication successful (simulated).");
            resolve(true);
        }, 1000);
    });

    const handleBiometricUnlock = async () => {
        const success = await simulateBiometricAuth();
        if (success) {
            onUnlock();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Unlock Chat">
            <div className="space-y-4">
                <p className="text-center text-gray-400">Enter PIN or use biometrics to unlock this chat.</p>
                {settings.enableBiometrics && (
                    <button onClick={handleBiometricUnlock} disabled={isAuthenticating} className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-gray-500">
                        <FingerPrintIcon />
                        <span>{isAuthenticating ? 'Authenticating...' : 'Unlock with Biometrics'}</span>
                    </button>
                )}
                <div className="flex items-center text-gray-400 text-xs">
                    <div className="flex-grow border-t border-system-border"></div>
                    <span className="flex-shrink mx-2">OR</span>
                    <div className="flex-grow border-t border-system-border"></div>
                </div>
                <PinInput onComplete={handlePinComplete} />
                {pinError && <p className="text-red-500 text-center mt-4 text-sm animate-shake">Incorrect PIN. Please try again.</p>}
            </div>
        </Modal>
    );
};

const DisappearingMessagesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    chat: Chat;
    onTimerSelect: (timer: number | null) => void;
}> = ({ isOpen, onClose, chat, onTimerSelect }) => {
    
    const timers = [
        { label: 'Off', value: null },
        { label: '24 hours', value: 86400 },
        { label: '7 days', value: 604800 },
        { label: '90 days', value: 7776000 },
    ];

    const handleSelect = (timer: number | null) => {
        onTimerSelect(timer);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Disappearing Messages">
            <div className="space-y-4">
                <p className="text-sm text-gray-400">For more privacy, turn on disappearing messages. New messages will be deleted for everyone in this chat after the selected duration.</p>
                <div className="space-y-2">
                    {timers.map(({ label, value }) => (
                        <button
                            key={label}
                            onClick={() => handleSelect(value)}
                            className={`w-full text-left p-3 rounded-lg hover:bg-system-bg transition-colors ${
                                chat.disappearingMessageTimer === value ? 'bg-purple-600/20 text-purple-400' : ''
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span>{label}</span>
                                {chat.disappearingMessageTimer === value && <CheckIcon className="w-5 h-5" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

// --- SCREENS ---
const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!login(username)) {
        setError('Invalid username or password.');
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setError("Username and password cannot be empty.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!signup(username)) {
        setError('Username is already taken.');
      }
    }
  };

  const toggleForm = (isLoginView: boolean) => {
    setIsLogin(isLoginView);
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-system-bg text-system-text flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-500">Aetheria</h1>
          <p className="text-gray-400 mt-2">Your secure and private space.</p>
        </div>
        <div className="bg-system-bg-secondary p-8 rounded-2xl shadow-lg">
          <div className="flex border-b border-system-border mb-6">
            <button onClick={() => toggleForm(true)} className={`flex-1 py-2 text-sm font-semibold ${isLogin ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400'}`}>
              SIGN IN
            </button>
            <button onClick={() => toggleForm(false)} className={`flex-1 py-2 text-sm font-semibold ${!isLogin ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400'}`}>
              SIGN UP
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="username">Username</label>
              <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 bg-system-bg border border-system-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="password">Password</label>
              <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 bg-system-bg border border-system-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="confirm-password">Confirm Password</label>
                <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 bg-system-bg border border-system-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            )}
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-300 !mt-6">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const HomeScreen: React.FC<{ 
    onSelectChat: (chatId: string) => void;
    onCreateStory: () => void;
    onViewUserStories: (user: User) => void;
}> = ({ onSelectChat, onCreateStory, onViewUserStories }) => {
    const { chats, getChatPartner, messages, settings, lockedChats, stories, currentUser, users } = useAppContext();
    const [unlockingChatId, setUnlockingChatId] = useState<string | null>(null);
    const [unlockedChats, setUnlockedChats] = useState<Set<string>>(new Set());

    const handleChatClick = (chatId: string) => {
        if (lockedChats[chatId] && !unlockedChats.has(chatId)) {
            setUnlockingChatId(chatId);
        } else {
            onSelectChat(chatId);
        }
    };
    
    const handleUnlock = () => {
        if(unlockingChatId) {
            setUnlockedChats(prev => new Set(prev).add(unlockingChatId));
            onSelectChat(unlockingChatId);
            setUnlockingChatId(null);
        }
    };

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeStories = stories.filter(s => new Date(s.timestamp) > twentyFourHoursAgo);
    
    const storiesByUser = activeStories.reduce((acc, story) => {
        if (!acc[story.userId]) acc[story.userId] = [];
        acc[story.userId].push(story);
        return acc;
    }, {} as Record<string, Story[]>);

    const usersWithStories = Object.keys(storiesByUser)
        .map(userId => users.find(u => u.id === userId))
        .filter((u): u is User => !!u);
        
    const currentUserStories = storiesByUser[currentUser?.id || ''];
    const hasCurrentUserStory = currentUserStories && currentUserStories.length > 0;

    // Filter out chats where the current user has been blocked by the partner
    const visibleChats = chats.filter(chat => {
        const partner = getChatPartner(chat);
        const partnerBlockedIds = partner.blockedUserIds || [];
        return !partnerBlockedIds.includes(currentUser?.id || '');
    });

    return (
        <div className="flex flex-col bg-system-bg text-system-text h-full">
            <header className="flex items-center justify-between p-4 border-b border-system-border">
                <h1 className="text-2xl font-bold text-purple-500">Aetheria</h1>
            </header>
            
            {settings.enableStories && (
                <div className="p-4 border-b border-system-border">
                    <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4">
                        <div className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer" onClick={hasCurrentUserStory ? () => onViewUserStories(currentUser!) : onCreateStory}>
                           <div className={`relative w-16 h-16 rounded-full p-0.5 flex items-center justify-center ${hasCurrentUserStory ? 'bg-gradient-to-tr from-yellow-400 to-purple-500' : 'bg-system-border'}`}>
                                <img src={currentUser?.avatarUrl} alt="Your Story" className="w-full h-full rounded-full border-2 border-system-bg"/>
                                {!hasCurrentUserStory && <div className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-0.5 text-white"><PlusIcon className="w-4 h-4"/></div>}
                            </div>
                            <p className="text-xs">Your Story</p>
                        </div>
                        {usersWithStories.filter(u => u.id !== currentUser?.id).map(user => (
                            <div key={user.id} className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer" onClick={() => onViewUserStories(user)}>
                               <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-500 flex items-center justify-center">
                                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full border-2 border-system-bg"/>
                                </div>
                                <p className="text-xs">{user.username}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto">
                {visibleChats.length === 0 ? (
                     <div className="text-center py-16 text-gray-500">
                        <ChatBubbleLeftRightIcon className="mx-auto w-16 h-16"/>
                        <p className="mt-4">No chats yet.</p>
                        <p className="text-sm">Start a new conversation!</p>
                    </div>
                ) : (
                    visibleChats.map(chat => {
                        const partner = getChatPartner(chat);
                        const lastMessage = messages[chat.id]?.[messages[chat.id].length - 1];
                        const isLocked = lockedChats[chat.id] && !unlockedChats.has(chat.id);
                        return (
                            <div key={chat.id} onClick={() => handleChatClick(chat.id)} className="flex items-center p-4 border-b border-system-border hover:bg-system-bg-secondary cursor-pointer transition-colors">
                                <img src={partner.avatarUrl} alt={partner.username} className="w-12 h-12 rounded-full mr-4" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold">{partner.username}</h3>
                                    <p className="text-sm text-gray-400 truncate">{isLocked ? "Chat is locked" : lastMessage?.text || "No messages yet"}</p>
                                </div>
                                {isLocked && <LockIcon className="text-gray-400 ml-2"/>}
                            </div>
                        );
                    })
                )}
            </main>
            
            <UnlockChatModal 
                isOpen={!!unlockingChatId} 
                onClose={() => setUnlockingChatId(null)} 
                onUnlock={handleUnlock}
                chatId={unlockingChatId}
            />
        </div>
    );
};

const ChatScreen: React.FC<{ chat: Chat; onBack: () => void }> = ({ chat, onBack }) => {
    const { currentUser, getChatPartner, messages, setMessages, toggleReaction, deleteMessage, clearChatHistory, updateChatSettings, settings, toggleBlockUser } = useAppContext();
    const [newMessage, setNewMessage] = useState('');
    const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const partner = getChatPartner(chat);
    const chatMessages = messages[chat.id] || [];
    const menuRef = useRef<HTMLDivElement>(null);

    const isCurrentUserBlocked = (partner.blockedUserIds || []).includes(currentUser?.id || '');
    const isPartnerBlocked = (currentUser?.blockedUserIds || []).includes(partner.id);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);
    
    useEffect(() => {
        if (!chat.disappearingMessageTimer) return;

        const interval = setInterval(() => {
            const now = new Date();
            const newMessages = (messages[chat.id] || []).filter(msg => {
                if (msg.type !== 'user' || !chat.disappearingMessageTimer) return true;
                const messageTime = new Date(msg.timestamp);
                const expiryTime = new Date(messageTime.getTime() + chat.disappearingMessageTimer * 1000);
                return now < expiryTime;
            });
            
            if (newMessages.length !== (messages[chat.id] || []).length) {
                setMessages(prev => ({...prev, [chat.id]: newMessages}));
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [chat.id, chat.disappearingMessageTimer, messages, setMessages]);


    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || isPartnerBlocked || isCurrentUserBlocked) return;
        
        const message: Message = {
            id: `msg-${chat.id}-${Date.now()}`,
            senderId: currentUser.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
            type: 'user',
        };
        setMessages(prev => ({ ...prev, [chat.id]: [...(prev[chat.id] || []), message] }));
        setNewMessage('');
    };
    
    const EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎'];

    const filteredMessages = chatMessages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-yellow-400 text-black rounded">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const handleConfirmClearHistory = () => {
        clearChatHistory(chat.id);
        setIsClearConfirmOpen(false);
    };

    const handleConfirmBlock = () => {
        toggleBlockUser(partner.id);
        setIsBlockConfirmOpen(false);
        setIsMenuOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-system-bg text-system-text">
            <header className="flex items-center justify-between p-3 border-b border-system-border bg-system-bg-secondary sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-system-border"><ArrowLeftIcon /></button>
                    <img src={partner.avatarUrl} alt={partner.username} className="w-10 h-10 rounded-full mr-3" />
                    <div>
                        <h2 className="font-semibold">{partner.username}</h2>
                        <p className="text-xs text-gray-400">Online</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsSearching(!isSearching)} className="p-2 rounded-full hover:bg-system-border">
                        <MagnifyingGlassIcon />
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-system-border">
                            <EllipsisVerticalIcon />
                        </button>
                        {isMenuOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-system-bg-secondary border border-system-border rounded-lg shadow-xl z-20 animate-fadeIn">
                                <button onClick={() => { setIsDisappearingModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-system-border flex items-center"><ClockIcon className="mr-2"/> Disappearing Messages</button>
                                <button onClick={() => { setIsBlockConfirmOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-system-border flex items-center"><UserMinusIcon className="mr-2"/> Block {partner.username}</button>
                                <button onClick={() => { setIsClearConfirmOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-system-border flex items-center"><TrashIcon className="mr-2"/> Clear Chat History</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {isSearching && (
                <div className="p-2 border-b border-system-border">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in chat..."
                        className="w-full p-2 bg-system-bg border border-system-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-system-text"
                    />
                </div>
            )}
            
             <div className="bg-yellow-900/30 text-yellow-400 text-xs text-center p-2 flex items-center justify-center">
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Messages are end-to-end encrypted. No one outside of this chat, not even Aetheria, can read them.
            </div>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredMessages.map(message => {
                    if (message.type === 'system') {
                        return (
                            <div key={message.id} className="text-center text-xs text-gray-400 my-2">
                                <div className="inline-block bg-system-bg-secondary px-2 py-1 rounded-full">
                                    <ShieldExclamationIcon className="w-4 h-4 inline mr-1"/>
                                    {message.text}
                                </div>
                            </div>
                        )
                    }
                    const isSender = message.senderId === currentUser?.id;
                    return (
                        <div key={message.id} className={`flex group ${isSender ? 'justify-end' : 'justify-start'}`}>
                            <div className={`relative max-w-sm lg:max-w-md px-4 py-2 rounded-2xl ${isSender ? 'bg-purple-600 text-white rounded-br-lg' : 'bg-system-bg-secondary rounded-bl-lg'}`}>
                                <div className="absolute top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity" style={isSender ? { left: '-5rem' } : { right: '-3rem' }}>
                                    <button onClick={() => setReactingToMessageId(reactingToMessageId === message.id ? null : message.id)} className="p-1 rounded-full hover:bg-system-border text-system-text"><FaceSmileIcon className="w-5 h-5"/></button>
                                    {isSender && <button onClick={() => deleteMessage(chat.id, message.id)} className="p-1 rounded-full hover:bg-system-border text-system-text"><TrashIcon className="w-5 h-5"/></button>}
                                </div>
                                
                                {reactingToMessageId === message.id && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-system-bg-secondary p-1 rounded-full shadow-lg flex space-x-1 z-20">
                                        {EMOJIS.map(emoji => <button key={emoji} onClick={() => { toggleReaction(chat.id, message.id, emoji); setReactingToMessageId(null);}} className="text-xl p-1 rounded-full hover:bg-system-border transition-transform hover:scale-125">{emoji}</button>)}
                                    </div>
                                )}
                                
                                <p className="text-sm break-words">{highlightText(message.text, searchQuery)}</p>
                                <div className="text-xs mt-1 opacity-70 flex items-center justify-end">
                                    {message.edited && <span className="mr-1">edited</span>}
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {message.reactions && message.reactions.length > 0 && (
                                    <div className="absolute -bottom-4 right-2 flex space-x-1">
                                        {message.reactions.map(r => (
                                            <div key={r.emoji} className="bg-system-bg-secondary text-xs px-2 py-0.5 rounded-full shadow border border-system-border">{r.emoji} {r.userIds.length}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

             <footer className="p-3 border-t border-system-border bg-system-bg-secondary">
                {isPartnerBlocked ? (
                    <div className="text-center p-2 bg-red-900/30 text-red-400 rounded-lg">
                        <p className="text-sm font-semibold">You blocked {partner.username}.</p>
                        <button onClick={() => toggleBlockUser(partner.id)} className="text-sm underline">Unblock</button>
                    </div>
                ) : isCurrentUserBlocked ? (
                    <div className="text-center p-2 bg-gray-700 text-gray-400 rounded-lg">
                        <p className="text-sm">You can't reply to this conversation.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 p-3 bg-system-bg border border-system-border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-system-text"
                        />
                        <button type="submit" className="bg-purple-600 text-white rounded-full p-3 hover:bg-purple-700 transition-colors">
                            <SendIcon />
                        </button>
                    </form>
                )}
            </footer>
            
            <DisappearingMessagesModal
                isOpen={isDisappearingModalOpen}
                onClose={() => setIsDisappearingModalOpen(false)}
                chat={chat}
                onTimerSelect={(timer) => updateChatSettings(chat.id, timer)}
            />
            
            <Modal
                isOpen={isClearConfirmOpen}
                onClose={() => setIsClearConfirmOpen(false)}
                title="Clear Chat History?"
            >
                <p className="text-gray-400 mb-6">Are you sure you want to permanently delete all messages in this chat?</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={() => setIsClearConfirmOpen(false)} className="px-4 py-2 rounded-lg bg-system-bg text-system-text hover:bg-system-border">Cancel</button>
                    <button onClick={handleConfirmClearHistory} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
                </div>
            </Modal>
            
            <Modal
                isOpen={isBlockConfirmOpen}
                onClose={() => setIsBlockConfirmOpen(false)}
                title={`Block ${partner.username}?`}
            >
                <p className="text-gray-400 mb-6">Blocked users will no longer be able to send you messages or find your profile.</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={() => setIsBlockConfirmOpen(false)} className="px-4 py-2 rounded-lg bg-system-bg text-system-text hover:bg-system-border">Cancel</button>
                    <button onClick={handleConfirmBlock} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Block</button>
                </div>
            </Modal>
        </div>
    );
};

const DiscoverScreen: React.FC<{ onViewUser: (user: User) => void }> = ({ onViewUser }) => {
    const { posts, users } = useAppContext();
    const publicUsers = users.filter(u => u.profileIsPublic);
    const publicUserIds = new Set(publicUsers.map(u => u.id));
    const publicPosts = posts.filter(p => publicUserIds.has(p.userId));

    const getUserForPost = (userId: string) => users.find(u => u.id === userId);

    return (
        <div className="bg-system-bg text-system-text min-h-full">
            <header className="p-4 border-b border-system-border">
                <h1 className="text-2xl font-bold text-purple-500">Discover</h1>
                <p className="text-sm text-gray-400">Posts from public profiles</p>
            </header>
            <main className="p-4 space-y-8">
                {publicPosts.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <GlobeAltIcon className="mx-auto w-16 h-16"/>
                        <p className="mt-4">No public posts to show right now.</p>
                    </div>
                ) : (
                    publicPosts.map(post => {
                        const user = getUserForPost(post.userId);
                        if (!user) return null;
                        return (
                            <div key={post.id} className="bg-system-bg-secondary rounded-2xl overflow-hidden shadow-lg">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full mr-3" />
                                        <span className="font-semibold">{user.username}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleDateString()}</p>
                                </div>
                                <img src={post.imageUrl} alt={post.caption} className="w-full object-cover"/>
                                <div className="p-4">
                                    <p>{post.caption}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
};

const SettingsScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { settings, updateSettings, currentUser, changeSecurityCode, users, toggleBlockUser } = useAppContext();
    const { theme, setTheme } = useTheme();
    const [isBlockedUsersModalOpen, setBlockedUsersModalOpen] = useState(false);
    
    if (!currentUser) return null;

    const handleSecurityCodeChange = () => {
        if (window.confirm("Are you sure you want to reset your security code? This will notify your contacts.")) {
            changeSecurityCode(currentUser.id);
            alert("Security code has been reset.");
        }
    };
    
    const blockedUsers = users.filter(user => (currentUser.blockedUserIds || []).includes(user.id));

    return (
        <div className="bg-system-bg text-system-text min-h-full">
             <header className="p-4 border-b border-system-border">
                <h1 className="text-2xl font-bold text-purple-500">Settings</h1>
            </header>
            <main className="p-4 space-y-8">
                <div className="flex items-center space-x-4">
                    <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-16 h-16 rounded-full"/>
                    <div>
                        <h2 className="text-xl font-bold">{currentUser.username}</h2>
                        <p className="text-gray-400">Your personal account</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-400 text-sm">APPEARANCE</h3>
                    <div className="bg-system-bg-secondary p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span>Theme</span>
                            <div className="flex items-center space-x-2 p-1 bg-system-bg rounded-full">
                                {(['light', 'dark', 'system'] as Theme[]).map(t => (
                                    <button key={t} onClick={() => setTheme(t)} className={`p-1.5 rounded-full capitalize text-xs transition-colors ${theme === t ? 'bg-purple-600 text-white' : 'hover:bg-system-border'}`}>
                                        {t === 'light' ? <SunIcon /> : t === 'dark' ? <MoonIcon /> : <ComputerDesktopIcon />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-400 text-sm">PRIVACY & SECURITY</h3>
                     <div className="bg-system-bg-secondary p-4 rounded-lg space-y-4 divide-y divide-system-border">
                        <div className="flex justify-between items-center pt-2">
                           <div>
                                <p>Public Profile</p>
                                <p className="text-xs text-gray-400">Allow others to see your posts and stories on the Discover page.</p>
                           </div>
                           <Toggle enabled={settings.profileIsPublic} onChange={val => updateSettings({ profileIsPublic: val })} />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                           <div>
                                <p>Enable Biometric Unlock</p>
                                <p className="text-xs text-gray-400">Use fingerprint or face ID to unlock chats.</p>
                           </div>
                           <Toggle enabled={settings.enableBiometrics} onChange={val => updateSettings({ enableBiometrics: val })} />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                           <div>
                                <p>Show Security Notifications</p>
                                <p className="text-xs text-gray-400">Be notified when a contact's security code changes.</p>
                           </div>
                           <Toggle enabled={settings.showSecurityNotifications} onChange={val => updateSettings({ showSecurityNotifications: val })} />
                        </div>
                         <div className="pt-4">
                             <button onClick={() => setBlockedUsersModalOpen(true)} className="w-full text-left text-purple-500 hover:underline">
                                Blocked Users...
                            </button>
                        </div>
                        <div className="pt-4">
                             <button onClick={handleSecurityCodeChange} className="w-full text-left text-purple-500 hover:underline">
                                Reset Security Code...
                            </button>
                        </div>
                     </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-400 text-sm">FEATURES</h3>
                    <div className="bg-system-bg-secondary p-4 rounded-lg space-y-4 divide-y divide-system-border">
                         <div className="flex justify-between items-center pt-2">
                           <p>Enable Posts</p>
                           <Toggle enabled={settings.enablePosts} onChange={val => updateSettings({ enablePosts: val })} />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                           <p>Enable Stories</p>
                           <Toggle enabled={settings.enableStories} onChange={val => updateSettings({ enableStories: val })} />
                        </div>
                    </div>
                </div>

                <div>
                     <button onClick={onLogout} className="w-full bg-red-600/20 text-red-500 font-bold py-3 px-4 rounded-lg hover:bg-red-600/30 transition duration-300">
                        Log Out
                    </button>
                </div>
            </main>
            <Modal
                isOpen={isBlockedUsersModalOpen}
                onClose={() => setBlockedUsersModalOpen(false)}
                title="Blocked Users"
            >
                {blockedUsers.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {blockedUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-system-bg p-2 rounded-lg">
                                <div className="flex items-center">
                                    <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full mr-3"/>
                                    <span>{user.username}</span>
                                </div>
                                <button onClick={() => toggleBlockUser(user.id)} className="text-sm text-purple-500 hover:underline">Unblock</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400">You haven't blocked anyone.</p>
                )}
            </Modal>
        </div>
    );
};

const App = () => {
    const { currentUser, logout, chats, stories, settings } = useAppContext();
    useTheme();
    const [page, setPage] = useState<Page>('home');
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [isCreateStoryModalOpen, setCreateStoryModalOpen] = useState(false);
    const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);
    const [viewingUserStories, setViewingUserStories] = useState<{user: User, stories: Story[]} | null>(null);

    if (!currentUser) {
        return <LoginScreen />;
    }

    const handleSelectChat = (chatId: string) => {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            setActiveChat(chat);
            setPage('chat');
        }
    };
    
    const handleBackToHome = () => {
        setActiveChat(null);
        setPage('home');
    };

    const handleViewUserStories = (user: User) => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const userStories = stories.filter(s => s.userId === user.id && new Date(s.timestamp) > twentyFourHoursAgo);
        if (userStories.length > 0) {
            setViewingUserStories({ user, stories: userStories.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) });
        }
    };
    
    const renderPage = () => {
        if (page === 'chat' && activeChat) {
            return <ChatScreen chat={activeChat} onBack={handleBackToHome} />;
        }
        switch(page) {
            case 'discover':
                return <DiscoverScreen onViewUser={() => { /* Not implemented */ }}/>;
            case 'settings':
                return <SettingsScreen onLogout={logout} />;
            case 'home':
            default:
                return <HomeScreen 
                            onSelectChat={handleSelectChat} 
                            onCreateStory={() => setCreateStoryModalOpen(true)}
                            onViewUserStories={handleViewUserStories}
                        />;
        }
    };

    const navItems: { page: Page; icon: React.ReactNode; show: boolean }[] = [
      { page: 'home', icon: <ChatBubbleLeftRightIcon />, show: true },
      { page: 'discover', icon: <GlobeAltIcon />, show: settings.enablePosts },
      { page: 'settings', icon: <CogIcon />, show: true },
    ];
    
    const visibleNavItems = navItems.filter(item => item.show);


    return (
        <div className="h-screen w-screen max-w-lg mx-auto flex flex-col font-sans bg-system-bg-secondary shadow-2xl">
           <div className="flex-1 overflow-y-auto relative">
               {renderPage()}
           </div>
           {page !== 'chat' && (
             <nav className="flex justify-around items-center bg-system-bg border-t border-system-border p-2">
                  {settings.enablePosts && (
                     <button onClick={() => setCreatePostModalOpen(true)} className={`p-3 rounded-xl transition-colors text-white bg-purple-600 hover:bg-purple-700`}>
                          <PlusIcon />
                      </button>
                  )}
                  {visibleNavItems.map(item => (
                      <button key={item.page} onClick={() => setPage(item.page)} className={`p-3 rounded-xl transition-colors ${page === item.page ? 'text-purple-500 bg-purple-500/10' : 'text-gray-400 hover:text-purple-500'}`}>
                          {item.icon}
                      </button>
                  ))}
             </nav>
           )}
           <CreateStoryModal isOpen={isCreateStoryModalOpen} onClose={() => setCreateStoryModalOpen(false)} />
           <CreatePostModal isOpen={isCreatePostModalOpen} onClose={() => setCreatePostModalOpen(false)} />

           {viewingUserStories && (
               <StoryViewerModal
                    user={viewingUserStories.user}
                    stories={viewingUserStories.stories}
                    onClose={() => setViewingUserStories(null)}
               />
           )}
        </div>
    );
};

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
