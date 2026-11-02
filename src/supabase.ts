import {createClient} from '@supabase/supabase-js'
const cfg=(window as any).SHINEPRO||{}
const url=cfg.url||import.meta.env.VITE_SUPABASE_URL||'https://placeholder.supabase.co'
const key=cfg.key||import.meta.env.VITE_SUPABASE_ANON_KEY||'placeholder'
export const configured=!url.includes('placeholder')
export const supabase=createClient(url,key)
export const phoneToEmail=(p:string)=>`${p.replace(/\D/g,'')}@shinepro.app`
