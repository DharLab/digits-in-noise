import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

//vuetify
import "vuetify/styles"
import { createVuetify } from 'vuetify'
import { aliases, md } from 'vuetify/iconsets/md'
const vuetify = createVuetify({
    icons: {
        defaultSet: 'md',
        aliases,
        sets: {
          md,
        },
      },
});

const app = createApp(App)
app.use(vuetify);
app.use(createPinia())
app.use(router)

app.mount('#app')
