import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      meta: {
        oneWay: true
      }   
    },
    {
      path: '/end',
      name: 'end',
      component: () => import('../views/EndView.vue'),
      meta: {
        oneWay: true
      }   
    },
  ],
})


//"oneWay" routes are only allowed to move forward, back button is efffectively disabled
router.beforeEach(async (to, from, next) => {
  window.onbeforeunload = function () {
    return "Are you sure you want to leave?";
  };
  
  if(from.meta.oneWay == true){
    let routes = router.getRoutes();
    let currentRoutePos;
    for(let r=0;r<routes.length;r++){
      if(routes[r].path == from.path){
        currentRoutePos = r;
        break;
      }
    }
    if(routes[currentRoutePos+1]!=null && routes[currentRoutePos+1].path == to.path){
      next();
    } else {
      next(false);
    } 
  } else {
    next();
  }
  
})


export default router
