import { ThemeProvider } from './Components/ThemeProvider';
import { Toaster } from './Components/ui/toaster';

export default function Layout({ children }) {
  return (
    <ThemeProvider storageKey="memo-ui-theme">
      <div className="min-h-[100dvh] bg-background text-foreground antialiased transition-colors duration-300">
        <style>{`
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          
          ::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
          }
        `}</style>
        {children}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}