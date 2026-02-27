use serde::Serialize;

#[derive(Debug, thiserror::Error, Serialize)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Invalid geometry: {0}")]
    InvalidGeometry(String),
    #[error("Export failed: {0}")]
    ExportFailed(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Tauri commands require `Result<T, String>` for error serialization across the IPC bridge.
pub type AppResult<T> = Result<T, String>;

/// Convert an `AppError` into a `String` for Tauri IPC.
pub fn to_ipc_error(e: AppError) -> String {
    e.to_string()
}
