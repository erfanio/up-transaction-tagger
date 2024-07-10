# Up Bank Transactions Web App (Unofficial)

Web app using [Up Bank API](https://developer.up.com.au/), currently primarily to
allow bulk tagging of transactions. Everything happens in your browser, so a
refresh will wipe any loaded transactions.

Access the live version on GitHub Pages! [erfanio.github.io/up-transaction-tagger](https://erfanio.github.io/up-transaction-tagger/)

![screenshot](./preview.png)

## FAQ

### What's an API or Perosnal Access Token?

Up Bank provides an interface for third-party applications (such as this one) to
read your transactions and add/update categories or tags to them. This is called
an application programming interface (API) and your **personal access token** is
a unique identifier that allows applications to access your trasaction data
using the API.

You can get your personal access token from [api.up.com.au](http://api.up.com.au).
You can revoke the previous token by generating a new one any time.

### I see "Covered from X" or "Forwarded to X" transactions... what gives?

Covers and fowards are transactions under the hood. The Up app hides these
transactions under pretty UI but they're still there.

These transactions show up in the API but they don't mark which transaction
they're covering. I have an
[open GitHub issue](https://github.com/up-banking/api/issues/99) with Up team to
add this feature.

For now, this web app uses heuristics to find likely covers/forwards and displays
them a similar UI to the app.

### Can I shift select?

YES! The web app supports selecting multiple transactions in a row if you hold the
shift key.
