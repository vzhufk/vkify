# VKify

Trashy try of import VK playlist into Spotify.

I'm not proud of this piece of code. At least it works.

I just want to make my VK playlist Great again.

## How to use:

If you friend somehow find this solution useful, and wana to use it on your .pls file... First of all Im sorry.

So. You need `Node v10`.

Setup `.env`:
Create `.env` file in root dir of repo with:

```
HOST=127.0.0.1
PORT=3000

# Spotify Client Creds. Can get them here: https://developer.spotify.com/dashboard/ by creating new app.
CLIENT_ID=
CLIENT_SECRET=
```

1.  `npm install` or `yarn`
2.  Replace `my_playlist.pls` file by your playlist file, or you can use my :)
3.  `npm run start` or `yarn start`
4.  Open `127.0.0.1:3000/go` in your browser.
5.  Allow Client Spotify Access
6.  Wait.
7.  Get Name of Playlist in response.
8.  Enjoy.

If something went wrong, you can contact me, for sure.

And sorry :C

## TODO:

1.  Make it normal. Cause it's so lame... A lot of Shame.
2.  Deploy it on Heroku.
3.  Use VK API to obtain playlist.
