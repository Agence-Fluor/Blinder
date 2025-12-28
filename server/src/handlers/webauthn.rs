use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose};

use crate::handlers::onboarding::AppState;

// Unused for now, but will be used for challenge storage in production
#[allow(dead_code)]
type ChallengeStore = std::sync::Arc<std::sync::Mutex<std::collections::HashMap<String, (String, u64)>>>;

#[allow(dead_code)]
type CredentialStore = std::sync::Arc<std::sync::Mutex<std::collections::HashMap<String, Vec<String>>>>;

#[derive(Debug, Deserialize)]
pub struct RegisterStartRequest {
    pub phone: String,
    pub username: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RegisterStartResponse {
    pub success: bool,
    pub message: String,
    pub challenge: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterCompleteRequest {
    pub phone: String,
    pub credential_id: String,
    pub response: RegisterCompleteResponse,
}

#[derive(Debug, Deserialize)]
pub struct RegisterCompleteResponse {
    pub client_data_json: String,
    pub attestation_object: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterCompleteResponseResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct AuthenticateStartRequest {
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct AuthenticateStartResponse {
    pub success: bool,
    pub message: String,
    pub challenge: Option<String>,
    pub credential_ids: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct AuthenticateCompleteRequest {
    pub phone: String,
    pub credential_id: String,
    pub response: AuthenticateCompleteResponse,
}

#[derive(Debug, Deserialize)]
pub struct AuthenticateCompleteResponse {
    pub client_data_json: String,
    pub authenticator_data: String,
    pub signature: String,
    pub user_handle: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthenticateCompleteResponseResult {
    pub success: bool,
    pub message: String,
}

// Generate a random challenge (base64url encoded)
fn generate_challenge() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..32).map(|_| rng.gen_range(0..255)).collect();
    general_purpose::URL_SAFE_NO_PAD.encode(&bytes)
}

// Get or create challenge store from app state
// For now, we'll use a simple approach and store challenges in memory
// In production, you'd want to use Redis or similar

pub async fn register_start(
    State((_pool, _otp_store)): State<AppState>,
    Json(body): Json<RegisterStartRequest>,
) -> Json<RegisterStartResponse> {
    // Generate challenge
    let challenge = generate_challenge();
    
    // In a real implementation, you'd store this challenge in a database or cache
    // For now, we'll just return it
    println!("[WebAuthn] Registration challenge for {}: {}", body.phone, challenge);
    
    Json(RegisterStartResponse {
        success: true,
        message: "Registration challenge generated".to_string(),
        challenge: Some(challenge),
    })
}

pub async fn register_complete(
    State((_pool, _otp_store)): State<AppState>,
    Json(body): Json<RegisterCompleteRequest>,
) -> Json<RegisterCompleteResponseResult> {
    // In a real implementation, you would:
    // 1. Verify the challenge
    // 2. Verify the attestation object
    // 3. Store the credential ID associated with the phone number
    
    println!("[WebAuthn] Registration complete for {} with credential ID: {}", 
             body.phone, body.credential_id);
    println!("[WebAuthn] Client data JSON: {}", body.response.client_data_json);
    println!("[WebAuthn] Attestation object: {}...", 
             &body.response.attestation_object[..50.min(body.response.attestation_object.len())]);
    
    // For now, we'll just log and accept it
    // In production, you'd verify the attestation using a library like webauthn-rs
    
    Json(RegisterCompleteResponseResult {
        success: true,
        message: "Registration completed successfully".to_string(),
    })
}

pub async fn authenticate_start(
    State((_pool, _otp_store)): State<AppState>,
    Json(body): Json<AuthenticateStartRequest>,
) -> Json<AuthenticateStartResponse> {
    // Generate challenge
    let challenge = generate_challenge();
    
    // In a real implementation, you'd:
    // 1. Look up the user's credential IDs from the database
    // 2. Return them in allowCredentials
    
    println!("[WebAuthn] Authentication challenge for {}: {}", 
             body.phone, challenge);
    
    Json(AuthenticateStartResponse {
        success: true,
        message: "Authentication challenge generated".to_string(),
        challenge: Some(challenge),
        credential_ids: None, // In production, return the user's credential IDs
    })
}

pub async fn authenticate_complete(
    State((_pool, _otp_store)): State<AppState>,
    Json(body): Json<AuthenticateCompleteRequest>,
) -> Json<AuthenticateCompleteResponseResult> {
    // In a real implementation, you would:
    // 1. Verify the challenge
    // 2. Look up the credential ID for this phone number
    // 3. Verify the signature using the stored public key
    // 4. Check the authenticator data
    
    println!("[WebAuthn] Authentication complete for {} with credential ID: {}", 
             body.phone, body.credential_id);
    println!("[WebAuthn] Client data JSON: {}", body.response.client_data_json);
    println!("[WebAuthn] Authenticator data: {}...", 
             &body.response.authenticator_data[..50.min(body.response.authenticator_data.len())]);
    
    // For now, we'll just log and accept it
    // In production, you'd verify the assertion using a library like webauthn-rs
    
    Json(AuthenticateCompleteResponseResult {
        success: true,
        message: "Authentication successful".to_string(),
    })
}

