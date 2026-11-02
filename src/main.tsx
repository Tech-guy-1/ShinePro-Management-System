import {createRoot} from 'react-dom/client'
import App from './App'
import './styles.css'
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{})})
createRoot(document.getElementById('root')!).render(<App/>)
