const maxAbonnementsPerPeriod = 5; // max. number of people to follow each period

const instagramCrawler = {
  getFollowersOfAccounts: async (client, accounts, abonnements) => {
    try {
      const followers = async (account) => {
        // get most recent followers of an account
        return client.getFollowers({ userId: account });
      };

      const responses = await Promise.all(
        accounts.map((account) => followers(account))
      );

      const totalFollowers = responses.reduce(
        (total, res) =>
          total.concat(
            res.data.map((follower) => ({
              userId: follower.id,
              username: follower.username,
              fullName: follower.full_name,
              isVerfied: follower.is_verified,
              profilePicUrl: follower.profile_pic_url,
            }))
          ),
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
    } catch (e) {
      return console.error(e);
    }
  },
};

module.exports = instagramCrawler;
