import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import SupabaseTest from './components/SupabaseTest';
import { ThemeProvider } from 'next-themes';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="tradepro-theme">
      <RouterProvider router={router} />
      <Toaster />
      <SupabaseTest />
    </ThemeProvider>
  );
}

export default App;