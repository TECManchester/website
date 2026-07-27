# Event images

Set on each event's `image_url`. Used in three places at different crops, so
one well-composed image per event covers all of them.

## Dimensions

| Where | Size | Ratio |
| --- | --- | --- |
| **Upload this** | **1920 × 1080 px** | 16:9 |
| Card (homepage, /events) | renders ~380 px wide | 16:9 |
| Detail page banner | full-bleed background | cropped from the same file |

Format JPEG, sRGB, quality 80–85, under 500 KB.

If you can produce two crops per event, a separate **2560 × 1440** (16:9) for
the detail banner will look sharper on large screens — but a single
1920 × 1080 works everywhere.

## Composition

Cards are 16:9 and the image is **not cropped**, so a standard 1920 × 1080
flyer fits exactly as designed — nothing gets trimmed.

A white date chip sits over the **top-left corner** of the card. Keep that
area free of anything critical (a logo or headline there will be covered).

On the detail page the image also sits behind the title at 40% opacity, so
the event name appears twice. That's fine, but bear it in mind.

## Naming

Match the event slug:

```
jewels-chill-and-cheer.jpg
men-of-honour-august.jpg
greatness-community-summer-hangout.jpg
soul-winning-outreach-september.jpg
soul-winning-outreach-october.jpg
```

Then set `image_url` to `/events/<slug>.jpg` on the row in Supabase, or send
them over and I'll wire them up.

## No image?

The card and banner fall back to a navy gradient with the brand glow. It looks
intentional, but a photo is far stronger.
