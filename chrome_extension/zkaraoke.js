var lyricsMap = [];
console.log("ZKaraoké! 0.1 Loaded");
zkaraoke = {};
(function(ns, $) {
    var subtitleOffSet = -0.8;

    var videoElement;
    //.getCurrentTime()
    /**
    {
        "index": 0,
        "start":1,
        "end":0
    }
     */

    function bindGUI() {
        $('#ytl-lyrics').contents().filter(function() {
            return this.nodeType == 3; // TEXT NODE
        }).each(function(index, line) {
            var newLine = $('<span class="zkline"><span class="zklyric"></span><span class="zktime"></span></span>');
            newLine.find(".zklyric").text( line.data );
            $(line).replaceWith( newLine );
        })
        $('#ytl-lyrics .zkline').each(function(index, line) {
            $(line).data("index", index);
        })
    }

    function putLyric(index, lyric, start, end) {
        start = Math.ceil(start * 1000) / 1000; // round to 3 decimals
        lyricsMap[index] = {
            index: index,
            start: start,
            end: end,
            lyric: lyric
        }
        persistent.save();
    }

    function getLyric(second) {
        for (i = 0; i < lyricsMap.length; i++) {
            if (lyricsMap[i] && lyricsMap[i].start >= second) {
                if (i == 0) i = 1;
                return lyricsMap[i-1];
            }
        }
    }

    function getVideoId() {
        //return /v=([\w-]{11})/.exec(window.location.search)[1]
        return "qb_hqexKkw8";
    }

    var persistent = {};
    (function(nsp) {
        nsp.prefix = function () {
            return "zk" + myPlayer.getVideoId()
        }
        nsp.save = function() {
            localStorage[nsp.prefix()] = JSON.stringify(lyricsMap);
        },
        nsp.load = function() {
            var sval = localStorage[nsp.prefix()];
            if (sval) {
                lyricsMap = []
                JSON.parse(sval).forEach(function(val) {
                    if(val) {
                        lyricsMap[val.index] = val;
                    }
                } )
            }
        }
    })(persistent);

    function formatTime(totalSeconds) {
        var totalSeconds = Math.floor(totalSeconds);
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds - minutes * 60;
        return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
    }

    function getCurrentTime() {
        if (videoElement.is("video")) {
            return videoElement[0].currentTime;
        } else
            return videoElement[0].getCurrentTime();
    }

    $('body').on('click','#ytl-lyrics .zkline',function(e) {
        var seconds = getCurrentTime();
        $(".zktime",this).text( formatTime( Math.floor( seconds ) ) );
        putLyric( $(this).data("index"), $(".zklyric",this).text(), seconds );
    })

    var current = {index: null};

    var myPlayer = {};
    (function(nsp) {
        nsp.currentTime = function() {
            return videoElement.getCurrentTime();
        }
        nsp.getVideoId = function() {
            var id = /embed\/([\w_]{11})/.exec($("iframe").attr("src"));
            if (id == null)
                return id;

            return id[1];
        }
    })(myPlayer);

    function onTimeUpdate() {
        var newLyric = getLyric(myPlayer.currentTime() - subtitleOffSet);
        if (newLyric && current.index != newLyric.index) {
            current.index = newLyric.index;
            setCurrentLyric(newLyric.lyric);
        }
    }

    function starTimeUpdate() {
        setInterval(onTimeUpdate, 200);
    }

    function setCurrentLyric(text) {
        display.text(text);
    }

    var isFullScreen = false;
    $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange',
        function(e){
            isFullScreen = !isFullScreen;
            display.toggleClass("track-full-screen",isFullScreen);
        }
    );

    function loadLineTime() {
        $(".zkline").each(function(index, line) {
            var index = $(line).data("index");
            if (lyricsMap[index]) {
                var seconds = Math.floor(lyricsMap[index].start);
                $(".zktime",line).text( formatTime( seconds ) );
            }
        });
    }

    function run() {
        persistent.load();
        loadLineTime();
        starTimeUpdate();
        bindGUI();
    }
    //run();
    ns.onPlayerReady = function(event) {
        videoElement = event.target;
        console.log("Player ready");
        run();
    }
    ns.onPlayerStateChange = function() {
        console.log("State change");
    }
})(zkaraoke,jQuery);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    events: {
      'onReady': zkaraoke.onPlayerReady,
      'onStateChange': zkaraoke.onPlayerStateChange
    }
  });
}