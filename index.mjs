import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import playlistParser from "playlist-parser";
import sleep from "sleep";

dotenv.load();

let app = express();

const catcher = error => {
  // Error
  if (error.response) {
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    console.log(error.request);
  } else {
    console.log("Error", error.message);
  }
  console.log(error.config);
};

app.get("/go", async (req, res) => {
  let scopes = "user-read-private playlist-modify-private";
  let redirect_uri =
    "http://" + process.env.HOST + ":" + process.env.PORT + "/callback";
  res.redirect(
    "https://accounts.spotify.com/authorize" +
      "?response_type=code" +
      "&client_id=" +
      process.env.CLIENT_ID +
      (scopes ? "&scope=" + encodeURIComponent(scopes) : "") +
      "&redirect_uri=" +
      encodeURIComponent(redirect_uri)
  );
});

app.get("/callback", async (req, res) => {
  let { token_type, access_token } = (await axios({
    method: "POST",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    params: {
      grant_type: "authorization_code",
      code: req.query.code,
      redirect_uri:
        "http://" + process.env.HOST + ":" + process.env.PORT + "/callback"
    }
  }).catch(catcher)).data;

  let me = (await axios({
    method: "GET",
    url: "https://api.spotify.com/v1/me",
    headers: {
      Authorization: token_type + " " + access_token
    }
  }).catch(catcher)).data;

  let list = playlistParser.PLS.parse(
    fs.readFileSync("my_playlist.pls", { encoding: "utf8" })
  );

  let playlist = (await axios({
    method: "POST",
    url: `https://api.spotify.com/v1/users/${me.id}/playlists`,

    headers: {
      Authorization: token_type + " " + access_token,
      "Content-Type": "application/json"
    },
    data: {
      name: "VKPlaylist:" + new Date(),
      public: false,
      description: "Playlist from VK. Generated."
    }
  }).catch(catcher)).data;

  let tracks = [];
  let count = 0;
  for (let item of list) {
    console.log(
      "Searching for:" +
        item.title
          .replace(/\(.*\)/, "")
          .replace(/\[.*\]/, "")
          .trim()
    );
    await axios({
      method: "GET",
      url: `https://api.spotify.com/v1/search?q=${item.title
        .replace(/\(.*\)/, "")
        .replace(/\[.*\]/, "")
        .trim()}&type=track&limit=1`,
      headers: {
        Authorization: token_type + " " + access_token
      },
      query: {
        q: item.title,
        type: "track",
        limit: 1
      }
    })
      .then(r => {
        if (r && r.data && r.data.tracks.items && r.data.tracks.items[0]) {
          tracks.push(r.data.tracks.items[0].uri);
        }
      })
      .catch(async error => {
        if (
          error.response &&
          error.response.headers &&
          error.response.headers.retry
        ) {
          console.log(
            ">Waiting for " + error.response.headers.retry + " secs."
          );
          sleep.sleep(error.response.headers.retry + 1);
          await axios({
            method: "GET",
            url: `https://api.spotify.com/v1/search?q=${item.title
              .replace(/\(.*\)/, "")
              .trim()}&type=track&limit=1`,
            headers: {
              Authorization: token_type + " " + access_token
            },
            query: {
              q: item.title,
              type: "track",
              limit: 1
            }
          })
            .then(r => {
              if (
                r &&
                r.data &&
                r.data.tracks.items &&
                r.data.tracks.items[0]
              ) {
                tracks.push(r.data.tracks.items[0].uri);
              }
            })
            .catch(catcher);
        }
      });

    if (tracks.length == 99) {
      await axios({
        method: "POST",
        url: `https://api.spotify.com/v1/users/${me.id}/playlists/${
          playlist.id
        }/tracks`,
        headers: {
          Authorization: token_type + " " + access_token,
          "Content-Type": "application/json"
        },
        data: {
          uris: tracks
        }
      })
        .then(r => {
          tracks = [];
        })
        .catch(async error => {
          if (
            error.response &&
            error.response.headers &&
            error.response.headers.retry
          ) {
            console.log(
              ">Waiting for " + error.response.headers.retry + " secs."
            );
            sleep.sleep(error.response.headers.retry + 1);
            await axios({
              method: "POST",
              url: `https://api.spotify.com/v1/users/${me.id}/playlists/${
                playlist.id
              }/tracks`,
              headers: {
                Authorization: token_type + " " + access_token,
                "Content-Type": "application/json"
              },
              data: {
                uris: tracks
              }
            })
              .then(r => {
                tracks = [];
              })
              .catch(catcher);
          }
        });
    }
  }

  await axios({
    method: "POST",
    url: `https://api.spotify.com/v1/users/${me.id}/playlists/${
      playlist.id
    }/tracks`,
    headers: {
      Authorization: token_type + " " + access_token,
      "Content-Type": "application/json"
    },
    data: {
      uris: tracks
    }
  }).catch(catcher);

  res.send(playlist.name);
});

app.listen(3000, function() {
  console.log("Ready.");
});
