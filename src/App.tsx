import React, { Component } from 'react';
import Accounts from './Accounts';
import ActionBar from './ActionBar';
import Filters from './Filters';
import Search from './Search';
import ApiKeyForm from './ApiKeyForm';
import { apiKeyState } from './data/apiKey';
import { FetchError } from './data/fetch';
import { useRecoilState } from 'recoil';
import './App.css';

type DisplayErrorsProps = {
  setApiKey: (apiKey: string) => void;
  children: React.ReactElement;
};
type DisplayErrorsState = {
  caughtError?: any;
};
class DisplayErrors extends Component<DisplayErrorsProps, DisplayErrorsState> {
  state: DisplayErrorsState = { caughtError: undefined };

  static getDerivedStateFromError(error: any) {
    return { caughtError: error };
  }

  onApiKeySubmit = (apiKey: string) => {
    this.setState({ caughtError: undefined });
    this.props.setApiKey(apiKey);
  }

  render() {
    const { caughtError } = this.state;
    if (caughtError) {
      if (caughtError instanceof FetchError && caughtError.errorDetails.status == '401') {
        return (
          <div className="card text error">
            <h1>Auth Error</h1>
            <p>
              Uh oh, looks like your personal access token isn't working. Up API
              returned this error.
            </p>
            <pre>{JSON.stringify(caughtError.errorDetails, null, 2)}</pre>
            <h2>Update Your Personal Access Token</h2>
            <p>
              Maybe there was a typo, try setting your personal access token
              again. If that still doesn't work, generate a new one from{' '}
              <a href="https://api.up.com.au/getting_started" target="_blank">
                api.up.com.au
              </a>
              .
            </p>
            <ApiKeyForm onSubmit={this.onApiKeySubmit} />
          </div>
        );
      }

      return (
        <div className="card text error">
          <h1>Unknown Error</h1>
          <p>Uh oh, something went wrong. Refresh this page to reset.</p>
          <p>
            Maybe to take screenshot of this error and create an issue on Github,{' '}
            <a href="https://github.com/erfanio/up-transaction-tagger/issues" target="_blank">
              github.com/erfanio/up-transaction-tagger/issues
            </a>
          </p>
          <pre>{JSON.stringify(caughtError, null, 2)}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [apiKey, setApiKey] = useRecoilState(apiKeyState);

  return (
    <div className="app">
      <DisplayErrors setApiKey={setApiKey}>
        {!apiKey ? (
          <div className="card text">
            <h1>Unofficial Up Bank Web App</h1>
            <p>
              The official app is amazing but it doesn't have every feature.
              This unofficial app uses the Up Bank API to access your
              transaction data and add some features that @erfanio wanted
              to have :)
            </p>
            <h2>How Does It Work?</h2>
            <p>
              Up Bank offers a Application Programming Interface (API) which is a
              convenient way to allow third-party apps to <b>only</b> access your
              transaction data and do minor changes like adding tags and categories.
            </p>
            <p>This app is fully local, your data never leaves your browser.</p>
            <h2>Get Your Personal Access Token</h2>
            <p>
              Personal access token authenticates this app with Up Bank, and
              allows this app to list your accounts, transactions, and tags
              and assign tags and categories to transactions.
            </p>
            <p>
              You can generate a new personal access token by going to{' '}
              <a href="https://api.up.com.au/getting_started" target="_blank">
                api.up.com.au
              </a>
              . Once you have it, enter here to get started.
            </p>
            <ApiKeyForm onSubmit={setApiKey} />
          </div>
        ) : (
          <React.Suspense fallback={<p>Loading accounts...</p>}>
            <div className="topbar">
              <Search />
              <Filters />
            </div>
            <Accounts />
            <ActionBar />
          </React.Suspense>
        )}
      </DisplayErrors>
    </div>
  );
}
