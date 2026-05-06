#[cfg(target_os = "macos")]
use tauri::LogicalPosition;
use tauri::{App, AppHandle, Manager, Runtime, WebviewWindow, WebviewWindowBuilder};

const TOP_OFFSET: i32 = 54;

pub fn setup_main_window(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let window = app
        .get_webview_window("main")
        .or_else(|| app.get_webview_window("pluely"))
        .or_else(|| app.webview_windows().values().next().cloned())
        .ok_or("No window found")?;

    position_window_top_center(&window, TOP_OFFSET)?;
    Ok(())
}

pub fn position_window_top_center(
    window: &WebviewWindow,
    y_offset: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(monitor) = window.primary_monitor()? {
        let monitor_size = monitor.size();
        let window_size = window.outer_size()?;
        let center_x = (monitor_size.width as i32 - window_size.width as i32) / 2;

        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: center_x,
            y: y_offset,
        }))?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_window_height(window: tauri::WebviewWindow, height: u32) -> Result<(), String> {
    use tauri::{LogicalSize, Size};
    let new_size = LogicalSize::new(600.0, height as f64);
    window
        .set_size(Size::Logical(new_size))
        .map_err(|e| format!("Failed to resize window: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn open_dashboard(app: tauri::AppHandle) -> Result<(), String> {
    show_dashboard_window(&app)
}

#[tauri::command]
pub fn toggle_dashboard(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(dashboard_window) = app.get_webview_window("dashboard") {
        match dashboard_window.is_visible() {
            Ok(true) => {
                dashboard_window.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
            }
            Ok(false) => {
                show_dashboard_window(&app)?;
            }
            Err(e) => return Err(format!("Failed to check visibility: {}", e)),
        }
    } else {
        show_dashboard_window(&app)?;
    }
    Ok(())
}

#[tauri::command]
pub fn move_window(app: tauri::AppHandle, direction: String, step: i32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let current_pos = window.outer_position().map_err(|e| format!("Error: {}", e))?;
        let (new_x, new_y) = match direction.as_str() {
            "up" => (current_pos.x, current_pos.y - step),
            "down" => (current_pos.x, current_pos.y + step),
            "left" => (current_pos.x - step, current_pos.y),
            "right" => (current_pos.x + step, current_pos.y),
            _ => return Err(format!("Invalid direction: {}", direction)),
        };
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: new_x, y: new_y }))
            .map_err(|e| format!("Failed: {}", e))?;
    }
    Ok(())
}

pub fn create_dashboard_window<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<WebviewWindow<R>, tauri::Error> {
    let base_builder = WebviewWindowBuilder::new(app, "dashboard", tauri::WebviewUrl::App("/chats".into()));

    #[cfg(target_os = "macos")]
    let base_builder = base_builder
        .title("Pluely")
        .center()
        .decorations(true)
        .inner_size(1200.0, 800.0)
        .min_inner_size(800.0, 600.0)
        .hidden_title(true)
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .visible(false);

    #[cfg(not(target_os = "macos"))]
    let base_builder = base_builder
        .title("Pluely")
        .center()
        .decorations(true)
        .inner_size(800.0, 600.0)
        .min_inner_size(800.0, 600.0)
        .visible(false);

    let window = base_builder.build()?;

    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = window_clone.hide();
        }
    });

    Ok(window)
}

// 🐛 WAYLAND FIX 🐛: Force a redraw by setting the size + 1px then back immediately when showing.
pub fn show_dashboard_window<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let window = if let Some(w) = app.get_webview_window("dashboard") {
        w
    } else {
        create_dashboard_window(app).map_err(|e| format!("Failed to create window: {}", e))?
    };

    window.show().map_err(|e| format!("Failed to show window: {}", e))?;
    window.set_focus().map_err(|e| format!("Failed to focus window: {}", e))?;

    // Fix for Wayland buttons not responding to clicks initially
    #[cfg(target_os = "linux")]
    {
        if let Ok(size) = window.inner_size() {
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: size.width + 1,
                height: size.height,
            }));
            let _ = window.set_size(tauri::Size::Physical(size));
        }
    }

    Ok(())
}