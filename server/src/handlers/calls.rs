// Call handlers for WebRTC signaling and push notifications

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::handlers::common::{AppState, PushSubscription};

#[derive(Debug, Deserialize)]
pub struct InitiateCallRequest {
    pub from: String,
    pub to: String,
}

#[derive(Debug, Serialize)]
pub struct InitiateCallResponse {
    pub success: bool,
    pub call_id: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct EndCallRequest {
    pub call_id: String,
    pub from: String,
    pub to: String,
}

#[derive(Debug, Serialize)]
pub struct EndCallResponse {
    pub success: bool,
    pub message: String,
}

// In-memory store for active calls (in production, use database)
use std::sync::Mutex;
use std::collections::HashMap;

static ACTIVE_CALLS: Mutex<Option<HashMap<String, (String, String)>>> = Mutex::new(None);

fn get_active_calls() -> &'static Mutex<HashMap<String, (String, String)>> {
    static ONCE: std::sync::Once = std::sync::Once::new();
    static mut STORE: Option<Mutex<HashMap<String, (String, String)>>> = None;
    
    unsafe {
        ONCE.call_once(|| {
            STORE = Some(Mutex::new(HashMap::new()));
        });
        STORE.as_ref().unwrap()
    }
}

// Initiate a call
pub async fn initiate_call(
    State((_pool, _otp_store, push_subscriptions)): State<AppState>,
    Json(body): Json<InitiateCallRequest>,
) -> Result<Json<InitiateCallResponse>, StatusCode> {
    let call_id = Uuid::new_v4().to_string();

    // Store active call
    let calls = get_active_calls();
    calls.lock().unwrap().insert(call_id.clone(), (body.from.clone(), body.to.clone()));

    // Send push notification to recipient
    let subs = push_subscriptions.lock().unwrap();
    if let Some(recipient_subs) = subs.get(&body.to) {
        // TODO: Send push notification "X vous appelle"
        // For now, just log
        println!("Would send push to {}: {} vous appelle", body.to, body.from);
    }

    // Also send via WebSocket if available
    // TODO: Implement WebSocket notification

    Ok(Json(InitiateCallResponse {
        success: true,
        call_id,
        message: "Call initiated".to_string(),
    }))
}

// End a call
pub async fn end_call(
    State((_pool, _otp_store, push_subscriptions)): State<AppState>,
    Json(body): Json<EndCallRequest>,
) -> Result<Json<EndCallResponse>, StatusCode> {
    // Remove from active calls
    let calls = get_active_calls();
    calls.lock().unwrap().remove(&body.call_id);

    // Send push notification for missed call if other party didn't answer
    let subs = push_subscriptions.lock().unwrap();
    if let Some(recipient_subs) = subs.get(&body.to) {
        // TODO: Send push notification "Appel manqué de X"
        println!("Would send missed call push to {}: Appel manqué de {}", body.to, body.from);
    }

    Ok(Json(EndCallResponse {
        success: true,
        message: "Call ended".to_string(),
    }))
}

