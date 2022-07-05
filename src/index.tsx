import * as ReactDOMClient from 'react-dom/client';
import App from './App';
import { RecoilRoot } from 'recoil';
import { StrictMode } from 'react';

const rootElement = document.getElementById('root')!;
const root = ReactDOMClient.createRoot(rootElement);

root.render(
  <RecoilRoot>
    <StrictMode>
      <App />
    </StrictMode>
  </RecoilRoot>,
);
