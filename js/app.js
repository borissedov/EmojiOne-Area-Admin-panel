var app = angular.module('firebase-admin', ['firebase', 'ui.bootstrap']);

app.controller('MainCtrl', function ($scope, EmojisService, FirebaseAuthService, aws_config) {
    var main = this;


    //auth
    main.authData = {username: '', password: ''};
    main.authUser = function() {
        FirebaseAuthService.authenticate(main.authData);
    };

    main.checkAuth = function() {
        return FirebaseAuthService.getAuth();
    };

    main.logout = function() {
        FirebaseAuthService.logout();
    };

    main.athenticated =  main.checkAuth();


    // emojis
    main.newEmoji = {alias: '', approved: 'true', data: '', locale: 'en', suggested: 'false', updated_at: ''};
    main.currentEmoji = null;
    main.emojis = main.athenticated ? EmojisService.getEmojis() : [];
    main.suggestedEmojis = main.athenticated ?EmojisService.getSuggestedEmojis() : [];
    main.recentEmojis = main.athenticated ?EmojisService.getRecentEmojis() : [];
    main.recentApprovedEmojis = main.athenticated ? EmojisService.getRecentApprovedEmojis() : [];

    main.addEmoji = function () {
        main.newEmoji.updated_at = new Date();
        EmojisService.addEmoji(angular.copy(main.newEmoji));
        main.newEmoji = {alias: '', approved: 'true', data: '', locale: 'en', suggested: 'false', updated_at: ''};
    };

    main.updateEmoji = function (emoji) {
        EmojisService.updateEmoji(emoji);
    };

    main.removeEmoji = function (emoji) {
        EmojisService.removeEmoji(emoji);
    };

    var str = "abcdefghijklmnopqrstuvwxyz";
    main.alphabet = str.toUpperCase().split("");

    main.activeLetter = '';
    main.activateLetter = function(letter) {
        main.activeLetter = letter;
    };

    main.currentPage = 1; //current page
    main.maxSize = 5; //pagination max size
    main.entryLimit = 10; //max rows for data table
    main.noOfPages = Math.ceil(main.emojis.length/main.entryLimit);

    main.openEditModal = function(emoji){
        main.edit_emoji = angular.copy(emoji);
        main.edit_emoji_idx = main.emojis.indexOf(emoji);
    };
    main.updateEditModal = function() {
        main.edit_emoji.updated_at = Date.now();
        main.emojis[main.edit_emoji_idx] = main.edit_emoji;
        main.updateEmoji(main.edit_emoji);
        main.edit_person = {};
    };

    main.cancelSuggested = function(emoji) {
        emoji.suggested = false;
        emoji.updated_at = Date.now();
        EmojisService.updateEmoji(emoji);
    };
    main.approveSuggested = function(emoji) {
        emoji.suggested = false;
        emoji.approved = true;
        emoji.updated_at = Date.now();
        EmojisService.updateEmoji(emoji);
    };


    //upload

    main.sizeLimit      = 1058576; // 1MB in Bytes

    main.upload = function(targetArea) {
        AWS.config.update({ accessKeyId: aws_config.access_key, secretAccessKey: aws_config.secret_key });
        AWS.config.region = 'us-east-1';
        var bucket = new AWS.S3({ params: { Bucket: aws_config.bucket } });

        if(main.file) {
            // Perform File Size Check First
            var fileSize = Math.round(parseInt(main.file.size));
            if (fileSize > main.sizeLimit) {
                console.log('Sorry, your attachment is too big.');
                return false;
            }
            // Prepend Unique String To Prevent Overwrites
            var uniqueFileName = main.uniqueString() + '-' + main.file.name;

            var params = { Key: uniqueFileName, ContentType: main.file.type, Body: main.file, ServerSideEncryption: 'AES256' };

            bucket.putObject(params, function(err, data) {
                if(err) {
                    console.log(err.message);
                    return false;
                }
                else {
                    // Upload Successfully Finished
                    var file_url = "https://" + aws_config.bucket + ".s3.amazonaws.com/" + uniqueFileName;
                    console.log('File Uploaded Successfully. ' + file_url);
                    $('#' + targetArea).find('.emojionearea-editor').append($('<img class="emojioneimage" src="' + file_url + '" />'));
                }
            });
        }
        else {
            console.log('Please select a file to upload');
        }
    };

    main.uniqueString = function() {
        var text     = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 8; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };


});

app.filter('startsWithLetter', function() {
    return function(items, letter) {
        var filtered = [];
        var letterMatch = new RegExp(letter, 'i');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (letterMatch.test(item.alias.substring(0, 1))) {
                filtered.push(item);
            }
        }
        return filtered;
    };
});
app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});

app.filter('suggested', function() {
    return function(items, is_suggested) {
        var filtered = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.suggested == is_suggested) {
                filtered.push(item);
            }
        }
        return filtered;
    };
});

app.filter('orderObjectBy', function() {
    return function(items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function (a, b) {
            return (a[field] > b[field] ? 1 : -1);
        });
        if(reverse) filtered.reverse();
        return filtered;
    };
});

app.service('EmojisService', function ($firebaseArray, FIREBASE_URI) {
    var service = this;
    var ref = new Firebase(FIREBASE_URI);

    // ref.authWithPassword({
    //     email    : "borissedov@gmail.com",
    //     password : "RockBeam99"
    // }, function(error, authData) {
    //     if (error) {
    //         console.log("Login Failed!", error);
    //     } else {
    //         console.log("Authenticated successfully with payload:", authData);
    //     }
    // }, {
    //     remember: "sessionOnly"
    // });

    // var authData = ref.getAuth();
    // if (authData) {
    //     console.log("User " + authData.uid + " is logged in with " + authData.provider);
    // } else {
    //     console.log("User is logged out");
    // }

    var emojis = $firebaseArray(ref);

    service.getEmojis = function () {
        return emojis;
    };

    service.getSuggestedEmojis = function () {
        var records = [];
        ref.orderByChild('suggested').equalTo(true).on("child_added", function(snapshot) {
            records.push(snapshot.val());
        });

        return records;
    };

    service.getRecentEmojis = function () {
        var records = [];
        ref.orderByChild('updated_at').limitToLast(6).on("child_added", function(snapshot) {
            records.push(snapshot.val());
        });

        return records;
    };

    service.getRecentApprovedEmojis = function () {
        var records = [];
        ref.orderByChild('approved').equalTo(true).on("child_added", function(snapshot) {
            records.push(snapshot.val());
        });

        return records;
    };


    service.addEmoji = function (emoji) {
        emojis.$add(emoji);
    };

    service.updateEmoji = function (emoji) {
        emojis.$save(emoji);
    };

    service.removeEmoji = function (emoji) {
        emojis.$remove(emoji);
    };
});

app.service('FirebaseAuthService', function ($firebaseArray, FIREBASE_URI, $window) {
    var service = this;
    var ref = new Firebase(FIREBASE_URI);

    service.authenticate = function (authData) {
        ref.authWithPassword({
            email    : authData.username,
            password : authData.password
        }, function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            } else {
                console.log("Authenticated successfully with payload:", authData);
                $window.location.reload();
            }
        }, {
            remember: "sessionOnly"
        });
    };

    service.getAuth = function () {
        var authData = ref.getAuth();
        return !!authData;
    };
    
    service.logout = function () {
        ref.unauth();
        $window.location.reload();
    }
});

app.directive('emojioneArea', [ '$timeout', function($timeout) {
    return function (scope, element, attrs) {
        var timeout = $timeout(function(){
            var area = $(element).find("textarea.emoji-data-area");

            var emojiCodes = '';

            var arrayCodes = $(element).find( ".emoji-codes-array .emoji-data-item" ).map(function() {
                return this.value;
            }).get();
            jQuery.each(arrayCodes, function(index, value) {
                if (!!value) {
                    emojiCodes = emojiCodes + "&#x" + value;
                }
                else {
                    emojiCodes = emojiCodes + "$$" + index + "$$";
                }
            });

            area.html(emojiCodes);
            area.emojioneArea();

            var timeoutArea = $timeout(function(){


                var arrayImages = $(element).find( ".emoji-images-array .emoji-data-item" ).map(function() {
                    return this.value;
                }).get();
                var editorArea = $(element).find('.emojionearea-editor');
                jQuery.each(arrayImages, function(index, value) {
                    if (!!value && !!editorArea.html) {
                        $(editorArea).html($(editorArea).html().replace("$$" + index + "$$", '<img class="emojioneimage" src="' + value + '">'));
                    }
                });
            }, 10);

        }, 10);
    };
}]);

app.directive('openEditModal', [ '$timeout', function($timeout) {
    var openEditModal = {
        link :   function(scope, element, attrs) {
            function openEditModal() {
                var editModal = $('#edit-modal');
                editModal.modal('show');
                var timeout = $timeout(function(){
                    $(editModal).find('.emoji-data-area-wrapper').html('');
                    $(editModal).find('.emoji-data-area-wrapper').append('<textarea class="emoji-data-area"></textarea>');

                    var area = $(editModal).find("textarea.emoji-data-area");

                    var emojiCodes = '';
                    var ctrl = editModal.controller();

                    jQuery.each(ctrl.edit_emoji.data, function(index, value) {
                        //emojiCodes = emojiCodes + "&#x" + value.unicode;
                        if (!!value.unicode) {
                            emojiCodes = emojiCodes + "&#x" + value.unicode;
                        }
                        else {
                            emojiCodes = emojiCodes + "$$" + index + "$$";
                        }
                    });

                    area.html(emojiCodes);
                    area.emojioneArea();

                    var editorArea = $(editModal).find('.emojionearea-editor');
                    jQuery.each(ctrl.edit_emoji.data, function(index, value) {
                        if (!!value.image) {
                            $(editorArea).html($(editorArea).html().replace("$$" + index + "$$", '<img class="emojioneimage" src="' + value.image + '">'));
                        }
                    });
                    $(editorArea).keypress(function(e){
                        var charCode = !e.charCode ? e.which : e.charCode;
                        if(charCode != 8 && charCode != 37 && charCode != 39)
                            e.preventDefault();
                    })
                }, 10);
            }
            element.bind('click', openEditModal);
        }
    };
    return openEditModal;
}]);

app.directive('updateEditModal', [ '$timeout', function($timeout) {
    var updateEditModal = {
        link :   function(scope, element, attrs) {
            function updateEditModal() {
                var editModal = $('#edit-modal');

                var images = $('#edit-modal .emojionearea-editor img');
                var codes = [];
                for (j=0; j<images.length; j++) {
                    var image = images[j];

                    if ($(image).hasClass('emojioneemoji')) {

                        var surrogate = image.alt.hexEncode();

                        if (surrogate.length > 4) {
                            for (i = 0; i < surrogate.length / 8; i++) {
                                var h = parseInt(surrogate.substr(i * 8, 4), 16);
                                var l = parseInt(surrogate.substr(i * 8 + 4, 4), 16);
                                var data = {};
                                data.unicode = surrogateToCodePoint(h, l).toString(16);

                                codes.push(data);
                            }
                        }
                        else {
                            var data = {};
                            data.unicode = surrogate;
                            codes.push(data);
                        }
                    }
                    else if ($(image).hasClass('emojioneimage')) {
                        var data = {};
                        data.image = image.src;

                        codes.push(data);
                    }
                }

                var ctrl = editModal.controller();
                ctrl.edit_emoji.data = codes;

                // var emojiData = $(editModal).find(".emoji-data-area").val();
                //
                // var surrogate = emojiData.hexEncode();
                //
                // var unicodes = [];
                // for (i=0; i<surrogate.length/8; i++) {
                //     var h = parseInt(surrogate.substr(i*8, 4), 16);
                //     var l = parseInt(surrogate.substr(i*8 + 4, 4), 16);
                //     var data = {};
                //     data.unicode = surrogateToCodePoint(h, l).toString(16);
                //
                //     unicodes.push(data);
                // }
                //
                // var ctrl = editModal.controller();
                // ctrl.edit_emoji.data = unicodes;


                //$('.test-output').val(JSON.stringify(codes));
            }
            element.bind('click', updateEditModal);
        }
    };
    return updateEditModal;
}]);

app.directive('openAddModal', [ '$timeout', function($timeout) {
    var openAddModal = {
        link :   function(scope, element, attrs) {
            function openAddModal() {
                var addModal = $('#add-modal');
                addModal.modal('show');

                var timeout = $timeout(function(){
                    $(addModal).find('.emoji-data-area-wrapper').html('');
                    $(addModal).find('.emoji-data-area-wrapper').append('<textarea class="emoji-data-area"></textarea>');
                    var area = $(addModal).find("textarea.emoji-data-area");
                    area.emojioneArea();
                }, 10);
            }
            element.bind('click', openAddModal);
        }
    };
    return openAddModal;
}]);

app.directive('updateAddModal', [ '$timeout', function($timeout) {
    var updateAddModal = {
        link :   function(scope, element, attrs) {
            function updateAddModal() {
                var addModal = $('#add-modal');

                var images = $('#add-modal .emojionearea-editor img');
                var codes = [];
                for (j=0; j<images.length; j++) {
                    var image = images[j];

                    if ($(image).hasClass('emojioneemoji')) {
                        var surrogate = image.alt.hexEncode();

                        if (surrogate.length > 4) {
                            for (i = 0; i < surrogate.length / 8; i++) {
                                var h = parseInt(surrogate.substr(i * 8, 4), 16);
                                var l = parseInt(surrogate.substr(i * 8 + 4, 4), 16);
                                var data = {};
                                data.unicode = surrogateToCodePoint(h, l).toString(16);

                                codes.push(data);
                            }
                        }
                        else {
                            var data = {};
                            data.unicode = surrogate;
                            codes.push(data);
                        }
                    }
                    else if ($(image).hasClass('emojioneimage')) {
                        var data = {};
                        data.image = image.src;

                        codes.push(data);
                    }
                }

                var ctrl = addModal.controller();
                ctrl.newEmoji.data = codes;

                // var emojiData = $(addModal).find(".emoji-data-area").val();
                //
                // var surrogate = emojiData.hexEncode();
                //
                // var unicodes = [];
                // for (i=0; i<surrogate.length/8; i++) {
                //     var h = parseInt(surrogate.substr(i*8, 4), 16);
                //     var l = parseInt(surrogate.substr(i*8 + 4, 4), 16);
                //     var data = {};
                //     data.unicode = surrogateToCodePoint(h, l).toString(16);
                //
                //     unicodes.push(data);
                // }
                //
                // var ctrl = addModal.controller();
                // ctrl.newEmoji.data = unicodes;
            }
            element.bind('click', updateAddModal);
        }
    };
    return updateAddModal;
}]);


app.directive('uploadFile', function() {
    return {
        restrict: 'AE',
        // scope: {
        //     file: '@'
        // },
        link: function(scope, el, attrs){
            el.bind('change', function(event){
                var files = event.target.files;
                var file = files[0];

                var ctrl = $(el).controller();
                ctrl.file = file;
            });
        }
    };
});








