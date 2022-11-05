ProtonMail Auto Logout UserScript
=================================

This is a hackish auto-logout userscript for ProtonMail.

As of Nov 2022, unfortunately there is still no way to customize session
expiration: all protonmail sessions are expired after 60 days of inactivity. So
if one keeps using the email, they will stay logged in pretty much
indefinitely, and only if they stop using a session for 2 months, then the
session will get expired.

Honestly this seems odd for a security-focused service, but apparently few
people care. I was only able to find a few old reddit threads asking for a
customized auto-logout, with very little traction. Basically people say one has
to log out manually.

So even thouh I do hope that ProtonMail team implements it properly at some point,
for now I'm stuck with this hackish userscript, which remembers the time I
logged in, and after 16 hours (or whatever duration you set in the script), it
will simulate clicking on the logout button.

Please note it's not equivalent of the proper session expiration on the server
side. There are ways to get around this hackish script:

- Obviously it only runs as long as your computer is on and protonmail is
  opened in a browser tab. So if it's not running, the session will be
  considered active, and if someone managed to steal your browser local storage
  one way or the other, they'll be able to use your account;
- If a malicious user gets physical access to your machine (and is able to
  unlock it etc), then they can obviously just disable the userscript before
  the expiration time.

Still though, I find it useful, and it does provide certail level of additional
security.

## Installation

- Install the [Tampermonkey extension](https://www.tampermonkey.net/) or equivalent
- Navigate to the New Userscript page (This can't be hyperlinked, so you might want to copy-paste this `chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=new-user-script+editor`)
- Paste there the contents of [protonmail_auto_logout.js](https://raw.githubusercontent.com/dimonomid/protonmail-auto-logout/master/protonmail_auto_logout.js)
- In the tampermonkey edit script UI, click File -> Save
- Refresh the protonmail web ui

You can verify that it's installed by opening browser console in the protonmail web UI:
if everything is alright, there you'll see a message similar to this one:

```
Auto-logout in 16h0m (at Sun Nov 06 2022 06:19:52 GMT+0000)
```

## Customization

The expiration time is set to 16h; the idea is that most of the time you'll
login in the morning, the session will last for a day, and on the next morning
you'll have to log in again. If you want to use a different duration, change
this line:

```javascript
  const EXPIRY_HOURS = 16;
```

## Known issues

There are no attempts to notify the user before logging out, so it's possible
to lose data if the user is working on a message draft right when the logout
happens. I might implement some simple notification a couple mins before the
logout time.
