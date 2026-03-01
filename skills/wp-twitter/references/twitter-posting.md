# Twitter Posting Guide

## Single Tweets

### Basic Tweet
```
Tool: tw_create_tweet
Params: { "text": "Check out our latest blog post on WordPress optimization!" }
```

### Tweet with Reply (Thread Start)
```
Tool: tw_create_tweet
Params: { "text": "First tweet text", "reply_to": "1234567890" }
```

### Character Limits
- **Text**: 280 characters maximum
- **URLs**: Count as 23 characters regardless of actual length
- **Mentions**: Count toward character limit
- **Media**: Does not count toward character limit

### Best Practices
- Front-load the value proposition in the first tweet
- Use 1-3 relevant hashtags (not more)
- Include a clear CTA when linking to blog content
- Thread the needle: be concise yet compelling

## Thread Creation

### Automatic Thread from Blog Post
```
Tool: tw_create_thread
Params: {
  "tweets": [
    "Thread: 5 ways to optimize your WordPress site for speed",
    "1/ Enable caching. Use a caching plugin like WP Super Cache or W3 Total Cache.",
    "2/ Optimize images. Compress and lazy-load all images.",
    "3/ Minimize HTTP requests. Combine CSS and JS files where possible.",
    "4/ Use a CDN. Distribute static assets globally for faster loading.",
    "5/ Upgrade hosting. A good host makes all the difference."
  ]
}
```

### Thread Best Practices
- Start with a hook that makes people want to read more
- Each tweet should stand on its own while building the narrative
- Number your tweets (1/, 2/, etc.) for easy reference
- End with a summary or CTA tweet
- Optimal thread length: 3-10 tweets

### Blog-to-Thread Workflow
1. Fetch WordPress post: `wp_get_post` with post ID
2. Extract key points from content (H2 headings, key paragraphs)
3. Craft hook tweet from title/excerpt
4. Split key points into individual tweets (max 280 chars each)
5. Add CTA tweet linking back to the full post
6. Publish with `tw_create_thread`

## Content Adaptation Tips
- WordPress title → Hook tweet
- H2 headings → Individual tweet topics
- Key statistics/quotes → Standalone tweets
- Featured image → First tweet media (via media upload)
- Blog URL → CTA tweet link
