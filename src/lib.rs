/*
 * Birdie - Split group expenses using the minimal number of transactions
 *
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * Birdie is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * Birdie is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Birdie. If not, see <https://www.gnu.org/licenses/>.
 */

#![warn(clippy::all)]

use std::collections::VecDeque;

use axum::{
    extract::Path,
    http::StatusCode,
    routing::{get, get_service, post, put},
    Extension, Json, Router,
};
use flate2::read::GzDecoder;
use shuttle_service::{error::CustomError, ShuttleAxum};
use sqlx::{types::Decimal, Executor, PgPool};
use sync_wrapper::SyncWrapper;
use tar::Archive;
use tower_http::services::ServeDir;

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
    let result = sqlx::query_as(
        "WITH new_outing AS ( \
           INSERT INTO outings(name) VALUES ($1) RETURNING * \
         ), \
         new_outing_person AS ( \
           INSERT INTO outing_people(outing_id, person_id) \
           SELECT outing_id, $2 FROM new_outing \
         ) \
         SELECT * FROM new_outing",
    )
    .bind(&payload.name)
    .bind(&payload.person_id)
    .fetch_one(&pool)
    .await
    .map_err(bad_request)?;

    Ok(Json(result))
}

async fn retrieve_outing(
    Extension(pool): Extension<PgPool>,
    Path(outing_id): Path<i32>,
) -> Result<Json<OutingDetails>, (StatusCode, String)> {
    let outing = sqlx::query_as("SELECT * FROM outings WHERE outing_id = $1")
        .bind(outing_id)
        .fetch_optional(&pool)
        .await
        .map_err(internal_error)?;

    if let Some(outing) = outing {
        let people = sqlx::query_as(
            "SELECT p.* FROM outing_people NATURAL JOIN people AS p WHERE outing_id = $1",
        )
        .bind(outing_id)
        .fetch_all(&pool)
        .await
        .map_err(internal_error)?;

        Ok(Json(OutingDetails::new(outing, people)))
    } else {
        Err((
            StatusCode::NOT_FOUND,
            "Outing with given ID not found".to_string(),
        ))
    }
}

async fn retrieve_outing_balance(
    Extension(pool): Extension<PgPool>,
    Path(outing_id): Path<i32>,
) -> Result<Json<Balance>, (StatusCode, String)> {
    let result = sqlx::query_as(
        "SELECT COALESCE(SUM(amount), 0) AS total \
         FROM expenses WHERE outing_id = $1",
    )
    .bind(outing_id)
    .fetch_one(&pool)
    .await
    .map_err(internal_error)?;

    Ok(Json(result))
}

async fn query_outing_expenses(pool: &PgPool, outing_id: i32) -> Result<Vec<Expense>, sqlx::Error> {
    sqlx::query_as("SELECT * FROM expenses WHERE outing_id = $1")
        .bind(outing_id)
        .fetch_all(pool)
        .await
}

async fn retrieve_outing_expenses(
    Extension(pool): Extension<PgPool>,
    Path(outing_id): Path<i32>,
) -> Result<Json<Vec<Expense>>, (StatusCode, String)> {
    let result = query_outing_expenses(&pool, outing_id)
        .await
        .map_err(internal_error)?;

    Ok(Json(result))
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

async fn list_people(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<Person>>, (StatusCode, String)> {
    let result = sqlx::query_as("SELECT * FROM people LIMIT 500")
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
    let result = sqlx::query_as(
        "WITH op AS ( \
           INSERT INTO outing_people(outing_id, person_id) \
           VALUES ($1, $2) \
           ON CONFLICT DO NOTHING
         ) \
         INSERT INTO expenses(outing_id, person_id, amount, description) \
         VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(&payload.outing_id)
    .bind(&payload.person_id)
    .bind(&payload.amount)
    .bind(&payload.description)
    .fetch_one(&pool)
    .await
    .map_err(bad_request)?;

    Ok(Json(result))
}

async fn join_outing(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<OutingPerson>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query(
        "INSERT INTO outing_people(outing_id, person_id) \
         VALUES ($1, $2) \
         ON CONFLICT DO NOTHING",
    )
    .bind(&payload.outing_id)
    .bind(&payload.person_id)
    .execute(&pool)
    .await
    .map_err(bad_request)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn finish_outing(
    Extension(pool): Extension<PgPool>,
    Path(outing_id): Path<i32>,
) -> Result<Json<Vec<OutingResult>>, (StatusCode, String)> {
    // Here, a positive diff from avg indicates debt to the group, and negative
    // means the person is owed by the group
    let mut people_debts: VecDeque<PersonDiff> = VecDeque::from(
        sqlx::query_as(
            "WITH expenses_per_person AS ( \
               SELECT person_id, SUM(amount) AS amount_paid \
               FROM outing_people \
               NATURAL LEFT JOIN expenses \
               WHERE outing_id = $1 \
               GROUP BY person_id \
             ), group_avg AS ( \
               SELECT AVG(amount_paid) FROM expenses_per_person
             ) \
             SELECT \
               person_id, \
               (SELECT avg FROM group_avg) - amount_paid AS diff_from_avg \
             FROM expenses_per_person",
        )
        .bind(outing_id)
        .fetch_all(&pool)
        .await
        .map_err(internal_error)?,
    );

    let mut results = Vec::with_capacity(people_debts.len());

    while !people_debts.is_empty() {
        // Sorts in ascending order, so the person with highest debt to the
        // group comes at the back
        people_debts
            .make_contiguous()
            .sort_unstable_by_key(|pd| pd.diff_from_avg);

        let most_indebted = people_debts.pop_back().unwrap();

        if people_debts.is_empty() {
            if most_indebted.diff_from_avg > Decimal::new(1, 2) {
                eprintln!(
                    "Somebody was left over with an oustanding balance greater than 1 cent: {:?}",
                    most_indebted
                );
            }

            results.push(OutingResult {
                from: most_indebted.person_id,
                to: most_indebted.person_id,
                amount: most_indebted.diff_from_avg,
            });
        } else {
            let most_owed = people_debts.front_mut().unwrap();
            results.push(OutingResult {
                from: most_indebted.person_id,
                to: most_owed.person_id,
                amount: most_indebted.diff_from_avg,
            });
            // This works because most_owed's diff should be negative, while
            // most_indebted's diff should be positive.
            most_owed.diff_from_avg += most_indebted.diff_from_avg;
            if most_owed.diff_from_avg == Decimal::ZERO {
                people_debts.pop_front();
            }
        }
    }

    Ok(Json(results))
}

pub async fn app(pool: PgPool) -> Result<Router, shuttle_service::Error> {
    println!("Updating database schema");
    pool.execute(include_str!("../schema.sql"))
        .await
        .map_err(CustomError::new)?;

    println!("Building router");
    let outing_routes = Router::new()
        .route("/", get(list_outings))
        .route("/", post(create_outing))
        .route("/join", put(join_outing))
        .route("/:id", get(retrieve_outing))
        .route("/:id/balance", get(retrieve_outing_balance))
        .route("/:id/expenses", get(retrieve_outing_expenses))
        .route("/:id/finish", get(finish_outing));

    let person_routes = Router::new()
        .route("/", get(list_people))
        .route("/", post(create_person))
        .route("/:id", get(retrieve_person));

    let expense_routes = Router::new().route("/", post(create_expense));

    let router = Router::new()
        .nest(
            "/api",
            Router::new()
                .route("/ping", get(|| async { "pong" }))
                .nest("/outings", outing_routes)
                .nest("/people", person_routes)
                .nest("/expenses", expense_routes),
        )
        .fallback(
            get_service(ServeDir::new("./frontend")).handle_error(|_e| async {
                (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong...")
            }),
        )
        .layer(Extension(pool));

    Ok(router)
}

pub fn unpack_frontend() -> std::io::Result<()> {
    println!("Unpacking frontend bundle");
    let tar = GzDecoder::new(include_bytes!("../js.tar.gz").as_slice());
    let mut archive = Archive::new(tar);
    archive.unpack("./frontend")?;
    Ok(())
}

#[shuttle_service::main]
async fn axum(pool: PgPool) -> ShuttleAxum {
    unpack_frontend()?;
    Ok(SyncWrapper::new(app(pool).await?))
}
