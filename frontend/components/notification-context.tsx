'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { addToast } from "@heroui/toast";
import { getUserFromClient } from "@/app/lib/client-session";
import { getPracticeById } from '@/app/actions/practice';
import { Button } from '@heroui/button';
import { DocumentIcon } from '@heroicons/react/24/solid';
import { Link } from '@heroui/link';

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

  // Get stored notifications from localStorage
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications);
      setNotifications(parsedNotifications);
      setUnreadCount(parsedNotifications.filter((n: NotificationType) => !n.read).length);
      setHasNewCorrected(parsedNotifications.some((n: NotificationType) => !n.read && n.type === 'CORRECTED'));
    }
  }, []);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUserFromClient();
        if (user && user.niub) {
          setUserNiub(user.niub);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  // Set up real-time subscription when userNiub is available
  useEffect(() => {
    if (!userNiub) return;

    // Subscribe to changes in practiceuserslink where userNiub matches
    const subscription = supabase
      .channel('practicesuserslink-changes')
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
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userNiub]);

  // Handle new notification
  const handleNewNotification = async (data: any) => {
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
        localStorage.setItem('notifications', JSON.stringify(updated));
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
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      );
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
    updateCorrectedFlag();
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
    setHasNewCorrected(false);
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setHasNewCorrected(false);
    localStorage.removeItem('notifications');
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};