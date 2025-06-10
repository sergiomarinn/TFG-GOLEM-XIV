'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { addToast } from "@heroui/toast";
import { getUserFromClient } from "@/app/lib/client-session";
import { getPracticeById } from '@/app/actions/practice';
import { Button } from '@heroui/button';
import { DocumentIcon } from '@heroicons/react/24/solid';
import { Link } from '@heroui/link';
import { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationType = {
  id: string;
  message: string;
  type: 'CORRECTING' | 'CORRECTED' | 'REJECTED';
  practiceId: string;
  practiceName: string;
  read: boolean;
  timestamp: string;
}

type NotificationContextType = {
  notifications: NotificationType[];
  unreadCount: number;
  hasNewCorrected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  fetchUser: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewCorrected, setHasNewCorrected] = useState(false);
  const [userNiub, setUserNiub] = useState<string | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CORRECTING':
				return (
					<DocumentIcon className="size-5 text-primary-500"/>
				)
      case 'CORRECTED':
				return (
					<DocumentIcon className="size-5 text-success-500"/>
				)
      case 'REJECTED':
				return (
					<DocumentIcon className="size-5 text-danger-500"/>
				)
      default:
				return (
					<DocumentIcon className="size-5 text-default-500"/>
				)
    }
  };

  const getNotificationStorageKey = (niub: string) => `notifications_${niub}`;

  const loadUserNotifications = (niub: string) => {
    const storageKey = getNotificationStorageKey(niub);
    const storedNotifications = localStorage.getItem(storageKey);
    
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter((n: NotificationType) => !n.read).length);
        setHasNewCorrected(parsedNotifications.some((n: NotificationType) => !n.read && n.type === 'CORRECTED'));
      } catch (error) {
        console.error('Error parsing stored notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
        setHasNewCorrected(false);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setHasNewCorrected(false);
    }
  };

  const saveUserNotifications = (niub: string, notificationsList: NotificationType[]) => {
    const storageKey = getNotificationStorageKey(niub);
    localStorage.setItem(storageKey, JSON.stringify(notificationsList));
  };

  const cleanupSubscription = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  const resetNotificationState = () => {
    setNotifications([]);
    setUnreadCount(0);
    setHasNewCorrected(false);
    cleanupSubscription();
  };

  const fetchUser = async () => {
    try {
      const user = await getUserFromClient();
      const newUserNiub = user?.niub || null;
      
      // If user changed, reset state and load new user's notifications
      if (newUserNiub !== userNiub) {
        if (userNiub) {
          // User changed, reset everything
          resetNotificationState();
        }
        
        setUserNiub(newUserNiub);
        
        if (newUserNiub) {
          loadUserNotifications(newUserNiub);
        }
      }        
    } catch (error) {
      console.error('Error fetching user:', error);
      setUserNiub(null);
      resetNotificationState();
    }
  }

  // Get current user and handle user changes
  useEffect(() => {
    fetchUser();
  }, []);

  // Set up real-time subscription when userNiub changes
  useEffect(() => {
    if (!userNiub) return;

    // Subscribe to changes in practiceuserslink where userNiub matches
    const channel = supabase
      .channel(`practicesuserslink-changes-${userNiub}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'practicesuserslink',
          filter: `user_niub=eq.${userNiub}`,
        },
        (payload) => {
          const { new: newRow } = payload;
          
          // Check if status is one of the notification types
          if (['CORRECTING', 'CORRECTED', 'REJECTED'].includes(newRow.status)) {
            handleNewNotification(newRow);
          }
        }
      )

    subscriptionRef.current = channel;
    channel.subscribe();

    return () => {
      cleanupSubscription();
    };
  }, [userNiub]);

  // Handle new notification
  const handleNewNotification = async (data: any) => {
    if (!userNiub) return;

		try {
			const practiceData = await getPracticeById(data.practice_id)

      // Create notification object
      const notification: NotificationType = {
        id: `${Date.now()}`,
        message: getNotificationMessage(data.status),
        type: data.status,
        practiceId: data.practice_id,
        practiceName: practiceData?.name || 'Unknown Practice',
        read: false,
        timestamp: new Date().toISOString(),
      };

      // Update state with new notification
      setNotifications(prev => {
        const updated = [notification, ...prev];
        saveUserNotifications(userNiub, updated);
        return updated;
      });
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Set corrected flag if applicable
      if (data.status === 'CORRECTED') {
        setHasNewCorrected(true);
      }

      // Show toast notification
      addToast({
        title: `Pràctica ${notification.practiceName}`,
        description: notification.message,
        color: getToastVariant(data.status),
				timeout: 10000,
				icon: (
					getNotificationIcon(data.status)
				),
				endContent: (
					<Button 
						size="sm"
            as={Link}
						variant="flat" 
						color={getToastVariant(data.status)}
            href={`/practices/${data.practice_id}`}
					>
						Anar
					</Button>
				)
      });
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  // Helper functions for notification text and styling
  const getNotificationMessage = (status: string): string => {
    switch (status) {
      case 'CORRECTING':
        return 'La teva pràctica està sent corregida';
      case 'CORRECTED':
        return 'La teva pràctica ha sigut corregida';
      case 'REJECTED':
        return 'La teva pràctica ha sigut rebutjada';
      default:
        return 'Notificació de pràctica';
    }
  };

  const getToastVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'CORRECTING':
        return 'warning';
      case 'CORRECTED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    if (!userNiub) return;
    
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      );
      saveUserNotifications(userNiub, updated);
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
    updateCorrectedFlag();
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    if (!userNiub) return;

    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      saveUserNotifications(userNiub, updated);
      return updated;
    });
    setUnreadCount(0);
    setHasNewCorrected(false);
  };

  // Clear all notifications
  const clearNotifications = () => {
    if (!userNiub) return;

    const storageKey = getNotificationStorageKey(userNiub);
    setNotifications([]);
    setUnreadCount(0);
    setHasNewCorrected(false);
    localStorage.removeItem(storageKey);
  };

  // Update corrected flag when notifications change
  const updateCorrectedFlag = () => {
    const hasCorrected = notifications.some(n => !n.read && n.type === 'CORRECTED');
    setHasNewCorrected(hasCorrected);
  };

  const value = {
    notifications,
    unreadCount,
    hasNewCorrected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    fetchUser
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};