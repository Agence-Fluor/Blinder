use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::handlers::common::AppState;

#[derive(Debug, Deserialize)]
pub struct SendOtpRequest {
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct SendOtpResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct VerifyOtpRequest {
    pub phone: String,
    pub code: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyOtpResponse {
    pub success: bool,
    pub message: String,
}

// Generate a random 6-digit OTP
fn generate_otp() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    format!("{:06}", rng.gen_range(100000..1000000))
}

pub async fn send_otp(
    State((_pool, otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<SendOtpRequest>,
) -> Json<SendOtpResponse> {
    let code = generate_otp();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Store OTP with 10 minute expiration
    {
        let mut store = otp_store.lock().unwrap();
        store.insert(body.phone.clone(), (code.clone(), timestamp));
    }

    // Log to console (fake SMS)
    println!("[FAKE SMS] Sending OTP to {}: {}", body.phone, code);

    Json(SendOtpResponse {
        success: true,
        message: "OTP sent successfully".to_string(),
    })
}

pub async fn verify_otp(
    State((_pool, otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<VerifyOtpRequest>,
) -> Json<VerifyOtpResponse> {
    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let mut store = otp_store.lock().unwrap();
    
    match store.get(&body.phone) {
        Some((stored_code, timestamp)) => {
            // Check if OTP is expired (10 minutes = 600 seconds)
            if current_time - timestamp > 600 {
                store.remove(&body.phone);
                return Json(VerifyOtpResponse {
                    success: false,
                    message: "OTP expired".to_string(),
                });
            }

            // Verify code
            if stored_code == &body.code {
                store.remove(&body.phone);
                println!("[OTP VERIFIED] Phone: {}, Code: {}", body.phone, body.code);
                Json(VerifyOtpResponse {
                    success: true,
                    message: "OTP verified successfully".to_string(),
                })
            } else {
                Json(VerifyOtpResponse {
                    success: false,
                    message: "Invalid OTP code".to_string(),
                })
            }
        }
        None => Json(VerifyOtpResponse {
            success: false,
            message: "No OTP found for this phone number".to_string(),
        }),
    }
}

