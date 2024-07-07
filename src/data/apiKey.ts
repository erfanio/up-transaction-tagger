import { atom } from 'recoil';

export const LOCALSTORAGE_KEY = 'up-tagger-api-key';

export const apiKeyState = atom<string>({
  key: 'api-key',
  default: window.localStorage.getItem(LOCALSTORAGE_KEY) || '',
  effects: [
    ({ onSet }) => {
      onSet((apiKey) => {
        window.localStorage.setItem(LOCALSTORAGE_KEY, apiKey!);
      });
    },
  ],
});
