(function ($) {
    $.fn.twitterTicker = function () {
        var initTicker = function (el) {
            var getNewTweets = function (el) {
                var initScrolling = function (el) {
                    var list = el.find('ul');
                    var trimTweetList = function (el) {
                        var maxlength = el.data('items');
                        var tweets = el.find('li');
                        for (var i = tweets.length - 1; i >= maxlength; i--) {
                            tweets.get(i).remove();
                        }
                    };
                    var scrollToTweet = function (tweet, callback) {
                        list.animate(
                            { top: -1 * tweet.position().top },
                            callback || function () { /* No-op */ }
                        );
                    };
                    var resetToTop = function () {
                        list.data('selected', 0);
                        var clonedFirst = list.find('li').first().clone().appendTo(list);
                        scrollToTweet(clonedFirst, function () {
                            list.css({ top: 0 });
                            clonedFirst.remove();
                            trimTweetList(el);
                        });
                    };
                    window.setInterval(function () {
                        var listItems = list.find('li');
                        if (!listItems.length) { return; }
                        var scrollToIndex = (list.data('selected') || 0) + 1;
                        if (scrollToIndex >= listItems.length) {
                            resetToTop();
                            return;
                        }
                        list.data('selected', scrollToIndex);
                        scrollToTweet($(listItems.get(scrollToIndex)));
                    }, 1000 * el.data('rotate'));
                };
                var createTweet = function (tweet) {
                    var makeLink = function (linkText, url) {
                        var elementToString = function (el) {
                            return $(el).clone().wrap('<div/>').parent().html();
                        };
                        return elementToString(
                            $('<a/>', { href: url }).html(linkText)
                        );
                    };
                    var linkURLs = function (str) {
                        var urlRE = /https?:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(([0-9]{1,5})?\/.*)?/gi;
                        return str.replace(urlRE, function (url) {
                            return makeLink(url, url);
                        });
                    };
                    var linkTwitterUserNames = function (str) {
                        var twitterUsernameRE = /@([a-z0-9_-]{3,15})/gi;
                        return str.replace(twitterUsernameRE, function (str, username) {
                            return makeLink(str, 'http://twitter.com/' + username);
                        });
                    };
                    contents = linkURLs(tweet.text);
                    contents = linkTwitterUserNames(contents);
                    var listItem = $('<li/>').html(contents).data({
                        id: tweet.id_str
                    });
                    return listItem;
                };
                var prependTweets = function (list, data) {
                    var initDone = list.data('initDone');
                    var originalHeight = list.prop('scrollHeight');
                    var selectedIndex = list.data('selected') || 0;
                    for (var i = data.length - 1; i >= 0; i--) {
                        var newTweet = createTweet(data[i]);
                        list.prepend(newTweet);
                        selectedIndex++;
                    }
                    if (initDone) {
                        list.data('selected', selectedIndex);
                        var shiftTop = list.prop('scrollHeight') - originalHeight;
                        list.css({ top: parseInt(list.css('top')) - shiftTop });
                    } else {
                        list.data('initDone', 1);
                        initScrolling(el);
                    }
                    var updateSeconds = parseInt(el.data('update'));
                    if (updateSeconds) {
                        window.setTimeout(function () {
                            getNewTweets(el);
                        }, 1000 * updateSeconds);
                    }
                };
                var list = el.find('ul');
                var username = el.data('username');
                if (!username) { return; }
                $.ajax({
                    url: 'http://api.twitter.com/1/statuses/user_timeline.json',
                    dataType: 'json',
                    data: {
                        screen_name: username,
                        count: el.data('items'),
                        since_id: list.find('li').first().data('id')
                    },
                    success: function (data) {
                        prependTweets(list, data);
                    }
                });
            };
            el = $(el).addClass('twitter-ticker');
            var list = $('<ul/>').css({ height: el.height() });
            el.append(list);
            getNewTweets(el);
        };
        return this.each(function () {
            var ticker = $(this);
            var defaults = {
                items: 10,
                rotate: 3,
                update: 0
            };
            $.each(defaults, function (k, v) {
                ticker.data(k, ticker.data(k) || v);
            });
            initTicker(this);
        });
    };
})(jQuery);
