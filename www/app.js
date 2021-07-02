$(document).ready(function (e) {

    const LOGGEDINkEY = "app_u83742wingsevt";

    const DEBUG_PAY = true;
    const PAYSTACK_TEST = "pk_test_d094408d5fd048bc50fa9f99c599ff7986655b68";
    const PAYSTACK_LIVE = "pk_live_3c7b2be1f48b19309aac1e7791e036f7511d139a";

    const BASE_URL = "https://projects.deelesisuanu.com/elliot-events/";

    const ENDPOINTS = {
        login: "login",
        register: "register",
        bookEvent: "createEvent",
        attendEvent: "bookEvent",
        attendEventCode: "bookEventCode",
        likeEvent: "likeEvent",
        likeEventList: "likedEvents",
        deleteEvent: "removeEvent",
        listEvent: "eventData",
        listEventUser: "eventDataUser",
        loadUserInfo: "userInfo",
        loadUsers: "listUsers",
    };

    const OBJECT_DATA = {};

    const qrcode = window.qrcode;

    const video = document.createElement("video");
    const canvasElement = document.getElementById("qr-canvas");
    const canvas = canvasElement.getContext("2d");

    const qrResult = document.getElementById("qr-result");
    const outputData = document.getElementById("outputData");
    const btnScanQR = document.getElementById("btn-scan-qr");

    let scanning = false;
    let permissions = null;

    setTimeout(() => {
        // console.log(cordova.plugins);
        permissions = cordova.plugins.permissions;
    }, 2500);

    qrcode.callback = (res) => {
        if (res) {
            var loggedInUser = getStorage(LOGGEDINkEY);
            let formData = new FormData();
            formData.append("emailAddress", loggedInUser);
            formData.append("eventCode", res);
            var params = {};
            endpointInterface(
                "POST",
                "attendEventCode",
                formData,
                params,
                function (param) {
                    var json = JSON.parse(param.responseData);
                    jqueryMessage(`${json.status ? "Success" : "Error"}`, `${json.text}`);
                    loadUserEvents(loggedInUser);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            );

            scanning = false;
            video.srcObject.getTracks().forEach((track) => {
                track.stop();
            });

            qrResult.hidden = false;
            canvasElement.hidden = true;
            // btnScanQR.hidden = false;
        }
    };

    btnScanQR.onclick = () => {
        permissions.checkPermission("android.permission.CAMERA", function (status) {
            console.log('success checking permission');
            console.log('Has CAMERA:', status.hasPermission);
            if (!status.hasPermission) {
                app.permissions.requestPermission("android.permission.CAMERA", function (status) {
                    console.log('success requesting CAMERA permission');
                    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        navigator.mediaDevices
                        .getUserMedia({ video: { facingMode: "environment" } })
                        .then(function (stream) {
                            scanning = true;
                            qrResult.hidden = true;
                            // btnScanQR.hidden = true;
                            canvasElement.hidden = false;
                            video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                            video.srcObject = stream;
                            video.play();
                            tick();
                            scan();
                        });
                    }
                }, function (err) {
                    console.log('failed to set permission');
                });
            }
            else {
                if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices
                    .getUserMedia({ video: { facingMode: "environment" } })
                    .then(function (stream) {
                        scanning = true;
                        qrResult.hidden = true;
                        // btnScanQR.hidden = true;
                        canvasElement.hidden = false;
                        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                        video.srcObject = stream;
                        video.play();
                        tick();
                        scan();
                    });
                }
            }
        });
    };

    function tick() {
        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        scanning && requestAnimationFrame(tick);
    }

    function scan() {
        try {
            qrcode.decode();
        } catch (e) {
            setTimeout(scan, 300);
        }
    }

    function generateFormData(object) {
        let formData = new FormData();
        Object.keys(object).forEach((key) => formData.append(key, object[key]));
        return formData;
    }

    function getQueryParameter(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function payWithPaystack(email, event, amount, currentButton) {
        var handler = PaystackPop.setup({
            key: DEBUG_PAY ? PAYSTACK_TEST : PAYSTACK_LIVE,
            email: email,
            amount: amount + "00.00",
            currency: "NGN",
            metadata: {
                custom_fields: [{
                    display_name: "",
                    variable_name: "",
                    value: "",
                }, ],
            },
            callback: function(response) {
                // console.log(response.message);
                if (response.message === "Approved") {
                    orderEvent(event, amount, loggedInUser, currentButton);
                } else {
                    alert("Can not create");
                }
            },
            onClose: function() {
            },
        });
        handler.openIframe();
    }

    function setStorage(key, value) {
        window.localStorage.setItem(key, value);
    }

    function getStorage(key) {
        return window.localStorage.getItem(key);
    }

    function checkStorage(key) {
        var curItem = getStorage(key);
        return curItem == "" || curItem == null ? false : true;
    }

    function removeStorage(key) {
        window.localStorage.removeItem(key);
    }

    function jqueryMessage(title, message) {
        $.alert({
            title: `${title}`,
            content: `${message}`,
        });
    }

    function populateHomeEventList(obj, inner) {
        var currentUser = getStorage(LOGGEDINkEY);
        var amount = ( ( obj.amount == 0 || obj.amount == "0" ) ? "FREE" : "USD " + obj.amount );
        var result = `<div class="card mb-4">
                    <div class="card-header border-bottom popupQr" data-qrcode="${obj.qrCode}">
                        <div class="media">
                            <div class="media-body">
                                <h6 class="mb-1">${obj.author}</h6>
                                <p class="mb-0 text-mute small">${obj.dateTime}</p>
                            </div>
                        </div>
                    </div>
                    <div class="card-img p-0 popupQr" data-qrcode="${obj.qrCode}">
                        <img src="${obj.icon}" alt="" class="w-100" style="height: 335px !important; width: 100% !important;">
                    </div>
                    <div class="card-body popupQr" data-qrcode="${obj.qrCode}">
                        <p style="color: white; background-color: rgb(216, 64, 64); padding: 4px; border: none; border-radius: 5px;">${(obj.category == "") ? "Uncategorized Event" : obj.category}</p>
                        <p class="mb-0 text-mute">${obj.description}</p>
                        <strong class="mb-0 text-danger">${amount}</strong>
                    </div>
                    <div class="card-footer border-top">
                        <div class="row">
                            <div class="col">`;
                            if (obj.likeState == 0) {
            result +=           `<button class="btn btn-link btn-sm px-2 likeContent" data-likeState="${obj.likeState}" data-likeId="${obj.likeId}" data-userId="${currentUser}" data-baseId="${obj.id}" data-baseType="event" data-operation="like">
                                    <i class="material-icons text-danger">favorite_border</i>
                                    <span class="d-none d-sm-inline-block">Like</span>
                                </button>`;
                            }
                            else {
            result +=           `<button class="btn btn-link btn-sm px-2 likeContent" data-likeState="${obj.likeState}" data-likeId="${obj.likeId}" data-userId="${currentUser}" data-baseId="${obj.id}" data-baseType="event" data-operation="unlike">
                                    <i class="material-icons text-danger">favorite</i>
                                    <span class="d-none d-sm-inline-block">Like</span>
                                </button>`;
                            }
            result +=           `<!-- <button class="btn btn-link btn-sm px-2"><i class="material-icons text-warning">chat</i> <span class="d-none d-sm-inline-block">Comments</span></button> -->`;
        if (!inner) {
            result +=           `<button data-amount="${obj.amount}" data-eventId="${obj.id}" class="eventBooking btn btn-link btn-sm px-2"><i class="material-icons text-info">library_books</i><span class="d-none d-sm-inline-block">Book Event</span></button>`;
            result +=           `<div class="spinner-border" role="status" id="eventBookingSpinner${obj.id}" style="display: none"> <span class="visually-hidden"></span></div>`;
        }
        if (obj.authorEmail == currentUser) {
            result += `     <button class="btn btn-link btn-sm px-2 delete-event" data-eventId="${obj.id}"><i class="material-icons text-danger">delete_outline</i> <span class="d-none d-sm-inline-block">Delete</span></button>`;
        }
        result += `             </div>
                        </div>
                    </div>
                </div>`;
        return result;
    }

    function populateHomeEvent(obj) {
        var amount = ( ( obj.amount == 0 || obj.amount == "0" ) ? "FREE" : "USD " + obj.amount );
        var result = `<div class="swiper-slide w-auto px-2 popupQr" style="height: 200px !important;" data-qrcode="${obj.qrCode}">
                    <div class="card w-180 mb-4 position-relative overflow-hidden text-white">
                        <div class="background">
                            <img src="${obj.icon}" alt="" style="height: 200px !important; width: 100% !important">
                        </div>
                        <div class="card-body text-center z-1 h-100px"></div>
                        <div class="card-footer border-0 z-1 text-center" style="margin-top: -40px !important">
                            <!-- <h6 class="mb-1 customiseTextHere">${obj.author}</h6> -->
                            <h6 class="mb-1 customiseTextHere">${obj.name} <small><br/>By ${obj.author}</small></h6>
                            <p style="font-size: 12px; background-color: rgb(216, 64, 64); padding: 4px; border: none; border-radius: 5px;">${(obj.category == "") ? "Uncategorized Event" : obj.category}</p>
                            <p class="customiseTextHere mb-0 text-mute small">${amount}</p>
                        </div>
                    </div>
                </div>`;
        return result;
    }

    function populateFollows(obj) {
        var result = `<div class="col-12 col-md-6">
                        <div class="media mb-4">
                            <figure class="avatar avatar-50 mr-3">
                                <!-- <img src="assets/img/user1.png" alt="Generic placeholder image" /> -->
                            </figure>
                            <div class="media-body">
                                <h6 class="mt-1 mb-1">
                                    ${obj.name} <span class="status vm bg-success"></span>
                                </h6>
                                <p class="small text-mute">${obj.email}</p>
                            </div>
                            <button class="btn btn-default btn-44 shadow-sm">`;
        if (obj.isFollowing) {
            result += `<i class="material-icons">person_add</i>`;
        } else {
            result += `<i class="material-icons">icon_check</i>`;
        }
        result += `</button>
                        </div>
                    </div>`;
        return result;
    }

    function endpointInterface(method, endpoint, formData, params, callback) {
        let requestObject = new XMLHttpRequest();
        requestObject.open(`${method}`, `${BASE_URL}${ENDPOINTS[endpoint]}`);
        requestObject.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                params["responseData"] = this.responseText;
                callback(params);
            }
        };
        formData = method === "POST" ? formData : "";
        requestObject.send(formData);
    }

    function shuffle(sourceArray) {
        for (var i = 0; i < sourceArray.length - 1; i++) {
            var j = i + Math.floor(Math.random() * (sourceArray.length - i));

            var temp = sourceArray[j];
            sourceArray[j] = sourceArray[i];
            sourceArray[i] = temp;
        }
        return sourceArray;
    }

    function genericSearch(searchKey, nameKey, myArray) {
        for (var i = 0; i < myArray.length; i++) {
            if (myArray[i][searchKey] === nameKey) {
                return myArray[i];
            }
        }
    }

    function loadEvents(user) {
        var form = new FormData();
        form.append("user", user);
        var params = {};
        endpointInterface("POST", "listEvent", form, params, function (p) {

            var output = "<div class='card'> <p> NO EVENT AVAILABLE </p> </div>";
            var output2 = "<div class='card' style='padding: 12px;'> <p> NO EVENT AVAILABLE </p> </div>";
            if (p.responseData == "[][]") {
                // $("#eventHomeSlide").html(output);
                $("#eventHomeLists").html(output2);
            } else {
                output = "";
                output2 = "";
                var object = JSON.parse(p.responseData);
                OBJECT_DATA["eventData"] = object;
                // object = shuffle(object);
                var count = 0;
                object.map(function (obj) {
                    count++;
                    if (count <= 5) {
                        output += populateHomeEvent(obj);
                    }
                    output2 += populateHomeEventList(obj, false);
                });
                $("#eventHomeSlide").html(output);
                $("#eventHomeLists").html(output2);
            }
        });
    }

    function loadLikedEvents(user) {
        var form = new FormData();
        form.append("user", user);
        var params = {};
        endpointInterface("POST", "likeEventList", form, params, function (p) {
            var str = p.responseData;
            if(!str.includes("[]")) {
                var object = JSON.parse(p.responseData);
                var output2 = "";
                object.map(function (obj) {
                    output2 += populateHomeEventList(obj, true);
                });
                $("#eventLikedLists").html(output2);
            }
        });
    }

    function loadUserEvents(user) {
        var form = new FormData();
        form.append("user", user);
        var params = {};
        endpointInterface("POST", "listEventUser", form, params, function (p) {
            var object = JSON.parse(p.responseData);
            object = shuffle(object);
            var output2 = "";
            object.map(function (obj) {
                output2 += populateHomeEventList(obj, true);
            });
            $("#eventProfileLists").html(output2);
        });
    }

    function loadUserDetails(user) {
        var form = new FormData();
        form.append("user", user);
        var params = {};
        endpointInterface("POST", "loadUserInfo", form, params, function (p) {
            var object = JSON.parse(p.responseData);
            $(".profileNameDisplay").html(object.name);
            $(".profileEmailDisplay").html(object.email);
            $(".profileNumBookingsDisplay").html(object.numBookings);
            $(".profileNumLikesDisplay").html(object.numLikes);
        });
    }

    function loadUsers(user) {
        // var user = getStorage(LOGGEDINkEY);
        var form = new FormData();
        form.append("user", user);
        var params = {};
        endpointInterface("POST", "loadUsers", form, params, function (p) {
            // console.log(p.responseData);
            var object = JSON.parse(p.responseData);
            var output = "";
            object.map(function (obj) {
                output += populateFollows(obj);
            });
            $("#loadFollowingUser").html(output);
        });
    }

    if (checkStorage(LOGGEDINkEY)) {
        var loggedInUser = getStorage(LOGGEDINkEY);
        $(".loggedIn").show();
        loadEvents(loggedInUser);
        loadLikedEvents(loggedInUser);
        loadUserEvents(loggedInUser);
        loadUserDetails(loggedInUser);
        loadUsers(loggedInUser);
    } else {
        $(".loggedIn").hide();
        $("#chat-tab").click();
    }

    $(".access-register").on("click", function (e) {
        $("#chat-tab2").click();
    });

    $(".access-login").on("click", function (e) {
        $("#chat-tab").click();
    });

    $("#btnCreateEvent").on("click", function () {
        $("#btnCreateEvent").hide(400);
        $("#btnSpinner").show(400);

        const eventDescription = $("#eventDescription").val();
        const eventCategory = $("#eventCategory").val();
        var eventPrice = $("#eventPrice").val();
        const eventName = $("#eventName").val();
        const feat_icon = $("#eventMainIcon")[0].files[0];
        const eventDateTime = $("#eventDateTime").val();

        eventPrice = parseInt(eventPrice);

        if (eventCategory == "" || eventName == "" || eventDateTime == "" || feat_icon == "") {
            jqueryMessage("Empty Fields!", "All Fields Are Required");
            $("#btnCreateEvent").show(400);
            $("#btnSpinner").hide(400);
            return;
        }

        if(typeof eventPrice !== "number") {
            jqueryMessage("Invalid Field!", "Please enter a valid amount");
            $("#btnCreateEvent").show(400);
            $("#btnSpinner").hide(400);
            return;
        }

        if(eventPrice === "") {
            eventPrice = 0;
        }

        var loggedInUser = getStorage(LOGGEDINkEY);

        let formData = new FormData();
        formData.append("eventDescription", eventDescription);
        formData.append("eventName", eventName);
        formData.append("eventCategory", eventCategory);
        formData.append("eventPrice", eventPrice);
        formData.append("eventDateTime", eventDateTime);
        formData.append("feat_icon", feat_icon);
        formData.append("def", "none");
        formData.append("userCreator", loggedInUser);

        var params = {};
        endpointInterface("POST", "bookEvent", formData, params, function (param) {
            var json = JSON.parse(param.responseData);
            jqueryMessage(`${json.status ? "Success" : "Error"}`, `${json.text}`);
            if (json.status) {
                setTimeout(() => {
                    loadEvents(loggedInUser);
                    loadLikedEvents(loggedInUser);
                    loadUserEvents(loggedInUser);
                    $(".create-event-card").hide(400);
                }, 1200);
            }
            $("#btnCreateEvent").show(400);
            $("#btnSpinner").hide(400);
        });
    });

    $("#initializeLogoutButton").on("click", function () {
        var confirm = window.confirm("Are you sure you want to log out?");
        if (confirm) {
            removeStorage(LOGGEDINkEY);
            window.location.reload();
        }
    });

    $('#eventMainIcon[type="file"]').click(function (e) {
        $("#featIconFileName").html("");
    });

    $('#eventMainIcon[type="file"]').change(function (e) {
        if (e.target.files[0] != undefined) {
            var fileName = e.target.files[0].name;
            $("#featIconFileName").html(fileName);
        }
    });

    $("#create-event-toggle").on("click", function () {
        $(".create-event-card").toggle(400);
    });

    $(".select-event-file").on("click", function () {
        $("#eventMainIcon").click();
    });

    $("#signupButton").on("click", function (e) {
        $("#signupArrow").hide(500);
        $("#signupSpinner").show(500);

        var name = $("#signupName").val();
        var email = $("#signupEmail").val();
        var password = $("#signupPassword").val();

        if (name === "") {
            jqueryMessage("Empty Fields!", "FullName is Required");
            $("#signupArrow").show(500);
            $("#signupSpinner").hide(500);
            return;
        }

        if (email === "") {
            jqueryMessage("Empty Fields!", "Email Address is Required");
            $("#signupArrow").show(500);
            $("#signupSpinner").hide(500);
            return;
        }

        if (password === "") {
            jqueryMessage("Empty Fields!", "Password is Required");
            $("#signupArrow").show(500);
            $("#signupSpinner").hide(500);
            return;
        }

        let formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);

        var params = {};
        endpointInterface("POST", "register", formData, params, function (param) {
            var json = JSON.parse(param.responseData);
            jqueryMessage(`${json.status ? "Success" : "Error"}`, `${json.text}`);
            if (json.status) {
                setStorage(LOGGEDINkEY, email);
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            }
            $("#signupArrow").show(500);
            $("#signupSpinner").hide(500);
        });
    });

    $("#signinButton").on("click", function (e) {
        $("#signinArrow").hide(500);
        $("#signinSpinner").show(500);

        var email = $("#signinEmail").val();
        var password = $("#signinPassword").val();

        if (email === "") {
            jqueryMessage("Empty Fields!", "Email Address is Required");
            $("#signinArrow").show(500);
            $("#signinSpinner").hide(500);
            return;
        }

        if (password === "") {
            jqueryMessage("Empty Fields!", "Password is Required");
            $("#signinArrow").show(500);
            $("#signinSpinner").hide(500);
            return;
        }

        let formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        var params = {};
        endpointInterface("POST", "login", formData, params, function (param) {
            var json = JSON.parse(param.responseData);
            jqueryMessage(`${json.status ? "Success" : "Error"}`, `${json.text}`);
            if (json.status) {
                setStorage(LOGGEDINkEY, email);
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            }
            $("#signinArrow").show(500);
            $("#signinSpinner").hide(500);
        });
    });

    function orderEvent(event, price, user, currentButton) {
        let formData = new FormData();
        formData.append("emailAddress", user);
        formData.append("eventId", event);
        formData.append("price", price);
        var params = {};
        endpointInterface("POST", "attendEvent", formData, params, function (param) {
            var json = JSON.parse(param.responseData);
            jqueryMessage(`${json.status ? "Success" : "Error"}`, `${json.text}`);
            loadUserEvents(user);
            loadUserDetails(user);
            currentButton.show(400);
            $(`#eventBookingSpinner${event}`).hide(400);
        });
    }

    $("body").on("click", ".eventBooking", function (e) {
        var event = $(this).attr("data-eventId");
        var price = $(this).attr("data-amount");
        var loggedInUser = getStorage(LOGGEDINkEY);
        var currentButton = $(this);
        currentButton.hide(400);
        $(`#eventBookingSpinner${event}`).show(400);
        if (price == 0 || price == "0") {
            orderEvent(event, price, loggedInUser, currentButton);
        }
        else {
            payWithPaystack(loggedInUser, event, price, currentButton);
        }
    });
    
    $("body").on("click", ".delete-event", function (e) {
        var confirm = window.confirm("Are you sure you want to delete?");
        if(!confirm) {
            return;
        }
        var event = $(this).attr("data-eventId");
        var loggedInUser = getStorage(LOGGEDINkEY);
        var currentButton = $(this);
        currentButton.hide(400);
        $(`#eventBookingSpinner${event}`).show(400);
        let formData = new FormData();
        formData.append("eventId", event);
        var params = {};
        endpointInterface("POST", "deleteEvent", formData, params, function (param) {
            var json = param.responseData;
            jqueryMessage(`${ ( ( json == "success" ) ? "Success" : "Error" ) }`, `${( ( json == "success" ) ? "Event Deleted Successfully" : "Failed to Delete Event. Please try again" )}`);
            loadEvents(loggedInUser);
            loadUserEvents(loggedInUser);
            loadUserDetails(loggedInUser);
            loadLikedEvents(loggedInUser);
            currentButton.show(400);
            $(`#eventBookingSpinner${event}`).hide(400);
        });
    });

    $("body").on("click", ".popupQr", function (e) {
        var code = $(this).attr("data-qrcode");
        $("#popupQrCodeScan").click();
        $("#showQrCodeInfo").attr("src", code);
    });

    var topSearchValue = document.querySelector("#topSearchValue");
    var searchPageSearchVal = document.querySelector("#searchPageSearchVal");

    topSearchValue.addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            var currentValue = $("#topSearchValue").val();
            performSearch(currentValue);
        }
    });

    searchPageSearchVal.addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            var currentValue = $("#searchPageSearchVal").val();
            performSearch(currentValue);
        }
    });

    function performSearch(currentValue) {
        var object = OBJECT_DATA["eventData"];
        var result = genericSearch("name", currentValue, object);
        var output = "";
        if(result !== undefined) {
            $("#search-tab").click();
            $("#searchPageSearchVal").val(currentValue);
            output += populateHomeEventList(result, false);
            $("#eventSearchLists").html(output);
        }
        else {
            alert("Event Not Found");
        }
    }

    $("body").on('click', ".likeContent", function () {  

        var userId = $(this).attr("data-userId");
        var baseId = $(this).attr("data-baseId");
        var baseType = "event";
        var operation = $(this).attr("data-operation");
        var likeId = $(this).attr("data-likeId");
        var likeState = $(this).attr("data-likeState");

        // var loggedInUser = getStorage(LOGGEDINkEY);
        var currentButton = $(this);
        currentButton.hide(400);
        $(`#eventBookingSpinner${baseId}`).show(400);

        let formData = new FormData();
        formData.append("userId", userId);
        formData.append("baseId", baseId);
        formData.append("baseType", baseType);
        formData.append("operation", operation);
        formData.append("likeId", likeId);
        formData.append("likeState", likeState);

        var params = {};
        endpointInterface("POST", "likeEvent", formData, params, function (param) {
            // console.log(param);
            var json = JSON.parse(param.responseData);
            // jqueryMessage(`${json.status ? "Success" : "Error"}`, `${json.text}`);
            if(json.status) {
                loadEvents(loggedInUser);
                loadLikedEvents(loggedInUser);
                loadUserEvents(loggedInUser);
                loadUserDetails(loggedInUser);
            }
            currentButton.show(400);
            $(`#eventBookingSpinner${baseId}`).hide(400);
        });

    });

});
