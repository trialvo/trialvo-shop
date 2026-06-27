use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    web, Error, HttpMessage,
};
use futures_util::future::{ready, LocalBoxFuture, Ready};
use sha2::{Digest, Sha256};
use std::rc::Rc;
use uuid::Uuid;

use crate::db::admins::get_valid_session;
use crate::AppState;

#[derive(Debug, Clone)]
pub struct AuthenticatedAdmin {
    pub admin_id: Uuid,
    pub role: String,
}

pub struct AdminAuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AdminAuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AdminAuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AdminAuthMiddlewareService { service: Rc::new(service) }))
    }
}

pub struct AdminAuthMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AdminAuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();

        Box::pin(async move {
            // Extract bearer token from Authorization header
            let token = req.headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer "))
                .ok_or_else(|| ErrorUnauthorized("Missing or invalid Authorization header"))?
                .to_string();

            // Hash the token for DB lookup
            let token_hash = hex::encode(Sha256::digest(token.as_bytes()));

            let state = req.app_data::<web::Data<AppState>>()
                .ok_or_else(|| ErrorUnauthorized("Server error"))?;

            let admin_id = get_valid_session(&state.db, &token_hash)
                .await
                .map_err(|_| ErrorUnauthorized("Session lookup failed"))?
                .ok_or_else(|| ErrorUnauthorized("Invalid or expired session"))?;

            // Get admin record for role
            let admin = crate::db::admins::get_admin_by_id(&state.db, admin_id)
                .await
                .map_err(|_| ErrorUnauthorized("Admin lookup failed"))?
                .ok_or_else(|| ErrorUnauthorized("Admin not found"))?;

            if !admin.is_active {
                return Err(ErrorUnauthorized("Admin account is deactivated"));
            }

            req.extensions_mut().insert(AuthenticatedAdmin {
                admin_id: admin.id,
                role: admin.role,
            });

            svc.call(req).await
        })
    }
}
