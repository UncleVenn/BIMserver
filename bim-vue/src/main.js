import Vue from 'vue'
import App from './App.vue'
import bimserver from "./assets/js/bimserver/bimserver.js";
import 'element-ui/lib/theme-chalk/index.css';
import ElementUI from 'element-ui';
import "@/assets/icon/font_4461169_8ox45gerl97/iconfont.css"
Vue.config.productionTip = false
Vue.prototype.$bimserver = bimserver;
Vue.use(ElementUI);
const vm = new Vue({
    render: h => h(App),
}).$mount('#app');
Vue.prototype.$bus = vm;
