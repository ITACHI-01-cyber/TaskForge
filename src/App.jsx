import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TaskProvider } from './context/TaskContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'

const AppLayout = lazy(() => import('./components/layout/AppLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))
const taskPages = () => import('./pages/TaskViews')
const plannerPages = () => import('./pages/PlannerViews')
const page = (load, name) => lazy(() => load().then(module => ({default:module[name]})))
const Tasks = page(taskPages, 'Tasks')
const Today = page(taskPages, 'Today')
const Upcoming = page(taskPages, 'Upcoming')
const Habits = page(plannerPages, 'Habits')
const Monthly = page(plannerPages, 'Monthly')
const Quarterly = page(plannerPages, 'Quarterly')
const Yearly = page(plannerPages, 'Yearly')
const Notes = page(plannerPages, 'Notes')
const Analytics = page(plannerPages, 'Analytics')
const loading = <div className="workspace-skeleton" role="status" aria-label="Loading page"/>

export default function App() {
  return <BrowserRouter><AuthProvider><Suspense fallback={loading}><Routes>
    <Route element={<ProtectedRoute guest/>}>
      <Route path="login" element={<Login/>}/>
      <Route path="signup" element={<Signup/>}/>
    </Route>
    <Route element={<ProtectedRoute/>}>
      <Route element={<TaskProvider><AppLayout/></TaskProvider>}>
        <Route path="dashboard" element={<Dashboard/>}/>
        <Route path="tasks" element={<Tasks/>}/>
        <Route path="today" element={<Today/>}/>
        <Route path="upcoming" element={<Upcoming/>}/>
        <Route path="calendar" element={<Calendar/>}/>
        <Route path="habits" element={<Habits/>}/>
        <Route path="monthly" element={<Monthly/>}/>
        <Route path="quarterly" element={<Quarterly/>}/>
        <Route path="yearly" element={<Yearly/>}/>
        <Route path="analytics" element={<Analytics/>}/>
        <Route path="notes" element={<Notes/>}/>
        <Route path="profile" element={<Profile/>}/>
        <Route path="settings" element={<Settings/>}/>
        <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
      </Route>
    </Route>
  </Routes></Suspense></AuthProvider></BrowserRouter>
}