/**
 * App.tsx
 *
 * Root application component.
 * Composes the main two-column layout:
 *   ┌─────────────┬──────────────────────────┐
 *   │  Sidebar    │      ChatWindow          │
 *   │  (300px)    │      (flex: 1)           │
 *   └─────────────┴──────────────────────────┘
 */

import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
