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
        createTweet: function (tweetData) {
            var contents = utils.linkURLs(tweetData.text);
            contents = utils.linkTwitterUsers(contents);
            return $('<li/>')
                .html(contents)
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

        // TODO: allow 'q' option in place of 'screen_name' to do global
        // searches. Problem: different URL and data structure returned.
        if (!options.screen_name) {
            utils.log('No "screen_name" option supplied.');
            return;
        };

        var _init = function (element) {
            element = $(element).addClass('twitter-ticker');
            var twList = $('<ul/>')
                .css({ height: element.height() })
                .appendTo(element);
            var holdList = $('<ul/>');
            var tweetsEmpty = function () {
                return !$('li', twList).length;
            };
            var selectTweet = function (tweet) {
                tweet = tweet || $('li:first', twList);
                $('.selected-tweet', twList).removeClass('selected-tweet');
                tweet.addClass('selected-tweet');
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
            var snapToSelected = function () {
                var selected = selectedTweet() || selectTweet();
                twList.css({ top: -1 * selected.position().top });
            };
            var scrollToTweet = function (tweet, callback) {
                twList.animate(
                    { top: -1 * tweet.position().top },
                    function () {
                        selectTweet(tweet);
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
                var firstTweet = $('li:first', twList);
                var clone = firstTweet.clone().insertAfter(selectedTweet());
                scrollToTweet(clone, function () {
                    selectTweet(firstTweet);
                    snapToSelected();
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
                    scrolling.id = window.setInterval(
                        scrolling.go, 1000 * options.rotate);
                },
                stop: function () {
                    window.clearInterval(scrolling.id);
                }
            };
            getNewTweets();
            scrolling.start();
        };

        return this.each(function () {
            _init(this, options);
        });

    };
})(jQuery);
