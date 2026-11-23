//! Desktop embedding for Windows.
//!
//! The wallpaper window is re-parented into the "WorkerW" window that sits
//! between the static wallpaper and the desktop icons (the same trick used by
//! Wallpaper Engine and Lively). Raw user32 bindings are used on purpose, so
//! this file does not depend on the version of the `windows` crate.

#[cfg(windows)]
mod imp {
    type Hwnd = isize;
    type Bool = i32;
    type Lparam = isize;

    #[repr(C)]
    #[derive(Default)]
    struct Rect {
        left: i32,
        top: i32,
        right: i32,
        bottom: i32,
    }

    #[link(name = "user32")]
    extern "system" {
        fn FindWindowW(class: *const u16, title: *const u16) -> Hwnd;
        fn FindWindowExW(parent: Hwnd, after: Hwnd, class: *const u16, title: *const u16) -> Hwnd;
        fn SendMessageTimeoutW(
            hwnd: Hwnd,
            msg: u32,
            wparam: usize,
            lparam: Lparam,
            flags: u32,
            timeout: u32,
            result: *mut usize,
        ) -> isize;
        fn EnumWindows(cb: unsafe extern "system" fn(Hwnd, Lparam) -> Bool, lparam: Lparam) -> Bool;
        fn SetParent(child: Hwnd, new_parent: Hwnd) -> Hwnd;
        fn SetWindowPos(hwnd: Hwnd, after: Hwnd, x: i32, y: i32, cx: i32, cy: i32, flags: u32) -> Bool;
        fn GetForegroundWindow() -> Hwnd;
        fn GetWindowRect(hwnd: Hwnd, rect: *mut Rect) -> Bool;
        fn GetSystemMetrics(index: i32) -> i32;
        fn GetClassNameW(hwnd: Hwnd, buf: *mut u16, max: i32) -> i32;
    }

    const SM_CXSCREEN: i32 = 0;
    const SM_CYSCREEN: i32 = 1;
    const SWP_NOZORDER: u32 = 0x0004;
    const SWP_NOACTIVATE: u32 = 0x0010;
    const SWP_SHOWWINDOW: u32 = 0x0040;
    const SPAWN_WORKERW: u32 = 0x052C;

    fn wide(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    unsafe extern "system" fn enum_proc(hwnd: Hwnd, lparam: Lparam) -> Bool {
        let shell = FindWindowExW(hwnd, 0, wide("SHELLDLL_DefView").as_ptr(), std::ptr::null());
        if shell != 0 {
            // The WorkerW right after the one holding the icons is our target.
            let target = FindWindowExW(0, hwnd, wide("WorkerW").as_ptr(), std::ptr::null());
            if target != 0 {
                *(lparam as *mut Hwnd) = target;
            }
        }
        1
    }

    unsafe fn find_workerw() -> Option<Hwnd> {
        let progman = FindWindowW(wide("Progman").as_ptr(), std::ptr::null());
        if progman == 0 {
            return None;
        }

        // Ask Progman to spawn a WorkerW behind the icons.
        let mut result: usize = 0;
        SendMessageTimeoutW(progman, SPAWN_WORKERW, 0xD, 0x1, 0, 1000, &mut result);
        SendMessageTimeoutW(progman, SPAWN_WORKERW, 0, 0, 0, 1000, &mut result);

        let mut found: Hwnd = 0;
        EnumWindows(enum_proc, &mut found as *mut Hwnd as Lparam);
        if found != 0 {
            return Some(found);
        }

        // Recent Windows 11 builds create the WorkerW as a child of Progman.
        let child = FindWindowExW(progman, 0, wide("WorkerW").as_ptr(), std::ptr::null());
        if child != 0 {
            Some(child)
        } else {
            None
        }
    }

    pub fn attach(hwnd: isize) -> Result<(), String> {
        unsafe {
            let workerw = find_workerw().ok_or("Could not find the desktop WorkerW window")?;
            SetParent(hwnd, workerw);
            let w = GetSystemMetrics(SM_CXSCREEN);
            let h = GetSystemMetrics(SM_CYSCREEN);
            SetWindowPos(hwnd, 0, 0, 0, w, h, SWP_NOZORDER | SWP_NOACTIVATE | SWP_SHOWWINDOW);
        }
        Ok(())
    }

    pub fn is_fullscreen_app_active() -> bool {
        unsafe {
            let fg = GetForegroundWindow();
            if fg == 0 {
                return false;
            }
            let mut buf = [0u16; 64];
            let n = GetClassNameW(fg, buf.as_mut_ptr(), 64).max(0) as usize;
            let class = String::from_utf16_lossy(&buf[..n]);
            if matches!(
                class.as_str(),
                "Progman" | "WorkerW" | "Shell_TrayWnd" | "Shell_SecondaryTrayWnd"
            ) {
                return false;
            }
            let mut r = Rect::default();
            if GetWindowRect(fg, &mut r) == 0 {
                return false;
            }
            r.left <= 0
                && r.top <= 0
                && r.right >= GetSystemMetrics(SM_CXSCREEN)
                && r.bottom >= GetSystemMetrics(SM_CYSCREEN)
        }
    }
}

#[cfg(windows)]
pub use imp::{attach, is_fullscreen_app_active};

#[cfg(not(windows))]
pub fn attach(_hwnd: isize) -> Result<(), String> {
    Err("Wallpaper mode is only available on Windows".into())
}

#[cfg(not(windows))]
pub fn is_fullscreen_app_active() -> bool {
    false
}
