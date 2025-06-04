'use client'

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { BellIcon } from "@heroicons/react/24/outline";
import { DocumentIcon } from "@heroicons/react/24/solid";
import { useNotifications, NotificationType } from "@/components/notification-context";
import { formatDistanceToNow } from "date-fns";
import { ca } from "date-fns/locale";
import { useRouter } from "next/navigation";

export const NotificationPopover = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

  // Group notifications by type
  const unread = notifications.filter(n => !n.read);
  const all = notifications;

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CORRECTING':
				return (
					<div className="mt-0.5 rounded-full bg-warning-100 p-2">
						<DocumentIcon className="size-5 text-warning-500"/>
					</div>
				)
      case 'CORRECTED':
				return (
					<div className="mt-0.5 rounded-full bg-success-100 p-2">
						<DocumentIcon className="size-5 text-success-500"/>
					</div>
				)
      case 'REJECTED':
				return (
					<div className="mt-0.5 rounded-full bg-danger-100 p-2">
						<DocumentIcon className="size-5 text-danger-500"/>
					</div>
				)
      default:
				return (
					<div className="mt-0.5 rounded-full bg-default-100 p-2">
						<DocumentIcon className="size-5 text-default-500"/>
					</div>
				)
    }
  };

  // Format timestamp
  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ca });
    } catch (error) {
      return 'fa poc';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
		else {
			setIsOpen(false);
			router.push(`/practices/${notification.practiceId}`);
		}
  };

  return (
		<Badge
			content={unreadCount > 99 ? "99+" : unreadCount} 
			color="danger" 
			size="sm"
			shape="circle"
			isInvisible={unreadCount < 1}
			showOutline={false}
		>
			<Popover 
				placement="bottom-end" 
				isOpen={isOpen} 
				onOpenChange={setIsOpen}
			>
				<PopoverTrigger>
					<Button
						isIconOnly
						radius="full"
						variant="bordered"
						className="border-small relative"
						aria-label="Notificacions"
					>
						<BellIcon className="size-5" />
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<div className="px-1 py-2">
						<div className="flex justify-between items-center mb-2 gap-3">
							<h3 className="text-lg font-medium">Notificacions</h3>
							<div className="flex gap-1">
								<Button 
									size="sm" 
									variant="light" 
									onPress={markAllAsRead}
									isDisabled={unreadCount === 0}
								>
									Marcar tot com llegit
								</Button>
								<Button 
									size="sm" 
									color="danger" 
									variant="flat" 
									onPress={clearNotifications}
									isDisabled={notifications.length === 0}
								>
									Netejar tot
								</Button>
							</div>
						</div>
						
						<Divider className="my-2" />
						
						<Tabs aria-label="Tabs de notificacions" className="w-full">
							<Tab key="unread" title={`No llegides (${unread.length})`}>
								<ScrollShadow className="h-[300px]">
									{unread.length === 0 ? (
										<div className="p-4 text-center text-default-400">
											No tens notificacions no llegides
										</div>
									) : (
										<ul className="space-y-2 p-1">
											{unread.map((notification) => (
												<li key={notification.id}>
													<button
														type="button"
														className="p-2 rounded-lg hover:bg-default-100 transition-colors w-full text-left"
														onClick={() => handleNotificationClick(notification)}
													>
														<div className="flex gap-2">
															<div className="flex-shrink-0">
																{getNotificationIcon(notification.type)}
															</div>
															<div className="flex-1 min-w-0">
																<p className="text-sm font-semibold truncate">{notification.practiceName}</p>
																<p className="text-xs text-default-500">{notification.message}</p>
																<p className="text-xs text-default-400 mt-1">{formatTimeAgo(notification.timestamp)}</p>
															</div>
														</div>
													</button>
												</li>
											))}
										</ul>
									)}
								</ScrollShadow>
							</Tab>
							<Tab key="all" title={`Totes (${all.length})`}>
								<ScrollShadow className="h-[300px]">
									{all.length === 0 ? (
										<div className="p-4 text-center text-default-400">
											No tens notificacions
										</div>
									) : (
										<ul className="space-y-2 p-1">
											{all.map((notification) => (
												<li key={notification.id}>
													<button
														className={`p-2 rounded-lg ${!notification.read ? 'bg-default-100/80' : ''} hover:bg-default-100 transition-colors w-full text-left`}
														onClick={() => handleNotificationClick(notification)}
													>
														<div className="flex gap-2">
															<div className="flex-shrink-0">
																{getNotificationIcon(notification.type)}
															</div>
															<div className="flex-1 min-w-0">
																<p className="text-sm font-semibold truncate">{notification.practiceName}</p>
																<p className="text-xs text-default-500">{notification.message}</p>
																<p className="text-xs text-default-400 mt-1">{formatTimeAgo(notification.timestamp)}</p>
															</div>
														</div>
													</button>
												</li>
											))}
										</ul>
									)}
								</ScrollShadow>
							</Tab>
						</Tabs>
					</div>
				</PopoverContent>
			</Popover>
		</Badge>
  );
};