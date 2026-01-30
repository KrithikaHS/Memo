import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/localClient';
import { isPast } from 'date-fns';
import { useToast } from './ui/use-toast';

export function NotificationManager() {
    const { data: reminders = [], isLoading } = useQuery({
        queryKey: ['reminders'],
        queryFn: () => base44.Reminder.list(),
        refetchInterval: 30000, // Check every 30s
    });

    const { data: laundryLoads = [] } = useQuery({
        queryKey: ['laundryLoads'],
        queryFn: () => base44.LaundryLoad.list(),
        refetchInterval: 3600000, // Check every hour
    });

    const { toast } = useToast();
    const [permission, setPermission] = useState('default');
    const notifiedRef = useRef(new Set());
    const hasCheckedMissed = useRef(false);

    useEffect(() => {
        try {
            if (!("Notification" in window)) {
                // Safely ignore if not supported
                return;
            }
            setPermission(Notification.permission);
        } catch (e) {
            console.warn("Notification API access failed", e);
        }
    }, []);

    const requestPermission = () => {
        if (!("Notification" in window)) return;
        try {
            Notification.requestPermission().then((p) => {
                setPermission(p);
                if (p === 'granted') {
                    toast({
                        title: "Notifications Enabled",
                        description: "You'll receive alerts for your reminders.",
                    });
                }
            }).catch(err => console.error("Permission request failed", err));
        } catch (e) {
            console.error("Notification API error", e);
        }
    };

    const sendNotification = (title, options) => {
        try {
            if (!("Notification" in window) || Notification.permission !== "granted") return;
            new Notification(title, options);
        } catch (e) {
            console.error("Failed to send notification", e);
        }
    };

    // Auto-request permission on first interaction logic could go here, 
    // but for now we just respect the current state to avoid crashes.
    // Ideally, stick a "Enable Notifications" button in UI, but user didn't ask for UI changes.
    // We will just try to request if not denied, but only once/safely.

    useEffect(() => {
        if (permission === 'default' && "Notification" in window) {
            // Some mobile browsers crash if you call this without user gesture.
            // Safe to skip auto-request or wrap in try-catch.
            // decided: skip auto-request on mount to prevent mobile crash. 
            // Only check permission state.
        }
    }, [permission]);


    useEffect(() => {
        // Wait for permission and data loading
        if (permission !== "granted") return;
        if (isLoading) return;

        const now = new Date();

        // 1. Check for missed reminders on initial load (only once)
        if (!hasCheckedMissed.current && reminders.length > 0) {
            const missedReminders = reminders.filter(r =>
                !r.completed &&
                r.due_date &&
                isPast(new Date(r.due_date)) &&
                // Only notify if missed within the last 24 hours to avoid ancient spam
                (now - new Date(r.due_date) < 24 * 60 * 60 * 1000)
            );

            if (missedReminders.length > 0) {
                sendNotification("Missed Reminders", {
                    body: `You have ${missedReminders.length} overdue reminders.`,
                    icon: '/vite.svg'
                });
                // Mark them as notified so we don't buzz again
                missedReminders.forEach(r => notifiedRef.current.add(r.id));
            }
            hasCheckedMissed.current = true;
        }

        // 2. Check for reminders active right now
        reminders.forEach(reminder => {
            if (!reminder.completed && reminder.due_date) {
                const dueDate = new Date(reminder.due_date);
                const diff = Math.abs(now - dueDate);

                // Notify if within a 1-minute window
                if (diff < 60000 && !notifiedRef.current.has(reminder.id)) {
                    sendNotification("Reminder", {
                        body: reminder.title,
                        icon: '/vite.svg',
                        requireInteraction: true
                    });
                    notifiedRef.current.add(reminder.id);
                }
            }
        });

        // 3. Check Laundry
        try {
            const lastLaundryNotify = localStorage.getItem('lastLaundryNotify');
            const today = new Date().toDateString();

            if (lastLaundryNotify !== today) {
                const pendingLaundry = laundryLoads.filter(l => l.status !== 'complete');
                if (pendingLaundry.length > 0) {
                    sendNotification("Laundry Reminder", {
                        body: `You have ${pendingLaundry.length} pending laundry loads.`,
                        icon: '/vite.svg'
                    });
                    localStorage.setItem('lastLaundryNotify', today);
                }
            }
        } catch (e) {
            console.warn("Storage access failed", e);
        }

    }, [reminders, laundryLoads, permission, isLoading]);

    return null;
}
