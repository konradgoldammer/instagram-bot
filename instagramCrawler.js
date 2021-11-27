const maxAbonnementsPerPeriod = 5; // max. number of people to follow each period

const instagramCrawler = {
  getFollowersOfAccounts: async (client, accounts, abonnements) => {
    const followers = async (account) => {
      // get most recent followers of an account
      let followers = await client.getFollowers({ userId: account });
      followers = followers.data;
      return followers.map((follower) => ({
        userId: follower.id,
        username: follower.username,
        fullName: follower.full_name,
        isVerfied: follower.is_verified,
        profilePicUrl: follower.profile_pic_url,
        followerOf: account,
      }));
    };

    const totalFollowers = accounts.reduce(
      (total, account) => total.concat(followers(account)),
      []
    );

    console.log(
      `Received ${totalFollowers.length} followers from ${accounts.length} accounts.`
    );

    // remove "invalid" followers
    let validFollowers = [];
    outerLoop: for (follower of totalFollowers) {
      for (f of totalFollowers) {
        if (f.userId === follower.userId && f.account !== follower.account) {
          // remove people who are included in the follower-list of 2 or more accounts in the accounts array
          continue outerLoop;
        }
      }
      validFollowers.push(follower);
    }
    validFollowers;

    validFollowers.forEach(function (follower, index, object) {
      // remove every document of someone whom you currently follow or followed in the past
      for (abo of abonnements) {
        if (follower.userId == abo.userId) {
          object.splice(index, 1);
          break;
        }
      }
    });

    console.log(
      `Cut down total followers to ${validFollowers.length} followers.`
    );

    validFollowers = validFollowers.sort((a, b) => 0.5 - Math.random()); // sorting followers randomly

    return validFollowers.slice(0, maxAbonnementsPerPeriod);
  },
};

module.exports = instagramCrawler;
