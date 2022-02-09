var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!',
        listData: [1,2,3,4,5],
        objectData: {
            'banana': 'bad',
            'apple': 'red',
        },
        pic: '',
        count: 0,
    },
    methods: {
        AddCount(){
            this.count += 1
        },
    },

    created(){
        console.log('安安')
    },
})