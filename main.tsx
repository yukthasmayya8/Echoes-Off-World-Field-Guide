import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DebriefPreview } from './dev/DebriefPreview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DebriefPreview />
  </StrictMode>,
);
