const MAX_ABOS_PER_INTERVAL = 5; // max. number of people to follow each period

const instagramCrawler = {
    getPostsByHashtag: async (client, hashtags, allAbonnements) => {

        // get posts from instagram

        const POSTS_OF_HASHTAG = async (hashtag) => { // get most recent posts of a hashtag
            let posts = await client.getMediaFeedByHashtag({ hashtag: hashtag });
            posts = posts.edge_hashtag_to_media.edges;
            return posts.map(post => ({
                userId: post.node.owner.id,
                timestamp: post.node.taken_at_timestamp,
                shortcode: post.node.shortcode,
                hashtag: hashtag
            }));
        };

        let totalPosts = [];

        for (hashtag of hashtags) {
            totalPosts = totalPosts.concat(await POSTS_OF_HASHTAG(hashtag));
        }

        console.log(`Received ${totalPosts.length} posts from ${hashtags.length} hashtags.`);

        // remove "invalid" posts

        let validPosts = [];
        outerLoop: for (post of totalPosts) {
            for (p of totalPosts) {
                if (p.userId === post.userId && p.shortcode != post.shortcode) { // remove posts by people, who are already included in one post
                    continue outerLoop;
                }
            }
            validPosts.push(post);
        }
        totalPosts = validPosts;

        totalPosts.forEach(function (post, index, object) { // remove every document of someone whom you currently follow or followed in the past
            for (abo of allAbonnements) {
                if (post.userId == abo.userId) {
                    object.splice(index, 1);
                    break;
                }
            }
        });

        console.log(`Cut down total posts to ${totalPosts.length} posts.`);

        totalPosts = totalPosts.sort((a, b) => b.timestamp - a.timestamp); // sorting posts by timestamp (most recent posts first)

        totalPosts = totalPosts.slice(0, MAX_ABOS_PER_INTERVAL);

        for (post of totalPosts) { // get usernames of all the people, who you are about to follow
            post.username = (await client.getMediaByShortcode({ shortcode: post.shortcode })).owner.username;
        }

        return totalPosts;
    },
    getFollowersOfAccounts: async (client, accounts, allAbonnements) => {

        // get followers of certain accounts from instagram

        const FOLLOWERS_OF_ACCOUNT = async (account) => { // get most recent followers of an account
            let followers = await client.getFollowers({ userId: account });
            followers = followers.data;
            return followers.map(follower => ({
                userId: follower.id,
                username: follower.username,
                fullName: follower.full_name,
                isVerfied: follower.is_verified,
                profilePicUrl: follower.profile_pic_url,
                followerOf: account
            }));
        };

        let totalFollowers = [];

        for (account of accounts) {
            totalFollowers = totalFollowers.concat(await FOLLOWERS_OF_ACCOUNT(account));
        }

        console.log(`Received ${totalFollowers.length} followers from ${accounts.length} accounts.`);

        // remove "invalid" followers

        let validFollowers = [];
        outerLoop: for (follower of totalFollowers) {
            for (f of totalFollowers) {
                if (f.userId === follower.userId && f.account !== follower.account) { // remove people who are included in the follower-list of 2 or more accounts in the accounts array
                    continue outerLoop;
                }
            }
            validFollowers.push(follower);
        }
        totalFollowers = validFollowers;

        totalFollowers.forEach(function (follower, index, object) { // remove every document of someone whom you currently follow or followed in the past
            for (abo of allAbonnements) {
                if (follower.userId == abo.userId) {
                    object.splice(index, 1);
                    break;
                }
            }
        });

        console.log(`Cut down total followers to ${totalFollowers.length} followers.`);

        totalFollowers = totalFollowers.sort((a, b) => (0.5 - Math.random())); // sorting followers randomly

        totalFollowers = totalFollowers.slice(0, MAX_ABOS_PER_INTERVAL);

        return totalFollowers;
    }
}

module.exports = instagramCrawler;