import * as ReactDOMClient from 'react-dom/client';
import App from './App';
import { RecoilRoot } from 'recoil';
import { StrictMode } from 'react';
import './vendor/normalize.css';
import './index.css';

const rootElement = document.getElementById('root')!;
const root = ReactDOMClient.createRoot(rootElement);

root.render(
  <RecoilRoot>
    <StrictMode>
      <App />
    </StrictMode>
  </RecoilRoot>,
);
