# Media Accessibility

Use this file when making images, video, audio, and embedded media accessible in WordPress.

## Images

### Alt text decision tree

1. **Is the image decorative?** → `alt=""`
2. **Does it contain text?** → alt = the text in the image
3. **Is it a link/button?** → alt = the link destination or action
4. **Does it convey information?** → alt = describe the information
5. **Is it complex (chart/graph)?** → alt = brief summary + detailed description nearby

### WordPress implementation

```php
// Featured image with alt text
if (has_post_thumbnail()) {
    $alt = get_post_meta(
        get_post_thumbnail_id(), '_wp_attachment_image_alt', true
    );
    the_post_thumbnail('large', ['alt' => $alt ?: get_the_title()]);
}

// Custom image output
$image_id = get_field('hero_image'); // ACF example
$alt = get_post_meta($image_id, '_wp_attachment_image_alt', true);
echo wp_get_attachment_image($image_id, 'full', false, [
    'alt' => $alt,
    'loading' => 'lazy',
]);
```

### Decorative images

```html
<!-- Decorative: empty alt, presentational role -->
<img src="divider.svg" alt="" role="presentation">

<!-- CSS background for purely decorative -->
<div class="decorative-bg" aria-hidden="true"></div>
```

### Complex images

```html
<figure>
    <img src="chart.png"
         alt="Q4 revenue chart showing 25% growth"
         aria-describedby="chart-details">
    <figcaption id="chart-details">
        Revenue grew from $2M in Q3 to $2.5M in Q4, driven primarily
        by the European market which accounted for 60% of new sales.
    </figcaption>
</figure>
```

### SVG accessibility

```html
<!-- Informative SVG -->
<svg role="img" aria-labelledby="svg-title svg-desc">
    <title id="svg-title">Company Logo</title>
    <desc id="svg-desc">Green shield with leaf motif</desc>
    <!-- svg paths -->
</svg>

<!-- Decorative SVG -->
<svg aria-hidden="true" focusable="false">
    <!-- svg paths -->
</svg>
```

## Video

### WordPress video block

The core Video block supports:
- Captions (`.vtt` files)
- Poster image (alt text via the poster)
- Playback controls (native browser controls are accessible)

### Captions and subtitles

```html
<video controls>
    <source src="video.mp4" type="video/mp4">
    <track kind="captions" src="captions-en.vtt"
           srclang="en" label="English" default>
    <track kind="captions" src="captions-it.vtt"
           srclang="it" label="Italiano">
    <track kind="descriptions" src="descriptions-en.vtt"
           srclang="en" label="English audio descriptions">
</video>
```

### WebVTT format

```vtt
WEBVTT

00:00:01.000 --> 00:00:04.000
Welcome to our product demonstration.

00:00:04.500 --> 00:00:08.000
Today we'll show you the key features
of our new application.

00:00:08.500 --> 00:00:12.000
[Music playing in background]
```

### WCAG video requirements

| Level | Requirement |
|-------|------------|
| A | Captions for prerecorded video |
| A | Audio description or media alternative for prerecorded video |
| AA | Captions for live video |
| AA | Audio descriptions for prerecorded video |
| AAA | Sign language interpretation |
| AAA | Extended audio descriptions |

### Autoplay restrictions

```html
<!-- NEVER autoplay with sound -->
<video autoplay muted playsinline>
    <!-- Muted autoplay is acceptable for decorative/background video -->
</video>

<!-- Provide pause control for autoplay -->
<div class="video-wrapper">
    <video autoplay muted loop id="bg-video">
        <source src="bg.mp4" type="video/mp4">
    </video>
    <button aria-label="Pause background video"
            onclick="toggleVideo()">
        Pause
    </button>
</div>
```

## Audio

```html
<audio controls>
    <source src="podcast.mp3" type="audio/mpeg">
    <a href="podcast.mp3">Download podcast episode</a>
</audio>

<!-- Provide transcript for audio content -->
<details>
    <summary>Read transcript</summary>
    <div class="transcript">
        <p><strong>Host:</strong> Welcome to the show...</p>
    </div>
</details>
```

### WCAG audio requirements

| Level | Requirement |
|-------|------------|
| A | Transcript for prerecorded audio-only content |
| AAA | Sign language for prerecorded audio in video |

## Embedded media (iframes)

```html
<!-- YouTube/Vimeo embeds need titles -->
<iframe src="https://www.youtube.com/embed/VIDEO_ID"
        title="Product demonstration video"
        allowfullscreen>
</iframe>

<!-- Maps -->
<iframe src="https://www.google.com/maps/embed?..."
        title="Store location map - 123 Main Street, Rome"
        allowfullscreen>
</iframe>
```

### WordPress oEmbed

WordPress auto-embeds URLs. Add accessible wrappers:

```php
add_filter('embed_oembed_html', function($html, $url, $attr) {
    // Add responsive wrapper with accessible title
    return sprintf(
        '<div class="responsive-embed" role="group" aria-label="%s">%s</div>',
        esc_attr__('Embedded media', 'my-theme'),
        $html
    );
}, 10, 3);
```

## Animations and motion

```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }

    video, .animated-element {
        animation: none !important;
    }
}
```

```js
// Check user preference in JavaScript
const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
    // Run animations
}
```

WCAG requirements:
- Content that moves, blinks, or scrolls for more than 5 seconds must have a pause mechanism
- No content flashes more than 3 times per second

## Verification

```bash
# Check for images without alt text
curl -s https://site.com/ | grep -oP '<img[^>]*>' | grep -v 'alt='

# Check for iframes without titles
curl -s https://site.com/ | grep -oP '<iframe[^>]*>' | grep -v 'title='

# Check for video without captions
curl -s https://site.com/ | grep -oP '<video[^>]*>.*?</video>' | grep -v '<track'
```

Manual checks:
1. All informative images have descriptive alt text
2. Decorative images have `alt=""`
3. Videos have captions
4. Audio has transcripts
5. No autoplay media with sound
6. Animations respect `prefers-reduced-motion`
