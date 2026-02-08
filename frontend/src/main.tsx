import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './routes/index.tsx'
import './styles/globals.css'

// Setup event listener to prevent dropdown menus from closing when clicking on
// elements with data-ignore-click-outside attribute
document.addEventListener(
  'pointerdown',
  (e) => {
    const target = e.target as HTMLElement;
    // Check if the click is on an element marked to ignore click-outside
    if (target.closest('[data-ignore-click-outside]')) {
      // Prevent the default event from propagating to Radix UI's event listeners
      // by using a custom flag that components can check
      (e as any).__ignoreClickOutside = true;
    }
  },
  true // capture phase to intercept before Radix UI
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
