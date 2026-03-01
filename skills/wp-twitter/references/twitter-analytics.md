# Twitter Analytics Guide

## Available Metrics

Use `tw_get_metrics` to retrieve tweet performance data.

### Public Metrics (Available to All)
- **impression_count** — Times the tweet was shown in timelines
- **like_count** — Number of likes
- **retweet_count** — Number of retweets
- **reply_count** — Number of replies
- **quote_count** — Number of quote tweets
- **bookmark_count** — Number of bookmarks

## Querying Metrics

### Single Tweet
```
Tool: tw_get_metrics
Params: { "tweet_id": "1234567890" }
```

Returns tweet text, creation date, and all public metrics.

### List Recent Tweets with Metrics
```
Tool: tw_list_tweets
Params: { "count": 20 }
```

Returns recent tweets with basic metric data.

### Tweets Since Date
```
Tool: tw_list_tweets
Params: { "count": 50, "since": "2026-01-01T00:00:00Z" }
```

## Performance Benchmarks

| Metric | Average | Good | Excellent |
|--------|---------|------|-----------|
| Engagement rate | 0.5-1% | 1-3% | >3% |
| Like rate | 0.3-0.5% | 0.5-1% | >1% |
| Retweet rate | 0.1-0.3% | 0.3-0.5% | >0.5% |
| Reply rate | 0.05-0.1% | 0.1-0.3% | >0.3% |

## Workflow: Tweet-and-Track

1. Create tweet/thread with `tw_create_tweet` or `tw_create_thread`
2. Note the returned tweet ID(s)
3. Wait 24-48 hours for meaningful engagement data
4. Check metrics with `tw_get_metrics`
5. Compare against benchmarks above
6. Adjust posting time, content style, and hashtag strategy

## Thread Performance
- Threads typically get 2-3x more engagement than single tweets
- The first tweet drives 60-70% of total thread impressions
- Include a "thread start" indicator to signal more content follows
