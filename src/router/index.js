import { createRouter, createWebHistory } from 'vue-router'
import { EMBED } from '@/config'

const clinicalRoutes = [
  {
    path: '/',
    name: 'preloader',
    component: () => import('../views/PreloaderView.vue'),
  },
  {
    path: '/calibration',
    name: 'calibration',
    component: () => import('../views/CalibrationView.vue'),
  },
  {
    path: '/level',
    name: 'level',
    component: () => import('../views/ListenLevel.vue'),
  },
  {
    path: '/task',
    name: 'task',
    component: () => import('../views/TaskView.vue'),
    meta: { oneWay: true },
  },
  {
    path: '/end',
    name: 'end',
    component: () => import('../views/EndView.vue'),
    meta: { oneWay: true },
  },
]

// Embed flow mirrors the HearDigits widget it replaces: no participant ID,
// no SPL-meter calibration; disclaimer -> comfortable level -> instructions -> task.
const embedRoutes = [
  {
    path: '/',
    name: 'preloader',
    component: () => import('../views/PreloaderView.vue'),
  },
  {
    path: '/disclaimer',
    name: 'disclaimer',
    component: () => import('../views/DisclaimerView.vue'),
  },
  {
    path: '/level',
    name: 'level',
    component: () => import('../views/LevelView.vue'),
  },
  {
    path: '/instructions',
    name: 'instructions',
    component: () => import('../views/InstructionsView.vue'),
  },
  {
    path: '/task',
    name: 'task',
    component: () => import('../views/TaskView.vue'),
    meta: { oneWay: true },
  },
  {
    path: '/end',
    name: 'end',
    component: () => import('../views/EndView.vue'),
    meta: { oneWay: true },
  },
]

const activeRoutes = EMBED ? embedRoutes : clinicalRoutes
const forwardOrder = activeRoutes.map((r) => r.path)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: activeRoutes,
})


//"oneWay" routes are only allowed to move forward, back button is efffectively disabled
router.beforeEach(async (to, from, next) => {
  if (!EMBED) {
    // In the embed the host owns the page chrome; don't hijack unload.
    window.onbeforeunload = function () {
      return "Are you sure you want to leave?";
    };
  }

  if (from.meta.oneWay == true) {
    const i = forwardOrder.indexOf(from.path)
    if (i !== -1 && forwardOrder[i + 1] === to.path) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }

})


export default router
