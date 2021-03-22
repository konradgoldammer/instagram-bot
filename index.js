const Instagram = require('instagram-web-api');
const Post = require('./post.js');
const db = require('./database.js');
const dotenv = require('dotenv');

dotenv.config();

const username = process.env.INSTAGRAM_USERNAME; // Instagram username
const password = process.env.INSTAGRAM_PASSWORD; // Instagram password

const client = new Instagram({ username: username, password: password }); // create Instagram client

await db.connect(); // connect do MongoDB Atlas

(async () => {
    const INTERVAL = 60; // length of interval (in minutes)
    while (true) { // repeat after certain period of time
        try {
            await client.login(); // login to Instagram
            const profile = await client.getProfile();

            if (profile != undefined) {
                console.log(`Logged in as ${profile.username}.`);

                // get posts from instagram

                const POSTS_OF_HASHTAG = async (hashtag) => { // get most recent posts of a hashtag
                    let rawPosts = await client.getMediaFeedByHashtag({ hashtag: hashtag });
                    rawPosts = rawPosts.edge_hashtag_to_media.edges;
                    const posts = [];
                    rawPosts.forEach(rawPost => {
                        posts.push(new Post(rawPost.node.owner.id, rawPost.node.taken_at_timestamp, rawPost.node.shortcode, hashtag));
                    });
                    return posts;
                };

                let totalPosts = [];
                const HASHTAGS = ['memes', 'funny', 'lol']; // hashtags to look for posts in

                for (hashtag of HASHTAGS) {
                    totalPosts = totalPosts.concat(await POSTS_OF_HASHTAG(hashtag));
                }

                console.log(`Received ${totalPosts.length} posts from ${HASHTAGS.length} hashtags.`);

                // remove "invalid" posts

                const ALL_ABONNEMENTS = await db.getAllAbonnements();

                totalPosts.forEach(function (post, index, object) { // remove every post, that was posted by someone that you currently follow, or that you followed in the past
                    for (abo of ALL_ABONNEMENTS) {
                        if (post.ownerID == abo.ownerID) {
                            object.splice(index, 1);
                            break;
                        }
                    }
                });

                let uniquePosts = []; // remove posts by people, who are already included in one post
                outerLoop: for (post of totalPosts) {
                    for (p of totalPosts) {
                        if (p.ownerID === post.ownerID & p.shortcode != post.shortcode) {
                            continue outerLoop;
                        }
                    }
                    uniquePosts.push(post);
                }
                totalPosts = uniquePosts;

                totalPosts = totalPosts.sort((a, b) => a - b); // sorting posts by timestamp (most recent posts first)

                console.log(`Cut down total posts to ${totalPosts.length} posts.`);

                const MAX_ABOS_PER_INTERVAL = 5; // max. number of people to follow each period

                totalPosts = totalPosts.slice(0, MAX_ABOS_PER_INTERVAL);

                // follow new people

                for (post of totalPosts) {
                    await client.follow({ userId: post.ownerID });
                    console.log(`Followed user with id: ${post.ownerID} on Instagram.`)
                }

                await db.insertAbonnements(totalPosts);

                // unfollow old people

                const FOLLOW_TIME = 72; // period of time you follow each user (in hours)

                const oldAbonnements = [];
                for (abo of ALL_ABONNEMENTS) {
                    if (abo.subscriptionTimestamp < (Number(String((new Date()).getTime()).slice(0, -3)) - FOLLOW_TIME * 60 * 60) & abo.active == true) {
                        await client.unfollow({ userId: abo.ownerID });
                        console.log(`Unfollowed user with id: ${abo.ownerID}, whom you followed since ${(new Date(abo.subscriptionTimestamp * 1000)).toString()} on Instagram.`);
                        oldAbonnements.push(abo);
                    }
                }
                await db.setAbonnementsToInactive(oldAbonnements);
            } else {
                console.error('Error occured while logging in.');
            }
        } catch (e) {
            console.error(e);
        }
        
        await sleep(INTERVAL * 60 * 1000); // wait for the next period
    }
})();

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}