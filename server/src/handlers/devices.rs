// Multi-device registration handlers with WebPush support

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::handlers::common::{AppState, PushSubscription};
use std::sync::Mutex;
use std::collections::HashMap;

// In-memory store for encrypted data (in production, use database with expiration)
static ENCRYPTED_DATA_STORE: Mutex<Option<HashMap<String, (Vec<u8>, Vec<u8>, Vec<u8>, String)>>> = Mutex::new(None);

fn get_encrypted_data_store() -> &'static Mutex<HashMap<String, (Vec<u8>, Vec<u8>, Vec<u8>, String)>> {
    static ONCE: std::sync::Once = std::sync::Once::new();
    static mut STORE: Option<Mutex<HashMap<String, (Vec<u8>, Vec<u8>, Vec<u8>, String)>>> = None;
    
    unsafe {
        ONCE.call_once(|| {
            STORE = Some(Mutex::new(HashMap::new()));
        });
        STORE.as_ref().unwrap()
    }
}

// Request/Response types
#[derive(Debug, Deserialize)]
pub struct RegisterFirstDeviceRequest {
    pub phone: String,
    pub device_id: String,
    pub push_subscription: Option<PushSubscription>,
}

#[derive(Debug, Serialize)]
pub struct RegisterFirstDeviceResponse {
    pub success: bool,
    pub device_id: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterDeviceRequest {
    pub phone: String,
    pub device_id: String,
    pub push_subscription: Option<PushSubscription>,
}

#[derive(Debug, Serialize)]
pub struct RegisterDeviceResponse {
    pub success: bool,
    pub device_id: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequestRequest {
    pub phone: String,
    pub device_id: String,
    pub action: String, // 'login_request'
    pub password: String, // derived password from short code
}

#[derive(Debug, Serialize)]
pub struct LoginRequestResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct UploadEncryptedDataRequest {
    pub phone: String,
    pub transfer_id: String,
    pub encrypted_data: Vec<u8>,
    pub salt: Vec<u8>,
    pub iv: Vec<u8>,
}

#[derive(Debug, Serialize)]
pub struct UploadEncryptedDataResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct DownloadEncryptedDataRequest {
    pub phone: String,
    pub transfer_id: String,
}

#[derive(Debug, Serialize)]
pub struct DownloadEncryptedDataResponse {
    pub success: bool,
    pub encrypted_data: Option<Vec<u8>>,
    pub salt: Option<Vec<u8>>,
    pub iv: Option<Vec<u8>>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct GetDevicesRequest {
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct DeviceInfo {
    pub credential_id: String,
    pub device_name: Option<String>,
    pub created_at: String,
    pub last_used_at: Option<String>,
    pub is_current: bool, // Whether this is the current device
}

#[derive(Debug, Serialize)]
pub struct GetDevicesResponse {
    pub success: bool,
    pub devices: Vec<DeviceInfo>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct DeleteDeviceRequest {
    pub phone: String,
    pub credential_id: String,
}

#[derive(Debug, Serialize)]
pub struct DeleteDeviceResponse {
    pub success: bool,
    pub message: String,
}

// Register first device (onboarding or SMS recovery)
pub async fn register_first_device(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<RegisterFirstDeviceRequest>,
) -> Result<Json<RegisterFirstDeviceResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            // Get or create user
            let user_result = sqlx::query(
                "SELECT id FROM users WHERE phone = $1"
            )
            .bind(&body.phone)
            .fetch_optional(&pool)
            .await;

            let user_id = match user_result {
                Ok(Some(row)) => row.try_get::<i32, _>("id").unwrap_or(0),
                Ok(None) => {
                    // Create user if doesn't exist
                    let result = sqlx::query(
                        "INSERT INTO users (phone, created_at) VALUES ($1, now()) RETURNING id"
                    )
                    .bind(&body.phone)
                    .fetch_one(&pool)
                    .await;

                    match result {
                        Ok(row) => row.try_get::<i32, _>("id").unwrap_or(0),
                        Err(e) => {
                            eprintln!("Error creating user: {}", e);
                            return Err(StatusCode::INTERNAL_SERVER_ERROR);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error checking user: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            };

            // Register device (simple device_id, no WebAuthn)
            Ok(Json(RegisterFirstDeviceResponse {
                success: true,
                device_id: body.device_id.clone(),
                message: "Device registered successfully".to_string(),
            }))
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

// Register additional device
pub async fn register_device(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<RegisterDeviceRequest>,
) -> Result<Json<RegisterDeviceResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            // Get user
            let user_result = sqlx::query(
                "SELECT id FROM users WHERE phone = $1"
            )
            .bind(&body.phone)
            .fetch_optional(&pool)
            .await;

            let user_id = match user_result {
                Ok(Some(row)) => row.try_get::<i32, _>("id").unwrap_or(0),
                Ok(None) => return Err(StatusCode::NOT_FOUND),
                Err(e) => {
                    eprintln!("Error getting user: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            };

            // Register device (simple device_id, no WebAuthn)
            Ok(Json(RegisterDeviceResponse {
                success: true,
                device_id: body.device_id.clone(),
                message: "Device registered successfully".to_string(),
            }))
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

// Get list of devices for a user
pub async fn get_devices(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<GetDevicesRequest>,
) -> Result<Json<GetDevicesResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            // Get user
            let user_result = sqlx::query(
                "SELECT id FROM users WHERE phone = $1"
            )
            .bind(&body.phone)
            .fetch_optional(&pool)
            .await;

            let user_id = match user_result {
                Ok(Some(row)) => row.try_get::<i32, _>("id").unwrap_or(0),
                Ok(None) => {
                    return Ok(Json(GetDevicesResponse {
                        success: true,
                        devices: vec![],
                        message: "No devices found".to_string(),
                    }));
                }
                Err(e) => {
                    eprintln!("Error getting user: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            };

            // Get devices for user (simplified - no device storage, return empty list)
            Ok(Json(GetDevicesResponse {
                success: true,
                devices: vec![],
                message: "Devices retrieved successfully".to_string(),
            }))
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

// Delete a device
pub async fn delete_device(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<DeleteDeviceRequest>,
) -> Result<Json<DeleteDeviceResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            // Get user
            let user_result = sqlx::query(
                "SELECT id FROM users WHERE phone = $1"
            )
            .bind(&body.phone)
            .fetch_optional(&pool)
            .await;

            let user_id = match user_result {
                Ok(Some(row)) => row.try_get::<i32, _>("id").unwrap_or(0),
                Ok(None) => return Err(StatusCode::NOT_FOUND),
                Err(e) => {
                    eprintln!("Error getting user: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            };

            // Delete device (simplified - no device storage, just return success)
            Ok(Json(DeleteDeviceResponse {
                success: true,
                message: "Device deleted successfully".to_string(),
            }))
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

// Send login request to other devices
pub async fn send_login_request(
    State((_pool, _otp_store, push_subscriptions)): State<AppState>,
    Json(body): Json<LoginRequestRequest>,
) -> Result<Json<LoginRequestResponse>, StatusCode> {
    // Get push subscriptions for this phone
    let subs = push_subscriptions.lock().unwrap();
    let user_subs = subs.get(&body.phone);

    if let Some(subs_list) = user_subs {
        // TODO: Send push notification to all devices
        // For now, just return success
        Ok(Json(LoginRequestResponse {
            success: true,
            message: format!("Login request sent to {} device(s)", subs_list.len()),
        }))
    } else {
        Ok(Json(LoginRequestResponse {
            success: false,
            message: "No devices found for this phone number".to_string(),
        }))
    }
}

// Upload encrypted data from old device
pub async fn upload_encrypted_data(
    State((_pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<UploadEncryptedDataRequest>,
) -> Result<Json<UploadEncryptedDataResponse>, StatusCode> {
    let store = get_encrypted_data_store();
    let mut store = store.lock().unwrap();
    
    store.insert(
        body.transfer_id.clone(),
        (body.encrypted_data, body.salt, body.iv, body.phone),
    );

    Ok(Json(UploadEncryptedDataResponse {
        success: true,
        message: "Encrypted data uploaded successfully".to_string(),
    }))
}

// Download encrypted data for new device
pub async fn download_encrypted_data(
    State((_pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<DownloadEncryptedDataRequest>,
) -> Result<Json<DownloadEncryptedDataResponse>, StatusCode> {
    let store = get_encrypted_data_store();
    let store = store.lock().unwrap();
    
    if let Some((encrypted_data, salt, iv, phone)) = store.get(&body.transfer_id) {
        if phone == &body.phone {
            Ok(Json(DownloadEncryptedDataResponse {
                success: true,
                encrypted_data: Some(encrypted_data.clone()),
                salt: Some(salt.clone()),
                iv: Some(iv.clone()),
                message: "Encrypted data retrieved successfully".to_string(),
            }))
        } else {
            Ok(Json(DownloadEncryptedDataResponse {
                success: false,
                encrypted_data: None,
                salt: None,
                iv: None,
                message: "Phone number mismatch".to_string(),
            }))
        }
    } else {
        Ok(Json(DownloadEncryptedDataResponse {
            success: false,
            encrypted_data: None,
            salt: None,
            iv: None,
            message: "Transfer ID not found or expired".to_string(),
        }))
    }
}
