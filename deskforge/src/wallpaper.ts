import { mount } from 'svelte';
import Wallpaper from './wallpaper/Wallpaper.svelte';

export default mount(Wallpaper, { target: document.getElementById('wallpaper')! });
