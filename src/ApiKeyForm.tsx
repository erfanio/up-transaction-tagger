import React, { useState } from 'react';
import './ApiKeyForm.css';

type ApiKeyFormProps = {
  onSubmit: (apiKey: string) => void;
};
export default function ApiKeyForm({ onSubmit }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(apiKey);
  };

  return (
    <form onSubmit={handleSubmit} className="api-form">
      <label>
        Personal Access Token
        <input
          type="text"
          name="api-key"
          placeholder="up:yeah:aBcDeFgHiJkLmNoP12345"
          value={apiKey}
          onChange={handleChange}
        />
      </label>
      <input type="submit" value="Let's Get Started" />
    </form>
  );
}
