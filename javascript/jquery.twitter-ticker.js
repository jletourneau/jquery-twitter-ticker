(function ($) {

    var utils = {
        makeLink: function (linkText, url) {
            var elementToString = function (el) {
                return $(el).clone().wrap('<div/>').parent().html();
            };
            return elementToString(
                $('<a/>', { href: url }).html(linkText)
            );
        },
        linkURLs: function (str) {
            var urlRE = /https?:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(([0-9]{1,5})?\/.*)?/gi;
            return str.replace(urlRE, function (url) {
                return utils.makeLink(url, url);
            });
        },
        linkTwitterUsers: function (str) {
            var twitterUserRE = /@([a-z0-9_-]{3,15})/gi;
            return str.replace(twitterUserRE, function (str, user) {
                return utils.makeLink(str, 'http://twitter.com/' + user);
            });
        },
        timeAgo: function (dateString) {
            // Borrowed from Twitter's own widget, plus some tweaks
            var rightNow = new Date();
            var then = $.browser.msie ?
                Date.parse(dateString.replace(/( \+)/, ' UTC$1')) :
                new Date(dateString);
            var diff = rightNow - then;
            var second = 1000,
                minute = second * 60,
                hour = minute * 60,
                day = hour * 24;
            if (isNaN(diff) || (diff < 0))
                                   return "";
            if (diff < second * 2) return "right now";
            if (diff < minute)     return Math.floor(diff / second) + " seconds ago";
            if (diff < minute * 2) return "about 1 minute ago";
            if (diff < hour)       return Math.floor(diff / minute) + " minutes ago";
            if (diff < hour * 2)   return "about 1 hour ago";
            if (diff < day)        return Math.floor(diff / hour) + " hours ago";
            if ((diff > day) && (diff < day * 2))
                                   return "yesterday";
            if (diff < day * 365)  return Math.floor(diff / day) + " days ago";
            return "over a year ago";
        },
        updateTimestamp: function (timestamp) {
            timestamp.each(function () {
                $(this).html(utils.timeAgo($(this).data('created')));
            });
        },
        timestamp: function (tweetData) {
            var timestamp = $('<a/>').addClass('timestamp');
            timestamp
                .attr('href', (
                    'http://twitter.com/' + tweetData.user.screen_name +
                    '/status/' + tweetData.id_str))
                .data('created', tweetData.created_at);
            utils.updateTimestamp(timestamp);
            return timestamp;
        },
        createTweet: function (tweetData) {
            var contents = utils.linkURLs(tweetData.text);
            contents = utils.linkTwitterUsers(contents);
            return $('<li/>')
                .html(contents + ' ')
                .append(utils.timestamp(tweetData))
                .data('id', tweetData.id_str);
        }
    };
    utils.log =
        ((typeof console == 'object') && (typeof console.log == 'function')) ?
            function (str) { console.log(str); } :
            function (str) { /* No console available */ };

    $.fn.twitterTicker = function (userOptions) {

        var options = $.extend({
            // How many tweets do we cycle through
            items: 10,
            // How many seconds does each tweet stay up
            rotate: 5,
            // How many seconds between checks for new tweets (0 = don't check)
            update: 0
        }, userOptions);

        // TODO: allow 'q' option in place of 'screen_name' to tick through
        // search results rather than a particular user's feed. Problem: that
        // requires a different URL and provides a different data structure in
        // response.

        if (!options.screen_name) {
            utils.log('No "screen_name" option supplied.');
            return;
        };

        var _init = function (element) {
            element = $(element).addClass('twitter-ticker');
            var scrollBox = $('<div/>')
                .addClass('scroll')
                .css({ height: element.height(), width: element.width() })
                .appendTo(element);
            var twList = $('<ul/>')
                .appendTo(scrollBox);
            var holdList = $('<ul/>');
            var tweetsEmpty = function () {
                return !$('li', twList).length;
            };
            var selectTweet = function (tweet) {
                tweet = tweet || $('li:first', twList);
                $('.selected-tweet', twList).removeClass('selected-tweet');
                tweet.addClass('selected-tweet');
                utils.updateTimestamp($('.timestamp', tweet));
                return tweet;
            };
            var selectedTweet = function () {
                var selected = $('.selected-tweet', twList);
                return selected.length ? selected : null;
            };
            var holdTweets = function (data) {
                var len = data.length;
                for (var i = len; i > 0; i--) {
                    holdList.prepend(utils.createTweet(data[i - 1]));
                }
                // Can move straight to the real list if it's currently empty
                len && tweetsEmpty() && addTweets();
            };
            var addTweets = function () {
                var newTweets = $('li', holdList);
                $('li', holdList).prependTo(twList);
                snapToSelected();
            };
            var startUpdateTimer = function () {
                if (options.update) {
                    window.setTimeout(getNewTweets, 1000 * options.update);
                }
            };
            var getNewTweets = function () {
                $.ajax({
                    url: 'http://api.twitter.com/1/statuses/user_timeline.json',
                    dataType: 'json',
                    data: {
                        screen_name: options.screen_name,
                        count: options.items,
                        since_id: $('li:first', twList).data('id')
                    },
                    success: function (data) {
                        var newTweets = data.length;
                        utils.log(newTweets + ' new tweets received');
                        holdTweets(data);
                    },
                    complete: function () {
                        startUpdateTimer();
                    }
                });
            };
            var trimTweetList = function () {
                var tweets = $('li', twList);
                for (var i = tweets.length - 1; i >= options.items; i--) {
                    $(tweets.get(i)).remove();
                }
            };
            var snapToSelected = function (tweet) {
                tweet && selectTweet(tweet);
                var selected = selectedTweet() || selectTweet();
                twList.css({ top: -1 * selected.position().top });
            };
            var scrollToTweet = function (tweet, callback) {
                selectTweet(tweet);
                twList.animate(
                    { top: -1 * tweet.position().top },
                    function () {
                        callback && callback.call();
                    }
                );
            };
            var resetToTop = function () {
                // To go back to the top of the list while looking like we're
                // always scrolling downwards, we stick a clone of the first
                // tweet underneath the currently selected one, scroll down to
                // it, reset our top offset back to 0 instantaneously, and
                // remove the clone.
                var first = $('li:first', twList);
                var clone = first.clone(true).insertAfter(selectedTweet());
                scrollToTweet(clone, function () {
                    snapToSelected(first);
                    clone.remove();
                    trimTweetList();
                });
            };
            var scrolling = {
                id: null,
                go: function () {
                    // If we have new tweets waiting for us, add them now and
                    // scroll up to them right away; otherwise, scroll to the
                    // next tweet, or back to the top if we're at the end.
                    if ($('li', holdList).length) {
                        addTweets();
                        resetToTop();
                        return;
                    }
                    if (tweetsEmpty()) { return; }
                    var selected = selectedTweet() || selectTweet();
                    var next = selected.next('li');
                    next.length ? scrollToTweet(next) : resetToTop();
                },
                start: function () {
                    scrolling.stop();
                    scrolling.id = window.setInterval(
                        scrolling.go, 1000 * options.rotate);
                },
                stop: function () {
                    window.clearInterval(scrolling.id);
                },
                setupHover: function () {
                    twList.hover(scrolling.stop, scrolling.start);
                },
                init: function () {
                    scrolling.start();
                    scrolling.setupHover();
                }
            };
            getNewTweets();
            scrolling.init();
        };

        return this.each(function () {
            _init(this, options);
        });

    };
})(jQuery);
