class Post {
    constructor(ownerID, timestamp, shortcode, hashtag) {
        this.ownerID = ownerID;
        this.timestamp = timestamp;
        this.shortcode = shortcode;
        this.hashtag = hashtag;
    }
}

module.exports = Post;