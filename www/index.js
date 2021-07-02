// https://www.npmjs.com/package/cordova-plugin-android-permissions - plugin
// cordova plugin add cordova-plugin-android-permissions - only plugin installed

// https://developer.android.com/reference/android/Manifest.permission.html - list of permissions
// https://developer.android.com/guide/topics/permissions/overview#normal-dangerous - types of permissions

let app = {
    permissions: null,
    init: function () {
        document.addEventListener('deviceready', app.ready);
    },
    ready: function () {
        // console.log()
        //plugins ready
        app.permissions = cordova.plugins.permissions;
        // console.log(app.permissions);
        //add button listeners
        // console.log('adding listeners')
        document.getElementById('btnGeo').addEventListener('click', app.geoPerm);
        document.getElementById('btnCam').addEventListener('click', app.camPerm);
        document.getElementById('btnBlue').addEventListener('click', app.btPerm);
        document.getElementById('btnContact').addEventListener('click', app.contactPerm);
    },
    geoPerm: function () {
        let perms = ["android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_BACKGROUND_LOCATION"
        ]
        app.permissions.checkPermission("android.permission.ACCESS_COARSE_LOCATION", function (status) {
            console.log('success checking permission');
            console.log('HAS ACCESS_COURSE_LOCATION:', status.hasPermission);
            if (!status.hasPermission) {
                app.permissions.requestPermissions(perms, function (status) {
                    console.log('success requesting ACCESS_*_LOCATION permission');
                }, function (err) {
                    console.log('failed to set permission');
                });
            }
        }, function (err) {
            console.log(err);
        });
    },
    btPerm: function () {
        let perms = ["android.permission.BLUETOOTH",
            "android.permission.BLUETOOTH_ADMIN"
        ];
        app.permissions.checkPermission("android.permission.BLUETOOTH", function (status) {
            console.log('success checking permission');
            console.log('Has BLUETOOTH:', status.hasPermission);
            if (!status.hasPermission) {
                app.permissions.requestPermissions(perms, function (status) {
                    console.log('success requesting BLUETOOTH permission');
                }, function (err) {
                    console.log('failed to set permission');
                });
            }
        }, function (err) {
            console.log(err);
        });
    },
    contactPerm: function () {
        let perms = ["android.permission.READ_CONTACTS",
            "android.permission.WRITE_CONTACTS"
        ];
        app.permissions.checkPermission("android.permission.READ_CONTACTS", function (status) {
            console.log('success checking permission');
            console.log('Has READ_CONTACTS:', status.hasPermission);
            if (!status.hasPermission) {
                app.permissions.requestPermissions(perms, function (status) {
                    console.log('success requesting READ_CONTACTS permission');
                }, function (err) {
                    console.log('failed to set permission');
                });
            }
        }, function (err) {
            console.log(err);
        });
    },
    camPerm: function () {
        app.permissions.checkPermission("android.permission.CAMERA", function (status) {
            console.log('success checking permission');
            console.log('Has CAMERA:', status.hasPermission);
            if (!status.hasPermission) {
                app.permissions.requestPermission("android.permission.CAMERA", function (status) {
                    console.log('success requesting CAMERA permission');
                }, function (err) {
                    console.log('failed to set permission');
                });
            }
        }, function (err) {
            console.log(err);
        });
    }
}
app.init();