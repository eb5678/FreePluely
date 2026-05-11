use base64::Engine;
use image::codecs::png::PngEncoder;
use image::{ColorType, GenericImageView, ImageEncoder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::{thread, time::Duration};
use tauri::Emitter;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectionCoords {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone)]
pub struct MonitorInfo {
    pub image: image::RgbaImage,
}

pub struct CaptureState {
    pub captured_monitors: Arc<Mutex<HashMap<usize, MonitorInfo>>>,
    pub overlay_active: Arc<AtomicBool>,
}

impl Default for CaptureState {
    fn default() -> Self {
        Self {
            captured_monitors: Arc::default(),
            overlay_active: Arc::new(AtomicBool::new(false)),
        }
    }
}

fn capture_wayland_geometry(x: i32, y: i32, width: u32, height: u32) -> Result<image::RgbaImage, String> {
    let geom = format!("{},{} {}x{}", x, y, width, height);
    let output = Command::new("grim")
        .args(["-g", &geom, "-"])
        .output()
        .map_err(|e| format!("Failed to execute grim (Make sure it is installed on your popos): {}", e))?;

    if !output.status.success() {
        return Err(format!("grim failed: {}", String::from_utf8_lossy(&output.stderr)));
    }

    image::load_from_memory(&output.stdout)
        .map_err(|e| format!("Failed to decode grim output: {}", e))
        .map(|img| img.to_rgba8())
}

#[tauri::command]
pub async fn start_screen_capture(app: tauri::AppHandle) -> Result<(), String> {
    let tauri_monitors = app
        .available_monitors()
        .map_err(|e| format!("Failed to get monitor layout: {}", e))?;

    if tauri_monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    let state = app.state::<CaptureState>();
    if state.overlay_active.load(Ordering::SeqCst) {
        let _ = close_overlay_window(app.clone());
    }
    state.overlay_active.store(true, Ordering::SeqCst);
    let mut captured_monitors = HashMap::new();

    for (idx, monitor) in tauri_monitors.iter().enumerate() {
        let pos = monitor.position();
        let size = monitor.size();
        let captured_image = capture_wayland_geometry(pos.x, pos.y, size.width, size.height)
            .map_err(|e| {
                state.overlay_active.store(false, Ordering::SeqCst);
                format!("Failed to capture monitor {}: {}", idx, e)
            })?;

        captured_monitors.insert(idx, MonitorInfo { image: captured_image });
    }

    *state.captured_monitors.lock().unwrap() = captured_monitors;

    for (label, window) in app.webview_windows() {
        if label.starts_with("capture-overlay-") {
            window.destroy().ok();
        }
    }

    for (idx, monitor) in tauri_monitors.iter().enumerate() {
        let scale_factor = monitor.scale_factor();
        let size = monitor.size();
        let position = monitor.position();

        let logical_width = size.width as f64 / scale_factor;
        let logical_height = size.height as f64 / scale_factor;
        let logical_x = position.x as f64 / scale_factor;
        let logical_y = position.y as f64 / scale_factor;

        let window_label = format!("capture-overlay-{}", idx);
        let overlay = WebviewWindowBuilder::new(&app, &window_label, WebviewUrl::App("index.html".into()))
            .title("Screen Capture")
            .inner_size(logical_width, logical_height)
            .position(logical_x, logical_y)
            .transparent(true)
            .always_on_top(true)
            .decorations(false)
            .skip_taskbar(true)
            .resizable(false)
            .closable(false)
            .minimizable(false)
            .maximizable(false)
            .visible(false)
            .focused(true)
            .accept_first_mouse(true)
            .build()
            .map_err(|e| {
                state.overlay_active.store(false, Ordering::SeqCst);
                format!("Failed to create overlay window {}: {}", idx, e)
            })?;

        thread::sleep(Duration::from_millis(100));
        overlay.show().ok();
        overlay.set_always_on_top(true).ok();

        if monitor.name().map_or(false, |n| n == "primary") {
            overlay.set_focus().ok();
        }
    }

    Ok(())
}

#[tauri::command]
pub fn close_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    for (label, window) in app.webview_windows().iter() {
        if label.starts_with("capture-overlay-") {
            window.destroy().ok();
        }
    }

    let state = app.state::<CaptureState>();
    state.captured_monitors.lock().unwrap().clear();
    state.overlay_active.store(false, Ordering::SeqCst);

    if let Some(main_window) = app.get_webview_window("main") {
        main_window.emit("capture-closed", ()).unwrap();
    }

    Ok(())
}

#[tauri::command]
pub async fn capture_selected_area(
    app: tauri::AppHandle,
    coords: SelectionCoords,
    monitor_index: usize,
) -> Result<String, String> {
    let state = app.state::<CaptureState>();
    let mut captured_monitors = state.captured_monitors.lock().unwrap();

    let monitor_info = captured_monitors.remove(&monitor_index).ok_or_else(|| {
        state.overlay_active.store(false, Ordering::SeqCst);
        format!("No captured image found for monitor {}", monitor_index)
    })?;

    if coords.width == 0 || coords.height == 0 {
        return Err("Invalid selection dimensions".to_string());
    }

    let img_width = monitor_info.image.width();
    let img_height = monitor_info.image.height();

    let x = coords.x.min(img_width.saturating_sub(1));
    let y = coords.y.min(img_height.saturating_sub(1));
    let width = coords.width.min(img_width - x);
    let height = coords.height.min(img_height - y);

    let cropped = monitor_info.image.view(x, y, width, height).to_image();
    let mut png_buffer = Vec::new();
    PngEncoder::new(&mut png_buffer)
        .write_image(
            cropped.as_raw(),
            cropped.width(),
            cropped.height(),
            ColorType::Rgba8.into(),
        )
        .map_err(|e| format!("Failed to encode to PNG: {}", e))?;

    let base64_str = base64::engine::general_purpose::STANDARD.encode(png_buffer);

    captured_monitors.clear();
    drop(captured_monitors);

    for (label, window) in app.webview_windows().iter() {
        if label.starts_with("capture-overlay-") {
            window.destroy().ok();
        }
    }

    app.emit("captured-selection", &base64_str)
        .map_err(|e| format!("Failed to emit captured-selection event: {}", e))?;
    state.overlay_active.store(false, Ordering::SeqCst);

    Ok(base64_str)
}

#[tauri::command]
pub async fn capture_to_base64(window: tauri::WebviewWindow) -> Result<String, String> {
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "Failed to determine target monitor".to_string())?;

    let pos_x = monitor.position().x;
    let pos_y = monitor.position().y;
    let size_width = monitor.size().width;
    let size_height = monitor.size().height;

    tauri::async_runtime::spawn_blocking(move || {
        let image = capture_wayland_geometry(pos_x, pos_y, size_width, size_height)?;
        let mut png_buffer = Vec::new();
        PngEncoder::new(&mut png_buffer)
            .write_image(
                image.as_raw(),
                image.width(),
                image.height(),
                ColorType::Rgba8.into(),
            )
            .map_err(|e| format!("Failed to encode to PNG: {}", e))?;
        
        Ok(base64::engine::general_purpose::STANDARD.encode(png_buffer))
    })
    .await
    .map_err(|e| format!("Task panicked: {}", e))?
}