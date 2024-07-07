export type genericListResponse = {
  data: Array<any>;
  links: { prev?: string; next?: string };
};

type getArgs = {
  apiKey: string;
  url: string;
  errorMessage?: string;
};
export const get = async <T>({
  apiKey,
  url,
  errorMessage = 'Error retriving data from Up API:',
}: getArgs): Promise<T> => {
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!resp.ok) {
    const json: { errors: Array<any> } = await resp.json();
    if (json && json.errors && json.errors.length > 0) {
      throw new FetchError(errorMessage, json.errors[0]);
    }
    throw new FetchError(errorMessage, 'Unknown error! Failed to send requests to Up API.');
  }
  const json: T = await resp.json();
  return json;
};

export class FetchError extends Error {
  errorMessage = ''
  errorDetails: any = ''

  constructor(errorMessage: string, errorDetails: any) {
    super(errorMessage);

    this.name = "FetchError";
    this.errorMessage = errorMessage;
    this.errorDetails = errorDetails;
  }

  toString() {
    let detailsString = this.errorDetails;
    if (this.errorDetails instanceof Object) {
      detailsString = JSON.stringify(this.errorDetails, null, 2);
    }
    return `${this.errorMessage}\n\n${detailsString}`;
  }
}
