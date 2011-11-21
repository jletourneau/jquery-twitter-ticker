# jQuery Twitter Ticker

## Usage

1. Include jQuery in whichever fashion you like. I like to use [Google's CDN](http://code.google.com/apis/libraries/devguide.html#jquery).
2. Include this package's JavaScript and CSS files. The CSS contains no real styling, just the basics for making the scrolling feature work.
3. Create an element on your page to contain the Twitter feed and invoke `$.twitterTicker` on it. Pass an options hash for configuration.

## Options

* **screen_name** *(required)* What user's tweets should be shown?
* **items** *(optional)* Cycle through how many tweets (default 10)?
* **rotate** *(optional)* How long should each tweet remain in view (in seconds; default 5)?
* **update** *(optional)* Check Twitter for new tweets how frequently (in seconds; default 0, meaning no checks)?
