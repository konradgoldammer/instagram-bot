const Instagram = require("instagram-web-api");
const mongoose = require("mongoose");
const Abonnement = require("./models/Abonnement");
const dotenv = require("dotenv");
const instagramCrawler = require("./instagramCrawler.js");

dotenv.config();

const username = process.env.INSTAGRAM_USERNAME; // Instagram username
const password = process.env.INSTAGRAM_PASSWORD; // Instagram password
const mongoURI = process.env.MONGO_URI; // MongoDB URI

const client = new Instagram({ username: username, password: password }); // create Instagram client

(async () => {
  try {
    await mongoose.connect(mongoURI); // connect do MongoDB

    const { authenticated } = await client.login(); // login to Instagram

    if (!authenticated) {
      return console.log(
        "Couldn't log into Instagram; Check your credentials!"
      );
    }

    console.log(`Logged in as ${username}.`);

    const interval = 60; // length of interval (in minutes

    while (true) {
      const abonnements = await Abonnement.find({}); // every abonnement currently stored in the database

      const accounts = ["2374691999", "11762801", "2955360060"]; // Instagram userIds of accounts to look for followers in
      const usersToFollow = await instagramCrawler.getFollowersOfAccounts(
        client,
        accounts,
        abonnements
      );

      // follow new people
      for (user of usersToFollow) {
        await client.follow({ userId: user.userId });
        console.log(`Followed user with id: ${user.userId} on Instagram.`);

        await new Abonnement({ user }).save(); // Store new abonnement in db
      }

      // unfollow old people
      const followPeriod = 72; // period of time you follow each user (in hours)

      for (abonnement of abonnements) {
        if (
          abonnement.date.getTime() < Date.now() - followPeriod * 60 * 60 &&
          abonnement.active
        ) {
          await client.unfollow({ userId: abonnement.user.userId });
          console.log(
            `Unfollowed user with id: ${
              abo.user.userId
            }, whom you followed since ${abonnement.date.toString()} on Instagram.`
          );

          await Abonnement.findByIdAndUpdate(abonnement._id, {
            followedBack: (
              await client.getUserByUsername({ username: abo.username })
            ).follows_viewer,
            active: false,
          }); // Update doc in db by setting it to inactive etc.
        }
      }

      await sleep(interval * 60 * 1000); // wait for the next period
    }
  } catch (e) {
    console.error(e);
  }
})();

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
