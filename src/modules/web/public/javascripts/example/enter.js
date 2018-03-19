var app = new Vue({
    el: '#app',
    data: {
        entering: true,
        phoneNumber: null
    },
    methods: {
        enter: function () {
            this.entering = false;
        },
        telegram: function () {
            this.entering = false;
        },
        sms: function () {
            this.entering = false;
        },
    }
})