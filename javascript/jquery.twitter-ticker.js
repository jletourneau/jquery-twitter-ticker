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
                .data('selected', 0) // Indicates which tweet is in view
                .appendTo(element);
            var prependTweets = function (data) {
                for (var i = data.length - 1; i >= 0; i--) {
                    twList.prepend(utils.createTweet(data[i]));
                }
            };
            var startUpdateTimer = function () {
                if (options.update) {
                    window.setTimeout(getNewTweets, 1000 * options.update);
                }
            };
            var getNewTweets = function () {
                utils.log('Checking for new tweets...');
                $.ajax({
                    url: 'http://api.twitter.com/1/statuses/user_timeline.json',
                    dataType: 'json',
                    data: {
                        screen_name: options.screen_name,
                        count: options.items,
                        since_id: twList.find('li:first').data('id')
                    },
                    success: function (data) {
                        utils.log(data.length + ' new tweets received');
                        var emptyList = !twList.find('li').length;
                        var originalHeight = twList.prop('scrollHeight');
                        prependTweets(data);
                        // If we had some tweets up already, we need to bump up
                        // our selected index and shift the list up to maintain
                        // consistent state with the newly prepended tweet(s).
                        if (!emptyList) {
                            twList.data(
                                'selected',
                                twList.data('selected') + data.length);
                            var newHeight = twList.prop('scrollHeight');
                            var topShift = newHeight - originalHeight;
                            twList.css({
                                top: parseInt(twList.css('top')) - topShift
                            });
                        }
                    },
                    complete: startUpdateTimer
                });
            };
            var trimTweetList = function () {
                var tweets = twList.find('li');
                for (var i = tweets.length - 1; i >= options.items; i--) {
                    tweets.get(i).remove();
                }
            };
            var scrollToTweet = function (tweet, callback) {
                twList.animate(
                    { top: -1 * $(tweet).position().top },
                    callback || function () { /* No-op */ }
                );
            };
            var resetToTop = function () {
                if (!twList.find('li').length) { return; }
                twList.data('selected', 0);
                // To go back to the top of the list while looking like we're
                // always scrolling downwards, we stick a clone of the first
                // tweet at the end of the list, scroll down to it, reset our
                // top offset back to 0 instantaneously, and remove the clone.
                var clone = twList.find('li:first').clone().appendTo(twList);
                scrollToTweet(clone, function () {
                    twList.css({ top: 0 });
                    clone.remove();
                    // We trim extra tweets now rather than immediately after
                    // fetching them so that we don't have to deal with the
                    // possibility of the tweet in view being pushed out of
                    // range by newly-prepended tweets just retrieved.
                    //
                    // TODO: perhaps when new tweets come in, do a similar
                    // switcheroo to reposition, putting a clone of the newest
                    // tweet in right after the one that's currently showing,
                    // and then resetting to the top.
                    trimTweetList();
                });
            };
            var startScrolling = function () {
                window.setInterval(function () {
                    var tweets = twList.find('li');
                    var selected = twList.data('selected') + 1;
                    if (selected < tweets.length) {
                        twList.data('selected', selected);
                        scrollToTweet(tweets.get(selected));
                    } else {
                        resetToTop();
                    }
                }, 1000 * options.rotate);
            };
            getNewTweets();
            startScrolling();
        };

        return this.each(function () {
            _init(this, options);
        });

    };
})(jQuery);
