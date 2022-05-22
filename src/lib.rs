use axum::{
    extract::Path,
    http::StatusCode,
    routing::{get, post},
    Extension, Json, Router,
};
use shuttle_service::error::CustomError;
use sqlx::{Executor, PgPool};
use sync_wrapper::SyncWrapper;

mod models;
use models::*;

/// Utility function for mapping any error into a `400 Bad Request`
/// response.
fn bad_request<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    (StatusCode::BAD_REQUEST, err.to_string())
}

/// Utility function for mapping any error into a `500 Internal Server Error`
/// response.
fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

async fn create_outing(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<OutingNew>,
) -> Result<Json<Outing>, (StatusCode, String)> {
    let result = sqlx::query_as("INSERT INTO outings(name) VALUES ($1) RETURNING *")
        .bind(&payload.name)
        .fetch_one(&pool)
        .await
        .map_err(bad_request)?;

    Ok(Json(result))
}

async fn retrieve_outing(
    Extension(pool): Extension<PgPool>,
    Path(outing_id): Path<i32>,
) -> Result<Json<Outing>, (StatusCode, String)> {
    let result = sqlx::query_as("SELECT * FROM outings WHERE outing_id = $1")
        .bind(outing_id)
        .fetch_optional(&pool)
        .await
        .map_err(internal_error)?;

    if let Some(result) = result {
        Ok(Json(result))
    } else {
        Err((
            StatusCode::NOT_FOUND,
            "Outing with given ID not found".to_string(),
        ))
    }
}

async fn list_outings(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<Outing>>, (StatusCode, String)> {
    let result = sqlx::query_as("SELECT * FROM outings LIMIT 500")
        .fetch_all(&pool)
        .await
        .map_err(internal_error)?;

    Ok(Json(result))
}

async fn create_person(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<PersonNew>,
) -> Result<Json<Person>, (StatusCode, String)> {
    let result = sqlx::query_as("INSERT INTO people(name) VALUES ($1) RETURNING *")
        .bind(&payload.name)
        .fetch_one(&pool)
        .await
        .map_err(bad_request)?;

    Ok(Json(result))
}

async fn retrieve_person(
    Extension(pool): Extension<PgPool>,
    Path(person_id): Path<i32>,
) -> Result<Json<Person>, (StatusCode, String)> {
    let result = sqlx::query_as("SELECT * FROM people WHERE person_id = $1")
        .bind(person_id)
        .fetch_optional(&pool)
        .await
        .map_err(internal_error)?;

    if let Some(result) = result {
        Ok(Json(result))
    } else {
        Err((
            StatusCode::NOT_FOUND,
            "Person with given ID not found".to_string(),
        ))
    }
}

async fn create_expense(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<ExpenseNew>,
) -> Result<Json<Expense>, (StatusCode, String)> {
    let result =
        sqlx::query_as("INSERT INTO expenses(amount, description) VALUES ($1, $2) RETURNING *")
            .bind(&payload.amount)
            .bind(&payload.description)
            .fetch_one(&pool)
            .await
            .map_err(bad_request)?;

    Ok(Json(result))
}

#[shuttle_service::main]
async fn axum(pool: PgPool) -> Result<SyncWrapper<Router>, shuttle_service::Error> {
    pool.execute(include_str!("../schema.sql"))
        .await
        .map_err(CustomError::new)?;

    let outing_routes = Router::new()
        .route("/", get(list_outings))
        .route("/", post(create_outing))
        .route("/:id", get(retrieve_outing));

    let person_routes = Router::new()
        .route("/", post(create_person))
        .route("/:id", get(retrieve_person));

    let expense_routes = Router::new().route("/", post(create_expense));

    let router = Router::new()
        .nest("/outings", outing_routes)
        .nest("/people", person_routes)
        .nest("/expenses", expense_routes)
        .layer(Extension(pool));

    let sync_wrapper = SyncWrapper::new(router);

    Ok(sync_wrapper)
}
