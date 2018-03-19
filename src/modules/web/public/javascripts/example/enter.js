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
            this.handlePress()
            // this.entering = true;
        },
        sms: function () {
            this.handlePress()
            // this.entering = true;
        },
        push: function () {
            this.handlePress()
            // this.entering = true;
        },
        handlePress: function () {
            console.log(234234234)

            this.http.get('/')
        }
    }
})