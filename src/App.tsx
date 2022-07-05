import { apiKeyState } from './api_client';
import { useRecoilState } from 'recoil';
import React, { useState } from 'react';
import Accounts from './Accounts';
import ActionBar from './ActionBar';
import Filters from './Filters';

import './styles.css';

type ApiKeyFormProps = {
  onSubmit: (apiKey: string) => void;
};
function ApiKeyForm({ onSubmit }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(apiKey);
    onSubmit(apiKey);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="api-key"
        placeholder="API KEY"
        value={apiKey}
        onChange={handleChange}
      />
      <input type="submit" />
    </form>
  );
}

type WithApiKeyProps = {
  children: React.ReactElement;
};
function WithApiKey({ children }: WithApiKeyProps) {
  const [apiKey, setApiKey] = useRecoilState(apiKeyState);

  const handleSubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  if (apiKey) {
    return children;
  }
  return <ApiKeyForm onSubmit={handleSubmit} />;
}

export default function App() {
  return (
    <WithApiKey>
      <React.Suspense fallback={<p>Loading accounts...</p>}>
        <Filters />
        <Accounts />
        <ActionBar />
      </React.Suspense>
    </WithApiKey>
  );
}
