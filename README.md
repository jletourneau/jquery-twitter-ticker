# jQuery Twitter Ticker

## **Note** — Deprecated API

Unfortunately, Twitter has deprecated and disabled its version 1.0 API, which
this plugin uses to fetch public feeds. The new API requires clients to sign
in with OAuth, which this plugin does not handle. This project will be left
up at GitHub for forking or future development, but at this time it is not
able to render Twitter feeds.

## Use case

A crude version of this plugin was first developed to provide a (nearly)
real-time ticker of match scores on the video streaming pages for Major League
Gaming Pro Circuit events. Originally, we simply bolted some CSS and JavaScript
onto the regular [Twitter profile widget](https://twitter.com/about/resources/widgets/widget_profile)
to create a “mail slot” widget that would scroll through each tweet in turn,
indefinitely.

This improved version does not require including Twitter’s JavaScript on your
page, and provides a better viewing experience than the monkey-patching
approach described above. Added niceties:

* Scrolling always moves “downward” even when actually wrapping back to the top of the tweet list
* A tweet’s relative timestamp (“15 minutes ago,” etc.) is updated each time it is moved into view
* Scrolling is paused when the user mouses over the ticker, to keep links from moving out from under the cursor
* When new tweets are fetched and prepended to the list, they are immediately brought into view on next scroll

## Usage

1. Include jQuery in whichever fashion you like. I like to use [Google’s CDN](http://code.google.com/apis/libraries/devguide.html#jquery).
2. Include this package’s JavaScript and CSS files. The CSS contains no real styling, just the basics for making the scrolling feature work.
3. Create an element on your page to contain the Twitter feed and invoke `$.twitterTicker` on it. Pass an options hash for configuration.

## Options

* **screen_name** *(required)* What user’s tweets should be shown?
* **items** *(optional)* Cycle through how many tweets (default 10)?
* **rotate** *(optional)* How long should each tweet remain in view (in seconds; default 5)?
* **update** *(optional)* Check Twitter for new tweets how frequently (in seconds; default 0, meaning no checks)? Note that Twitter’s API limits an IP to 150 requests/hour, which works out to 24 seconds between requests.

## Generated markup

Suppose a DIV with ID “twitter” is put on the page and this plugin is run on
it. The original element gets class “twitter-ticker” applied to it, and the
following markup is generated inside by the plugin, once tweets have been
retrieved from Twitter:

    div.scroll
      ul
        li
        li
        li
        …

## TODO

* Option to prepend Twitter screen name and/or avatar
* Allow cycling through a Twitter search query rather than a single user’s tweet list
