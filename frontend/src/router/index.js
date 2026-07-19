import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import LoginView from '../views/LoginView.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true } 
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true }, // Protect the entire layout
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue')
      },
      
      // ==========================================
      // OPD MODULE
      // ==========================================
      {
        path: 'opd',
        children: [
          {
            path: 'appointment',
            name: 'opd-appointment',
            component: () => import('../views/opd/Index.vue'),
            meta: { permission: 'opd.view' }
          },
          {
            path: 'create',
            name: 'opd-create',
            component: () => import('../views/opd/Create.vue'),
            meta: { permission: 'opd.view' }
          },
          {
            path: 'payment',
            name: 'opd-payment',
            component: () => import('../views/opd/payment/Index.vue'),
            meta: { permission: 'opd.payment' }
          }
        ]
      },
      // ==========================================
      // DENTAL MODULE
      // ==========================================
      {
        path: 'dental',
        children: [
          {
            path: 'appointment',
            name: 'dental-appointment',
            component: () => import('../views/dental/Index.vue'),
            meta: { permission: 'dental.view' }
          },
          {
            path: 'create',
            name: 'dental-create',
            component: () => import('../views/dental/Create.vue'),
            meta: { permission: 'dental.view' }
          },
          {
            path: ':id/view',
            name: 'dental-view',
            component: () => import('../views/dental/View.vue'),
            meta: { permission: 'dental.view' }
          },
          {
            path: 'payment',
            name: 'dental-payment',
            component: () => import('../views/dental/payment/Index.vue'),
            meta: { permission: 'dental.view' }
          }
        ]
      },
      // ==========================================
      // EMERGENCY MODULE
      // ==========================================
      {
        path: 'emergency',
        children: [
          {
            path: 'visits',
            name: 'emergency-visits',
            component: () => import('../views/emergency/Index.vue'),
            meta: { permission: 'emergency.view' }
          },
          {
            path: 'view/:id',
            name: 'emergency-view',
            component: () => import('../views/emergency/View.vue'),
            meta: { permission: 'emergency.view' }
          },
          {
            path: 'payment',
            name: 'emergency-payment',
            component: () => import('../views/emergency/payment/Index.vue'),
            meta: { permission: 'emergency.payment' }
          }
        ]
      },
      // ==========================================
      // IPD MODULE
      // ==========================================
      {
        path: 'ipd',
        children: [
          {
            path:'my-patient',
            name: 'ipd-my-patient',
            component: () => import('../views/ipd/patient/Index.vue'),
            meta: { permission: 'ipd.view' }
          },
          {
            path: 'my-patient/view/:id',
            name: 'ipd-patient-view',
            component: () => import('../views/ipd/patient/View.vue'),
            props: true,
            meta: { permission: 'ipd.view' }
          },
          { 
            path:'admission',
            name: 'ipd-admission',
            component: () => import('../views/ipd/admission/Index.vue'),
            meta: { permission: 'ipd.admit' }

          },
          {
            path: 'ward',
            name: 'ipd-ward',
            component: () => import('../views/ipd/ward/Index.vue'),
            meta: { permission: 'ipd.view' }
          },
          {
            path: 'ward/view/:id',
            name: 'ipd-ward-view',
            component: () => import('../views/ipd/ward/View.vue'),
            meta: { permission: 'ipd.view' }
          },
          {
            path:'charges',
            name:'ipd-charges',
            component:() => import('../views/ipd/charges/Index.vue'),
            meta: { permission: 'ipd.charges.view' }
          },
      
          {
            path:'charges/view/:id',
            name:'ipd-charges-view',
            component:() => import('../views/ipd/charges/View.vue'),
            meta: { permission: 'ipd.charges.view' }
          },
          {
            path: 'payment',
            name: 'ipd-payment',
            component: () => import('../views/ipd/payment/Index.vue'),
            meta: { permission: 'ipd.payment' }
          }
        ]
      },
      // ==========================================
      // LABORATORY MODULE
      // ==========================================
      {
        path: 'laboratory',
        meta: { permission: 'lab.view' },
        children: [
          {
            path: 'manage',
            name: 'laboratory-manage',
            component: () => import('../views/laboratory/manage/Index.vue'),
            meta: { permission: 'lab.view' }
          },
          {
            path: 'payment',
            name: 'laboratory-payment',
            component: () => import('../views/laboratory/payment/Index.vue'),
            meta: { permission: 'lab.payment' }
          },
          {
            path: 'order',
            name: 'laboratory-order',
            component: () => import('../views/laboratory/order/Index.vue'),
            meta: { permission: 'lab.order' }
          },
          {
            path: 'order/create',
            name: 'laboratory-order-create',
            component: () => import('../views/laboratory/order/Create.vue'),
            meta: { permission: 'lab.order' }
          },
          {
            path: 'order/edit/:id',
            name: 'laboratory-order-edit',
            component: () => import('../views/laboratory/order/Edit.vue'),
            meta: { permission: 'lab.order' },
            props: true
          },
          {
            path: 'category',
            name: 'laboratory-category',
            component: () => import('../views/laboratory/category/Index.vue'),
            meta: { permission: 'lab.view' }
          },
          {
            path: 'sample-type',
            name: 'laboratory-sample-type',
            component: () => import('../views/laboratory/sampleType/Index.vue'),
            meta: { permission: 'lab.view' }
          },
          {
            path: 'sample-type/view/:id',
            name: 'laboratory-sample-type-view',
            component: () => import('../views/laboratory/sampleType/labTest/Index.vue'),
            meta: { permission: 'lab.view' },
            props: true
          },
          {
            path: 'test/:id/params',
            name: 'laboratory-test-params',
            component: () => import('../views/laboratory/sampleType/labTest/labParams/Index.vue'),
            meta: { permission: 'lab.view' },
            props: true
          },
          // {
          //   path: 'test-parameter',
          //   name: 'laboratory-test-parameter',
          //   component: () => import('../views/laboratory/testParameter/Index.vue'),
          //   meta: { permission: 'lab.view' }
          // },
          {
            path: 'instrument',
            name: 'laboratory-instrument',
            component: () => import('../views/laboratory/instrument/Index.vue'),
            meta: { permission: 'lab.view' }
          }
        ]
      },
      //RADIOLOGY MODULE
      {
        path: 'radiology',
        meta: { permission: 'radiology.view' },
        children: [
          {
            path: 'manage',
            name: 'radiology-manage',
            component: () => import('../views/radiology/manage/Index.vue'),
            meta: { permission: 'radiology.view' }
          },
          {
            path: 'order',
            name: 'radiology-order',
            component: () => import('../views/radiology/order/Index.vue'),
            meta: { permission: 'radiology.order' }
          },
          {
            path: 'order/create',
            name: 'radiology-order-create',
            component: () => import('../views/radiology/order/Create.vue'),
            meta: { permission: 'radiology.order' }
          },
          {
            path: 'order/edit/:id',
            name: 'radiology-order-edit',
            component: () => import('../views/radiology/order/Edit.vue'),
            meta: { permission: 'radiology.order' },
            props: true
          },
          {
            path: 'category',
            name: 'radiology-category',
            component: () => import('../views/radiology/category/Index.vue'),
            meta: { permission: 'radiology.view' }
          },
          {
            path: 'category/create',
            name: 'radiology-category-create',
            component: () => import('../views/radiology/category/Create.vue'),
            meta: { permission: 'radiology.view' }
          },
          {
            path: 'category/view/:id',
            name: 'radiology-category-view',
            component: () => import('../views/radiology/category/View.vue'),
            meta: { permission: 'radiology.view' },
            props: true
          },
          {
            path: 'payment',
            name: 'radiology-payment',
            component: () => import('../views/radiology/payment/Index.vue'),
            meta: { permission: 'radiology.payment' }
          }
        ]
      },

      {
        path:'pharmacy',
        meta:{permission:'pharmacy.view'},
        children:[
          {
            path:'manage',
            name:'pharmacy-manage',
            component:()=>import('../views/pharmacy/manage/Index.vue'),
            meta:{permission:'pharmacy.view'}
          },
          {
            path:'category',
            name:'pharmacy-category',
            component:()=>import('../views/pharmacy/category/Index.vue'),
            meta:{permission:'pharmacy.view'}
          },
          {
            path:'category/create',
            name:'pharmacy-category-create',
            component:()=>import('../views/pharmacy/category/Create.vue'),
            meta:{permission:'pharmacy.view'}
          },
          // {
          //   path:'payment',
          //   name:'pharmacy-payment',
          //   component:()=>import('../views/pharmacy/payment/Index.vue'),
          //   meta:{permission:'pharmacy.payment'}
          // },
          {
            path:'supplier',
            name:'pharmacy-supplier',
            component:()=>import('../views/pharmacy/supplier/Index.vue'),
            meta:{permission:'pharmacy.view'}
          },
          {
            path:'supplier/create',
            name:'pharmacy-supplier-create',
            component:()=>import('../views/pharmacy/supplier/Create.vue'),
            meta:{permission:'pharmacy.view'}
          },
          {
            path:'supplier/edit/:id',
            name:'pharmacy-supplier-edit',
            component:()=>import('../views/pharmacy/supplier/Edit.vue'),
            meta:{permission:'pharmacy.view'},
            props:true
          }
        ]
      },
      // ==========================================
      // HR MODULE
      // ==========================================
      // Employees
      {
        path: 'employee',
        children: [
          {
            path: '',
            name: 'employee',
            component: () => import('../views/hr/employee/Index.vue'),
            meta: { permission: 'employee.view' }
          },
          {
            path: 'create',
            name: 'employee-create',
            component: () => import('../views/hr/employee/Create.vue'),
            meta: { permission: 'employee.create' }
          },
          {
            path: 'edit/:id',
            name: 'employee-edit',
            component: () => import('../views/hr/employee/Edit.vue'),
            props: true,
            meta: { permission: 'employee.update' }
          }
        ]
      },
      // Doctors
      {
        path: 'doctors',
        children: [
          {
            path: '',
            name: 'doctors',
            component: () => import('../views/doctor/Index.vue'),
            meta: { permission: 'doctor.view' }
          },
          {
            path: 'create',
            name: 'doctors-create',
            component: () => import('../views/doctor/Create.vue'),
            meta: { permission: 'doctor.view' }
          },
          {
            path: 'view/:id',
            name: 'doctors-view',
            component: () => import('../views/doctor/View.vue'),
            meta: { permission: 'doctor.view' }
          },
          {
            path: 'edit/:id',
            name: 'doctors-edit',
            component: () => import('../views/doctor/Edit.vue'),
            meta: { permission: 'doctor.update' }
          }
        ]
      },
      {
        path:'nurse',
        children:[
          {
            path:'my-station',
            name:'my-station',
            component: () => import('../views/nursing/my_station/Index.vue'),
            meta: { permission: 'my_station.view' }
          },
          {
            path:'nursing-station',
            name:'nursing-station',
            component: () => import('../views/nursing/nursing_station/Index.vue'),
            meta: { permission: 'nursing_station.view' }
          },
          {
            path:'nursing-station/create',
            name:'nursing-station-create',
            component: () => import('../views/nursing/nursing_station/Create.vue'),
            meta: { permission: 'nursing_station.create' }
          },
          {
            path:'nursing-station/edit/:id',
            name:'nursing-station-edit',
            component: () => import('../views/nursing/nursing_station/Edit.vue'),
            props: true,
            meta: { permission: 'nursing_station.update' }
          },
          {
            path:'nursing-station/view/:id',
            name:'nursing-station-view',
            component: () => import('../views/nursing/nursing_station/View.vue'),
            props: true,
            meta: { permission: 'nursing_station.view' }
          }
        ]
      },
      // Salary Bonus
      {
        path: 'salary-bonus',
        children: [
          {
            path: '',
            name: 'salary-bonus',
            component: () => import('../views/hr/salary_bonus/Index.vue'),
            meta: { permission: 'salary_bonus.view' }
          },
          {
            path: 'view/:id',
            name: 'salary-bonus-view',
            component: () => import('../views/hr/salary_bonus/View.vue'),
            props: true,
            meta: { permission: 'salary_bonus.view' }
          }
        ]
      },

      // ==========================================
      // MASTERS MODULE
      // ==========================================
      {
        path: 'department',
        name: 'department',
        component: () => import('../views/master/department/Index.vue'),
        meta: { permission: 'department.view' }
      },
      {
        path: 'designation',
        name: 'designation',
        component: () => import('../views/master/designation/Index.vue'),
        meta: { permission: 'designation.view' }
      },
      {
        path: 'specialization',
        name: 'specialization',
        component: () => import('../views/master/spcialization/Index.vue'),
        meta: { permission: 'specialization.view' }
      },
      // Users
      {
        path: 'users',
        children: [
          {
            path: '',
            name: 'users',
            component: () => import('../views/master/users/Index.vue'),
            meta: { permission: 'user.view' }
          },
          {
            path: 'view/:id',
            name: 'users-view',
            component: () => import('../views/master/users/View.vue'),
            props: true,
            meta: { permission: 'user.view' }
          },
          {
            path: 'edit/:id',
            name: 'users-edit',
            component: () => import('../views/master/users/Edit.vue'),
            props: true,
            meta: { permission: 'user.view' }
          }
        ]
      },
      // Roles
      {
        path: 'roles',
        children: [
          {
            path: '',
            name: 'roles',
            component: () => import('../views/master/roles/Index.vue'),
            meta: { permission: 'user.view' }
          },
          {
            path: 'view/:id',
            name: 'roles-view',
            component: () => import('../views/master/roles/View.vue'),
            props: true,
            meta: { permission: 'user.view' }
          }
        ]
      },
      {
        path: 'permissions',
        children: [
          {
            path: '',
            name: 'permissions',
            component: () => import('../views/master/permission/Index.vue'),
            meta: { permission: 'user.view' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Global Navigation Guard
router.beforeEach((to, from) => {
  const authStore = useAuthStore()

  // 1. If route requires authentication and user is NOT logged in
  if (to.matched.some(record => record.meta.requiresAuth) && !authStore.isAuthenticated) {
    return { name: 'login' } // Kick them back to login
  } 
  // 2. If route has permission metadata and user is not authorized
  else if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    return { name: 'dashboard' } // Redirect to dashboard
  }
  // 3. If route is for guests only (e.g. login) and user IS logged in
  else if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' } // Redirect straight to dashboard
  } 
  // 4. Otherwise, let them proceed normally
  return true
})

export default router
