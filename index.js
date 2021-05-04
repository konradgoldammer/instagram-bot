const Instagram = require('instagram-web-api');
const db = require('./database.js');
const dotenv = require('dotenv');
const instagramCrawler = require('./instagramCrawler.js');

dotenv.config();

const username = process.env.INSTAGRAM_USERNAME; // Instagram username
const password = process.env.INSTAGRAM_PASSWORD; // Instagram password

const client = new Instagram({ username: username, password: password }); // create Instagram client

(async () => {
    try {
        await db.connect(); // connect do MongoDB Atlas
        await client.login(); // login to Instagram

        const profile = await client.getProfile();

        if (profile != undefined) {
            console.log(`Logged in as ${profile.username}.`);

            const INTERVAL = 60; // length of interval (in minutes)

            while (true) { // repeat after certain period of time
                const operation = Number(process.env.OPERATION); /* stores method that will be executed to get the people, that you are going to follow; the methods differ in the place they look for these people:
                if 0: the programs goes through the creators of posts in certain hashtags
                if 1: the program goes through the followers of other accounts */

                const ALL_ABONNEMENTS = await db.getAllAbonnements(); // every abonnement currently stored in the database

                let documents;

                switch (operation) {
                    case 0:
                        const HASHTAGS = ['memes', 'funny', 'lol']; // hashtags to look for posts in
                        documents = await instagramCrawler.getPostsByHashtag(client, HASHTAGS, ALL_ABONNEMENTS);
                        break;
                    case 1:
                        const ACCOUNTS = ['2374691999', '11762801', '2955360060']; // Instagram userIds of accounts to look for followers in
                        documents = await instagramCrawler.getFollowersOfAccounts(client, ACCOUNTS, ALL_ABONNEMENTS);
                        break;
                    default:
                        throw `There is no operation with the operation-code: ${operation}.`;
                }

                // follow new people

                for (document of documents) {
                    await client.follow({ userId: document.userId });
                    console.log(`Followed user with id: ${document.userId} on Instagram.`)
                }
                if (documents.length !== 0) {
                    await db.insertAbonnements(documents);
                } else {
                    console.log("There are no new abonnements to insert to the database.")
                }

                // unfollow old people

                const FOLLOW_TIME = 72; // period of time you follow each user (in hours)

                const oldAbonnements = [];
                for (abo of ALL_ABONNEMENTS) {
                    if ((abo.subscriptionTimestamp < (Number(String((new Date()).getTime()).slice(0, -3)) - FOLLOW_TIME * 60 * 60)) && abo.active == true) {
                        try {
                            await client.unfollow({ userId: abo.userId });
                            console.log(`Unfollowed user with id: ${abo.userId}, whom you followed since ${(new Date(abo.subscriptionTimestamp * 1000)).toString()} on Instagram.`);
                        } catch (error) {
                            console.error(error);
                        }
                        try {
                            const followedBack = (await client.getUserByUsername({ username: abo.username })).follows_viewer; // true if user follows your account
                            abo.followedBack = followedBack;
                        } catch (error) {
                            console.log(`Could not detect if user followed back for abonnement: ${abo._id}.`); // probably because the user canged his username or deleted his account
                        }
                        oldAbonnements.push(abo);
                    }
                }
                await db.setAbonnementsToInactive(oldAbonnements);

                await sleep(INTERVAL * 60 * 1000); // wait for the next period
            }
        } else {
            console.error('Error occured while logging in.');
        }
    } catch (e) {
        console.error(e);
    }
})();

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}